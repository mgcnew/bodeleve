-- Bodeleve · funções da loja pública (visitante sem conta).
-- A loja NÃO lê as tabelas: lê estas funções, que devolvem só campos seguros (sem custo, fornecedor ou estoque) e
-- calculam preço, taxa e total no servidor. Ninguém escreve em orders direto.

create function public.store_info(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'name', e.name,
    'address', coalesce(e.address, ''),
    'whatsapp', coalesce(e.whatsapp, ''),
    'hours', e.hours,
    'delivery_fee_cents', coalesce((e.settings ->> 'delivery_fee_cents')::bigint, 0),
    'delivery_windows', e.settings -> 'delivery_windows',
    'pickup_windows', e.settings -> 'pickup_windows'
  )
  from public.establishments e where e.slug = p_slug;
$$;

create function public.store_categories(p_slug text)
returns table (slug text, name text, "position" int)
language sql stable security definer set search_path = '' as $$
  select c.slug, c.name, c.position
  from public.categories c
  join public.establishments e on e.id = c.establishment_id
  where e.slug = p_slug and not c.is_internal
    and exists (select 1 from public.products p where p.category_id = c.id and p.is_published and p.is_active)
  order by c.position, c.name;
$$;

create function public.store_catalog(p_slug text)
returns table (slug text, name text, unit text, price_cents bigint, origin public.item_origin, category_slug text, description text, details jsonb)
language sql stable security definer set search_path = '' as $$
  select p.slug, p.name, p.unit, p.price_cents, p.origin, c.slug, p.description, p.details
  from public.products p
  join public.establishments e on e.id = p.establishment_id
  left join public.categories c on c.id = p.category_id
  where e.slug = p_slug and p.is_published and p.is_active and p.item_type <> 'raw_material' and p.price_cents is not null
  order by p.name;
$$;

create function private.public_order(p_order public.orders)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'number', p_order.number,
    'status', p_order.status,
    'fulfillment', p_order.fulfillment,
    'created_at', p_order.created_at,
    'contact', jsonb_build_object('name', p_order.contact_name, 'phone', p_order.contact_phone),
    'address', p_order.address,
    'window', p_order.delivery_window,
    'subtotal_cents', p_order.subtotal_cents,
    'delivery_fee_cents', p_order.delivery_fee_cents,
    'total_cents', p_order.total_cents,
    'payment', jsonb_build_object('method', p_order.payment_method, 'paid', p_order.payment_paid, 'change_for_cents', p_order.change_for_cents),
    'delivery_code', p_order.delivery_code,
    'eta_label', p_order.eta_label,
    'courier_name', p_order.courier_name,
    'step_times', p_order.step_times,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('slug', p.slug, 'name', i.name, 'unit', i.unit, 'qty', i.qty, 'unit_price_cents', i.unit_price_cents) order by i.name)
      from public.order_items i left join public.products p on p.id = i.product_id
      where i.order_id = p_order.id
    ), '[]'::jsonb)
  );
$$;

-- Compra sem conta (D6): quem comprou acompanha pelo número do pedido e pelo celular informado.
create function public.track_order(p_slug text, p_number text, p_phone text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare o public.orders;
begin
  select ord.* into o
  from public.orders ord join public.establishments e on e.id = ord.establishment_id
  where e.slug = p_slug and ord.number = p_number and ord.channel = 'online'
    and regexp_replace(ord.contact_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 10;
  if not found then return null; end if;
  return private.public_order(o);
end;
$$;

create function public.track_orders(p_slug text, p_numbers text[], p_phone text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if array_length(p_numbers, 1) is null or array_length(p_numbers, 1) > 50 then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(private.public_order(ord) order by ord.created_at desc), '[]'::jsonb) into r
  from public.orders ord join public.establishments e on e.id = ord.establishment_id
  where e.slug = p_slug and ord.number = any (p_numbers) and ord.channel = 'online'
    and regexp_replace(ord.contact_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 10;
  return r;
end;
$$;

-- Finaliza o pedido da loja. Entrada (jsonb):
-- { items:[{slug, qty}], fulfillment:'delivery'|'pickup', contact:{name, phone}, address:{street, number, complement, district, reference, cep},
--   windowId, payment:{method:'pix'|'card_on_delivery'|'cash', changeForCents} }
create function public.place_order(p_slug text, p_order jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  est public.establishments;
  v_fulfillment public.fulfillment;
  v_method public.payment_method;
  v_name text := btrim(coalesce(p_order #>> '{contact,name}', ''));
  v_phone text := btrim(coalesce(p_order #>> '{contact,phone}', ''));
  v_digits text := regexp_replace(coalesce(p_order #>> '{contact,phone}', ''), '\D', '', 'g');
  v_addr jsonb := p_order -> 'address';
  v_window jsonb;
  v_fee bigint := 0;
  v_subtotal bigint := 0;
  v_change bigint := nullif(p_order #>> '{payment,changeForCents}', '')::bigint;
  v_enforce boolean;
  v_number text;
  v_code text;
  v_customer uuid;
  v_order public.orders;
  it record;
  v_count int;
  v_lines jsonb;
begin
  select * into est from public.establishments where slug = p_slug;
  if not found then raise exception 'store_not_found' using errcode = 'P0001'; end if;

  if length(v_name) < 2 or length(v_name) > 80 then raise exception 'invalid_contact' using errcode = 'P0001'; end if;
  if length(v_digits) not between 10 and 11 then raise exception 'invalid_contact' using errcode = 'P0001'; end if;

  begin
    v_fulfillment := (p_order ->> 'fulfillment')::public.fulfillment;
    v_method := (p_order #>> '{payment,method}')::public.payment_method;
  exception when others then
    raise exception 'invalid_order' using errcode = 'P0001';
  end;
  if v_fulfillment is null or v_fulfillment not in ('delivery', 'pickup') then raise exception 'invalid_fulfillment' using errcode = 'P0001'; end if;
  if v_method is null or v_method not in ('pix', 'card_on_delivery', 'cash') then raise exception 'invalid_payment' using errcode = 'P0001'; end if;
  if v_change is not null and v_change < 0 then raise exception 'invalid_payment' using errcode = 'P0001'; end if;

  if v_fulfillment = 'delivery' then
    if v_addr is null or jsonb_typeof(v_addr) <> 'object'
       or length(btrim(coalesce(v_addr ->> 'street', ''))) < 2 or length(btrim(coalesce(v_addr ->> 'number', ''))) < 1
       or length(btrim(coalesce(v_addr ->> 'district', ''))) < 2
       or length(v_addr::text) > 1000 then
      raise exception 'invalid_address' using errcode = 'P0001';
    end if;
    v_fee := coalesce((est.settings ->> 'delivery_fee_cents')::bigint, 0);
  else
    v_addr := null;
  end if;

  if coalesce(jsonb_typeof(p_order -> 'items'), '') <> 'array' or coalesce(jsonb_array_length(p_order -> 'items'), 0) not between 1 and 50 then
    raise exception 'empty_order' using errcode = 'P0001';
  end if;

  v_enforce := coalesce((est.settings ->> 'enforce_stock')::boolean, false);

  -- janela de entrega ou retirada: o texto vem das configurações da casa; id desconhecido fica só com o id
  select w.value into v_window
  from jsonb_array_elements(coalesce(est.settings -> case when v_fulfillment = 'delivery' then 'delivery_windows' else 'pickup_windows' end, '[]'::jsonb)) w
  where w.value ->> 'id' = p_order ->> 'windowId' limit 1;
  v_window := coalesce(v_window, jsonb_build_object('id', coalesce(p_order ->> 'windowId', 'asap')));

  -- quantidade válida (inteiro de 1 a 99) em toda linha, antes de qualquer conversão
  if exists (
    select 1 from jsonb_array_elements(p_order -> 'items') x
    where jsonb_typeof(x -> 'qty') <> 'number' or (x ->> 'qty') !~ '^[0-9]{1,2}$' or (x ->> 'qty')::int < 1 or coalesce(x ->> 'slug', '') = ''
  ) then
    raise exception 'invalid_quantity' using errcode = 'P0001';
  end if;

  -- um registro por produto (soma as linhas repetidas), com o preço de agora
  select coalesce(jsonb_agg(jsonb_build_object('product_id', p.id, 'name', p.name, 'unit', p.unit, 'qty', s.qty, 'price', p.price_cents)), '[]'::jsonb)
    into v_lines
  from (
    select x ->> 'slug' as slug, sum((x ->> 'qty')::int) as qty
    from jsonb_array_elements(p_order -> 'items') x group by 1
  ) s
  join public.products p on p.establishment_id = est.id and p.slug = s.slug
  where p.is_published and p.is_active and p.item_type <> 'raw_material' and p.price_cents is not null;

  select count(distinct x ->> 'slug') into v_count from jsonb_array_elements(p_order -> 'items') x;
  if jsonb_array_length(v_lines) <> v_count then raise exception 'unknown_product' using errcode = 'P0001'; end if;
  if exists (select 1 from jsonb_to_recordset(v_lines) as l(qty int) where l.qty > 99) then raise exception 'invalid_quantity' using errcode = 'P0001'; end if;

  if v_enforce then
    for it in
      select l.name, l.qty, coalesce(b.available, 0) as available
      from jsonb_to_recordset(v_lines) as l(product_id uuid, name text, qty int)
      left join public.product_balances b on b.product_id = l.product_id
    loop
      if it.qty > it.available then raise exception 'out_of_stock:%', it.name using errcode = 'P0001'; end if;
    end loop;
  end if;

  select sum(l.qty * l.price) into v_subtotal from jsonb_to_recordset(v_lines) as l(qty int, price bigint);

  v_number := (1000 + private.next_number(est.id, 'order'))::text;
  v_code := lpad((abs(('x' || substr(md5(gen_random_uuid()::text), 1, 7))::bit(28)::int) % 10000)::text, 4, '0');

  insert into public.customers (establishment_id, phone, name, since)
  values (est.id, v_phone, v_name, current_date)
  on conflict (establishment_id, phone) do update set name = public.customers.name
  returning id into v_customer;

  insert into public.orders (
    establishment_id, number, channel, fulfillment, status, customer_id, customer_user_id, contact_name, contact_phone,
    address, delivery_window, subtotal_cents, delivery_fee_cents, total_cents, payment_method, payment_paid, change_for_cents,
    delivery_code, step_times
  ) values (
    est.id, v_number, 'online', v_fulfillment, 'received', v_customer, (select auth.uid()), v_name, v_phone,
    v_addr, v_window, v_subtotal, v_fee, v_subtotal + v_fee, v_method, false, case when v_method = 'cash' then v_change else null end,
    v_code, jsonb_build_object('received', to_char(now() at time zone 'America/Sao_Paulo', 'HH24"h"MI'))
  ) returning * into v_order;

  insert into public.order_items (order_id, product_id, name, unit, kind, qty, unit_price_cents, total_cents)
  select v_order.id, l.product_id, l.name, l.unit, 'unit', l.qty, l.price, l.qty * l.price
  from jsonb_to_recordset(v_lines) as l(product_id uuid, name text, unit text, qty int, price bigint);

  return private.public_order(v_order);
end;
$$;

-- só estas funções são públicas; o resto do schema private fica fechado
revoke all on function public.store_info(text), public.store_categories(text), public.store_catalog(text),
  public.track_order(text, text, text), public.track_orders(text, text[], text), public.place_order(text, jsonb) from public;
grant execute on function public.store_info(text), public.store_categories(text), public.store_catalog(text),
  public.track_order(text, text, text), public.track_orders(text, text[], text), public.place_order(text, jsonb) to anon, authenticated;
revoke all on function private.public_order(public.orders) from public, anon, authenticated;
