-- Bodeleve · funções de escrita de pedidos, balcão (PDV e caixa), financeiro e entregas.
-- Tudo que mexe em estoque, caixa e dinheiro passa só por aqui (security definer, com checagem de papel por estabelecimento).
-- Erros previsíveis voltam como exceção P0001 com o código na mensagem (ex.: 'insufficient_stock'); falta de permissão é 42501 'forbidden'.
-- Hipóteses de operação ficam em establishments.settings (minutos por km, km por bairro, prazo do parceiro) e podem ser trocadas sem tocar em função.

-- ───────── ajustes de tabela ─────────
alter table public.financial_transactions add column order_id uuid references public.orders (id) on delete set null;
create index financial_transactions_order_idx on public.financial_transactions (order_id) where order_id is not null;

-- Senha de gestor (cancelar venda). Só o hash; ninguém lê esta tabela pelo app, só as funções.
create table public.manager_pins (
  membership_id uuid primary key references public.memberships (id) on delete cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);
alter table public.manager_pins enable row level security;

-- Tentativas erradas, para travar força bruta. Guardadas fora da transação que falha (a função devolve o erro, não lança).
create table public.pin_failures (
  id bigint generated always as identity primary key,
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  user_id uuid not null,
  at timestamptz not null default now()
);
create index pin_failures_lookup_idx on public.pin_failures (establishment_id, user_id, at desc);
alter table public.pin_failures enable row level security;

-- Hipóteses da entrega (H-I69 em diante): trocam aqui, sem refazer telas.
update public.establishments
   set settings = settings || jsonb_build_object(
     'minutes_per_km', 3,
     'partner_timeout_minutes', 10,
     'district_km', jsonb_build_object('Centro', 1.8, 'Bairro Alto', 4.1, 'Jardim das Flores', 3.3, 'Vila Nova', 2.6))
 where not (settings ? 'minutes_per_km');

-- ───────── auxiliares ─────────
create function private.hhmm(p_at timestamptz)
returns text language sql immutable set search_path = '' as $$
  select to_char(p_at at time zone 'America/Sao_Paulo', 'HH24:MI');
$$;

-- Peso de 1 unidade em kg: "500 g" → 0,5; "1 kg" → 1; outra medida → null.
create function private.unit_kg(p_unit text)
returns numeric language plpgsql immutable set search_path = '' as $$
declare m text[]; n numeric;
begin
  m := regexp_match(lower(btrim(coalesce(p_unit, ''))), '^(\d+(?:[.,]\d+)?)\s*(kg|g)$');
  if m is null then return null; end if;
  n := replace(m[1], ',', '.')::numeric;
  if n <= 0 then return null; end if;
  return case when m[2] = 'kg' then n else n / 1000 end;
end;
$$;

create function private.account_id(p_establishment uuid, p_kind public.account_kind)
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.financial_accounts where establishment_id = p_establishment and kind = p_kind;
$$;

create function private.add_tx(p_establishment uuid, p_kind_account public.account_kind, p_amount bigint, p_kind public.tx_kind, p_title text, p_note text,
                               p_order uuid default null, p_transfer uuid default null, p_reversal uuid default null, p_entry uuid default null, p_principal bigint default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  insert into public.financial_transactions (establishment_id, account_id, amount_cents, kind, title, note, order_id, transfer_id, reversal_of, entry_id, principal_cents)
  values (p_establishment, private.account_id(p_establishment, p_kind_account), p_amount, p_kind, p_title, coalesce(p_note, ''), p_order, p_transfer, p_reversal, p_entry, p_principal)
  returning id into v;
  return v;
end;
$$;

-- Dinheiro que deve estar na gaveta: troco de abertura + vendas em dinheiro + suprimentos − sangrias.
create function private.cash_expected(p_session uuid)
returns bigint language sql stable security definer set search_path = '' as $$
  select s.opening_cents
       + coalesce((s.baseline ->> 'cashCents')::bigint, 0)
       + coalesce((select sum(p.cents) from public.payments p join public.orders o on o.id = p.order_id
                    where o.cash_session_id = s.id and o.status <> 'cancelled' and p.method = 'cash'), 0)
       + coalesce((select sum(case when m.kind = 'sangria' then -m.cents else m.cents end) from public.cash_movements m where m.session_id = s.id), 0)
  from public.cash_sessions s where s.id = p_session;
$$;

-- Saída de estoque de um pedido, no que existir (o que faltar não trava a entrega: a venda online pode ter passado do estoque, H-I31).
create function private.order_take_stock(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders; it record; v_avail numeric; v_take numeric;
begin
  select * into o from public.orders where id = p_order;
  for it in select product_id, sum(qty) as qty from public.order_items where order_id = p_order and product_id is not null group by product_id loop
    select coalesce(sum(m.qty), 0) into v_avail from public.stock_movements m where m.product_id = it.product_id and m.lot_id is not null;
    v_take := least(it.qty, greatest(v_avail, 0));
    if v_take > 0 then
      perform private.consume_stock(o.establishment_id, it.product_id, v_take, 'sale_out', o.number, 'Venda online · pedido #' || o.number, p_order);
    end if;
  end loop;
end;
$$;

-- Devolve ao mesmo lote o que saiu do pedido (entrega devolvida, venda cancelada).
create function private.order_return_stock(p_order uuid, p_description text)
returns void language plpgsql security definer set search_path = '' as $$
declare m record;
begin
  for m in
    select * from public.stock_movements x
     where x.batch_id = p_order and x.type = 'sale_out' and x.reversal_of is null
       and not exists (select 1 from public.stock_movements r where r.reversal_of = x.id)
  loop
    insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name, batch_id, reversal_of)
    values (m.establishment_id, m.product_id, m.lot_id, 'adjustment', -m.qty, m.ref, p_description, (select auth.uid()), private.actor_name(m.establishment_id), m.batch_id, m.id);
  end loop;
end;
$$;

-- ───────── senha de gestor ─────────
create function public.set_my_pin(p_establishment uuid, p_pin text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_member uuid;
begin
  select id into v_member from public.memberships
   where user_id = (select auth.uid()) and establishment_id = p_establishment and status = 'active' and role in ('owner', 'manager');
  if v_member is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_pin is null or p_pin !~ '^\d{4,8}$' then raise exception 'invalid_pin_format' using errcode = 'P0001'; end if;
  insert into public.manager_pins (membership_id, pin_hash) values (v_member, extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (membership_id) do update set pin_hash = excluded.pin_hash, updated_at = now();
end;
$$;

-- ───────── pedidos ─────────
create function public.order_accept(p_order uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'orders') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.channel <> 'online' or o.status <> 'received' then raise exception 'invalid_transition' using errcode = 'P0001'; end if;
  update public.orders set status = 'preparing', step_times = step_times || jsonb_build_object('preparing', private.hhmm(now())) where id = o.id
  returning * into o;
  return jsonb_build_object('status', o.status, 'step_times', o.step_times);
end;
$$;

create function public.order_mark_ready(p_order uuid, p_checked uuid[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; v_next public.order_status;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'orders') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.channel <> 'online' or o.status <> 'preparing' then raise exception 'invalid_transition' using errcode = 'P0001'; end if;
  if exists (select 1 from public.order_items i where i.order_id = o.id and i.product_id is not null and not (i.product_id = any (coalesce(p_checked, '{}')))) then
    raise exception 'items_not_checked' using errcode = 'P0001';
  end if;
  v_next := case when o.fulfillment = 'delivery' then 'ready_for_delivery'::public.order_status else 'ready_for_pickup'::public.order_status end;
  update public.orders set status = v_next, step_times = step_times || jsonb_build_object(v_next::text, private.hhmm(now())) where id = o.id
  returning * into o;
  return jsonb_build_object('status', o.status, 'step_times', o.step_times);
end;
$$;

create function public.order_undo_ready(p_order uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'orders') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.channel <> 'online' or o.status not in ('ready_for_delivery', 'ready_for_pickup') then raise exception 'invalid_transition' using errcode = 'P0001'; end if;
  if exists (select 1 from public.deliveries d where d.order_id = o.id and d.status not in ('delivered', 'returned')) then
    raise exception 'has_delivery' using errcode = 'P0001';
  end if;
  update public.orders set status = 'preparing' where id = o.id returning * into o;
  return jsonb_build_object('status', o.status, 'step_times', o.step_times);
end;
$$;

-- Retirada na loja: quem comprou veio buscar. O estoque sai agora (até aqui estava reservado).
create function public.order_complete_pickup(p_order uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'orders') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.channel <> 'online' or o.fulfillment <> 'pickup' or o.status <> 'ready_for_pickup' then raise exception 'invalid_transition' using errcode = 'P0001'; end if;
  perform private.order_take_stock(o.id);
  update public.orders set status = 'picked_up', payment_paid = true, step_times = step_times || jsonb_build_object('picked_up', private.hhmm(now())) where id = o.id
  returning * into o;
  return jsonb_build_object('status', o.status, 'step_times', o.step_times);
end;
$$;

-- ───────── balcão: caixa e vendas ─────────
create function public.pos_open_session(p_establishment uuid, p_opening_cents bigint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  if not private.can_staff(p_establishment, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_opening_cents is null or p_opening_cents < 0 then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  if exists (select 1 from public.cash_sessions where establishment_id = p_establishment and status = 'open') then
    raise exception 'session_open' using errcode = 'P0001';
  end if;
  insert into public.cash_sessions (establishment_id, opened_by, opened_by_name, opening_cents)
  values (p_establishment, (select auth.uid()), private.actor_name(p_establishment), p_opening_cents) returning id into v;
  return v;
end;
$$;

-- Entrada (jsonb): { lines:[{product_id, kind:'unit'|'weight', qty}], discount:{kind:'p5'|'p10'|'f500'|'round', reason}|null,
--                    payments:[{method:'cash'|'pix'|'debit'|'credit', cents, received_cents}], offline:bool }
create function public.pos_checkout(p_establishment uuid, p_sale jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.cash_sessions; ln record; pr public.products; v_lines jsonb := '[]'::jsonb; v_subtotal bigint := 0;
  v_kind text; v_qty numeric; v_price bigint; v_total bigint; v_units numeric; v_per numeric;
  v_dkind text := p_sale #>> '{discount,kind}'; v_dreason text := p_sale #>> '{discount,reason}'; v_disc bigint := 0;
  v_pay jsonb; v_paid bigint := 0; v_change bigint := 0; v_cash bigint := 0; v_pix bigint := 0;
  v_number text; v_order public.orders; v_item uuid; v_lots jsonb; v_avail numeric; pay record;
  v_method text; v_cents bigint; v_received bigint; v_first text; v_offline boolean := coalesce((p_sale ->> 'offline')::boolean, false);
begin
  if not private.can_staff(p_establishment, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into s from public.cash_sessions where establishment_id = p_establishment and status = 'open' for update;
  if not found then raise exception 'no_session' using errcode = 'P0001'; end if;
  if coalesce(jsonb_typeof(p_sale -> 'lines'), '') <> 'array' or jsonb_array_length(p_sale -> 'lines') = 0 then raise exception 'empty_cart' using errcode = 'P0001'; end if;
  if coalesce(jsonb_typeof(p_sale -> 'payments'), '') <> 'array' or jsonb_array_length(p_sale -> 'payments') = 0 then raise exception 'invalid_payment' using errcode = 'P0001'; end if;

  -- preços vêm sempre do cadastro (nunca do aparelho)
  for ln in select (x ->> 'product_id')::uuid as product_id, coalesce(x ->> 'kind', 'unit') as kind, (x ->> 'qty')::numeric as qty from jsonb_array_elements(p_sale -> 'lines') x loop
    select * into pr from public.products where id = ln.product_id and establishment_id = p_establishment;
    if not found or pr.item_type = 'raw_material' or pr.price_cents is null then raise exception 'unknown_product' using errcode = 'P0001'; end if;
    if ln.qty is null or ln.qty <= 0 then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
    if ln.kind = 'unit' then
      if ln.qty <> trunc(ln.qty) then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
      v_price := pr.price_cents; v_total := round(ln.qty * v_price); v_units := ln.qty;
    elsif ln.kind = 'weight' then
      if pr.weight_price_cents is null or not pr.sold_by_weight then raise exception 'unknown_product' using errcode = 'P0001'; end if;
      v_per := private.unit_kg(pr.unit);
      v_price := pr.weight_price_cents; v_total := round(v_price * ln.qty);
      v_units := case when v_per is null then ln.qty else round(ln.qty / v_per, 4) end;
    else
      raise exception 'invalid_qty' using errcode = 'P0001';
    end if;
    v_subtotal := v_subtotal + v_total;
    v_lines := v_lines || jsonb_build_object('product_id', pr.id, 'name', pr.name, 'unit', pr.unit, 'kind', ln.kind, 'qty', ln.qty, 'unit_price', v_price, 'total', v_total, 'units', v_units);
  end loop;

  -- estoque disponível por produto (o mesmo produto pode estar em mais de uma linha)
  for ln in select (x ->> 'product_id')::uuid as product_id, sum((x ->> 'units')::numeric) as need from jsonb_array_elements(v_lines) x group by 1 loop
    select coalesce(sum(m.qty), 0) into v_avail from public.stock_movements m where m.product_id = ln.product_id and m.lot_id is not null;
    if ln.need > v_avail then raise exception 'insufficient_stock:%', ln.product_id using errcode = 'P0001'; end if;
  end loop;

  if v_dkind is not null then
    v_disc := case v_dkind when 'p5' then round(v_subtotal * 0.05) when 'p10' then round(v_subtotal * 0.1) when 'f500' then 500 when 'round' then v_subtotal % 100
                           else null end;
    if v_disc is null then raise exception 'invalid_discount' using errcode = 'P0001'; end if;
    v_disc := least(v_disc, v_subtotal);
    if v_disc = 0 then v_dkind := null; v_dreason := null; end if;
  end if;
  v_total := v_subtotal - v_disc;

  -- pagamento: soma exata do total; dinheiro pode ter valor entregue maior (troco)
  for pay in select x ->> 'method' as method, (x ->> 'cents')::bigint as cents, nullif(x ->> 'received_cents', '')::bigint as received from jsonb_array_elements(p_sale -> 'payments') x loop
    if pay.method not in ('cash', 'pix', 'debit', 'credit') or pay.cents is null or pay.cents <= 0 then raise exception 'invalid_payment' using errcode = 'P0001'; end if;
    if pay.received is not null and pay.method = 'cash' and pay.received < pay.cents then raise exception 'invalid_payment' using errcode = 'P0001'; end if;
    v_paid := v_paid + pay.cents;
    if pay.method = 'cash' then v_cash := v_cash + pay.cents; v_change := v_change + coalesce(pay.received - pay.cents, 0); end if;
    if pay.method = 'pix' then v_pix := v_pix + pay.cents; end if;
    v_first := coalesce(v_first, pay.method);
  end loop;
  if v_paid <> v_total or v_total <= 0 then raise exception 'invalid_payment' using errcode = 'P0001'; end if;

  v_number := 'V-' || lpad(private.next_number(p_establishment, 'pos')::text, 4, '0');
  insert into public.orders (establishment_id, number, channel, fulfillment, status, subtotal_cents, discount_kind, discount_cents, discount_reason, total_cents,
                             payment_method, payment_paid, cash_session_id, created_by, created_by_name, pending_sync)
  values (p_establishment, v_number, 'pos', 'counter', 'completed', v_subtotal, v_dkind, v_disc, v_dreason, v_total,
          case when jsonb_array_length(p_sale -> 'payments') = 1 then v_first::public.payment_method end, true, s.id,
          (select auth.uid()), private.actor_name(p_establishment), v_offline)
  returning * into v_order;

  for ln in select x from jsonb_array_elements(v_lines) x loop
    v_lots := (select coalesce(jsonb_agg(jsonb_build_object('lotCode', c ->> 'code', 'qty', (c ->> 'qty')::numeric)), '[]'::jsonb)
               from jsonb_array_elements(private.consume_stock(p_establishment, (ln.x ->> 'product_id')::uuid, (ln.x ->> 'units')::numeric, 'sale_out', v_number, 'Venda no balcão', v_order.id)) c);
    insert into public.order_items (order_id, product_id, name, unit, kind, qty, unit_price_cents, total_cents, lots)
    values (v_order.id, (ln.x ->> 'product_id')::uuid, ln.x ->> 'name', ln.x ->> 'unit', ln.x ->> 'kind', (ln.x ->> 'qty')::numeric, (ln.x ->> 'unit_price')::bigint, (ln.x ->> 'total')::bigint, v_lots);
  end loop;

  for pay in select x ->> 'method' as method, (x ->> 'cents')::bigint as cents, nullif(x ->> 'received_cents', '')::bigint as received from jsonb_array_elements(p_sale -> 'payments') x loop
    insert into public.payments (establishment_id, order_id, method, cents, received_cents) values (p_establishment, v_order.id, pay.method::public.payment_method, pay.cents, pay.received);
  end loop;

  if v_cash > 0 then perform private.add_tx(p_establishment, 'cash', v_cash, 'sale', 'Venda ' || v_number || ' · dinheiro', 'Balcão', v_order.id); end if;
  if v_pix > 0 then perform private.add_tx(p_establishment, 'bank', v_pix, 'sale', 'Venda ' || v_number || ' · Pix', 'Balcão', v_order.id); end if;

  return jsonb_build_object('order_id', v_order.id, 'number', v_number, 'subtotal_cents', v_subtotal, 'discount_cents', v_disc, 'total_cents', v_total, 'change_cents', v_change);
end;
$$;

-- Cancelamento precisa da senha de um gestor. Erro de senha volta como { error } (não lança) para a tentativa ficar registrada.
create function public.pos_cancel_sale(p_order uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  o public.orders; v_uid uuid := (select auth.uid()); v_fails int; v_approver record; t record;
begin
  select * into o from public.orders where id = p_order for update;
  if not found or o.channel <> 'pos' then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.status = 'cancelled' then raise exception 'already_cancelled' using errcode = 'P0001'; end if;

  select count(*) into v_fails from public.pin_failures where establishment_id = o.establishment_id and user_id = v_uid and at > now() - interval '10 minutes';
  if v_fails >= 5 then return jsonb_build_object('error', 'pin_locked'); end if;

  select m.id, coalesce(nullif(m.display_name, ''), (select full_name from public.profiles pr where pr.id = m.user_id), 'Gestor') as name, m.role
    into v_approver
    from public.memberships m join public.manager_pins mp on mp.membership_id = m.id
   where m.establishment_id = o.establishment_id and m.status = 'active' and m.role in ('owner', 'manager')
     and mp.pin_hash = extensions.crypt(coalesce(p_pin, ''), mp.pin_hash)
   limit 1;
  if v_approver.id is null then
    insert into public.pin_failures (establishment_id, user_id) values (o.establishment_id, v_uid);
    return jsonb_build_object('error', 'invalid_pin');
  end if;

  perform private.order_return_stock(o.id, 'Venda ' || o.number || ' cancelada · volta ao estoque');
  for t in select * from public.financial_transactions x where x.order_id = o.id and x.reversal_of is null
            and not exists (select 1 from public.financial_transactions r where r.reversal_of = x.id) loop
    insert into public.financial_transactions (establishment_id, account_id, amount_cents, kind, title, note, order_id, reversal_of)
    values (t.establishment_id, t.account_id, -t.amount_cents, 'sale', replace(t.title, ' · ', ' cancelada · '), 'Balcão', o.id, t.id);
  end loop;
  update public.orders
     set status = 'cancelled', cancelled_at = now(), cancelled_by_name = private.actor_name(o.establishment_id),
         approved_by_name = v_approver.name || case v_approver.role when 'owner' then ' (Dono)' else ' (Gerente)' end
   where id = o.id;
  return jsonb_build_object('ok', true, 'approved_by', v_approver.name);
end;
$$;

create function public.pos_cash_movement(p_establishment uuid, p_kind text, p_cents bigint, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.cash_sessions; v_expected bigint; v_transfer uuid;
begin
  if not private.can_staff(p_establishment, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into s from public.cash_sessions where establishment_id = p_establishment and status = 'open' for update;
  if not found then raise exception 'no_session' using errcode = 'P0001'; end if;
  if p_kind not in ('sangria', 'suprimento') or p_cents is null or p_cents <= 0 or btrim(coalesce(p_reason, '')) = '' then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  v_expected := private.cash_expected(s.id);
  if p_kind = 'sangria' and p_cents > v_expected then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  insert into public.cash_movements (establishment_id, session_id, kind, cents, reason, created_by, created_by_name)
  values (p_establishment, s.id, p_kind, p_cents, p_reason, (select auth.uid()), private.actor_name(p_establishment));
  if p_kind = 'sangria' and p_reason = 'Levar ao banco' then
    v_transfer := gen_random_uuid();
    perform private.add_tx(p_establishment, 'cash', -p_cents, 'transfer', 'Sangria do caixa', 'Caixa → banco · transferência entre contas', null, v_transfer);
    perform private.add_tx(p_establishment, 'bank', p_cents, 'transfer', 'Sangria do caixa', 'Caixa → banco · transferência entre contas', null, v_transfer);
  else
    perform private.add_tx(p_establishment, 'cash', case when p_kind = 'sangria' then -p_cents else p_cents end, 'manual',
                           initcap(p_kind) || ' · ' || p_reason, 'Caixa do balcão');
  end if;
  return jsonb_build_object('session_id', s.id, 'expected_cents', private.cash_expected(s.id));
end;
$$;

create function public.pos_close_session(p_establishment uuid, p_counted_cents bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.cash_sessions; v_expected bigint; v_diff bigint; v_tx uuid;
begin
  if not private.can_staff(p_establishment, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into s from public.cash_sessions where establishment_id = p_establishment and status = 'open' for update;
  if not found then raise exception 'no_session' using errcode = 'P0001'; end if;
  if p_counted_cents is null or p_counted_cents < 0 then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  v_expected := private.cash_expected(s.id);
  v_diff := p_counted_cents - v_expected;
  -- a diferença acerta o saldo do caixa no financeiro: o que está na gaveta é o que foi contado
  if v_diff <> 0 then
    v_tx := private.add_tx(p_establishment, 'cash', v_diff, 'manual', 'Diferença do caixa · ' || case when v_diff > 0 then 'sobra' else 'falta' end, 'Fechamento do caixa');
  end if;
  update public.cash_sessions
     set status = 'closed', closed_at = now(), closed_by = (select auth.uid()), counted_cents = p_counted_cents, expected_cents = v_expected, difference_tx_id = v_tx
   where id = s.id;
  return jsonb_build_object('session_id', s.id, 'expected_cents', v_expected, 'counted_cents', p_counted_cents, 'difference_cents', v_diff);
end;
$$;

create function public.pos_reopen_session(p_establishment uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare s public.cash_sessions; v_diff bigint; t public.financial_transactions;
begin
  if not private.can_staff(p_establishment, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  if exists (select 1 from public.cash_sessions where establishment_id = p_establishment and status = 'open') then raise exception 'session_open' using errcode = 'P0001'; end if;
  select * into s from public.cash_sessions where establishment_id = p_establishment and status = 'closed' order by closed_at desc limit 1 for update;
  if not found then raise exception 'no_session' using errcode = 'P0001'; end if;
  if s.difference_tx_id is not null then
    select * into t from public.financial_transactions where id = s.difference_tx_id;
    if found then
      insert into public.financial_transactions (establishment_id, account_id, amount_cents, kind, title, note, reversal_of)
      values (t.establishment_id, t.account_id, -t.amount_cents, 'manual', 'Diferença do caixa desfeita', 'Caixa reaberto para corrigir', t.id);
    end if;
  end if;
  update public.cash_sessions set status = 'open', closed_at = null, closed_by = null, counted_cents = null, expected_cents = null, difference_tx_id = null where id = s.id;
  return s.id;
end;
$$;

-- D21: o comprovante só é guardado na caixa de saída; nenhuma mensagem sai.
create function public.pos_send_receipt(p_order uuid, p_phone text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare o public.orders; v uuid; v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  select * into o from public.orders where id = p_order;
  if not found or o.channel <> 'pos' then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  if length(v_digits) not between 10 and 11 then raise exception 'invalid_phone' using errcode = 'P0001'; end if;
  insert into public.outbox_messages (establishment_id, kind, recipient, body)
  values (o.establishment_id, 'receipt', v_digits, 'Comprovante da venda ' || o.number || ' · total R$ ' || replace(to_char(o.total_cents / 100.0, 'FM999999990D00'), '.', ','))
  returning id into v;
  return v;
end;
$$;

create function public.pos_sync_pending(p_establishment uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not private.can_staff(p_establishment, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.orders set pending_sync = false where establishment_id = p_establishment and channel = 'pos' and pending_sync;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ───────── financeiro ─────────
create function public.pay_entry(p_entry uuid, p_amount_cents bigint, p_fine_cents bigint, p_account text, p_method text, p_paid_at timestamptz default now())
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e public.financial_entries; v_kind public.account_kind; v_acc uuid; v_bal bigint; v_total bigint; v_tx uuid; v_next uuid; v_remaining bigint;
begin
  select * into e from public.financial_entries where id = p_entry for update;
  if not found or e.direction <> 'payable' then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(e.establishment_id, 'finance') then raise exception 'forbidden' using errcode = '42501'; end if;
  if e.paid_at is not null or e.paid_cents >= e.amount_cents then raise exception 'already_paid' using errcode = 'P0001'; end if;
  v_remaining := e.amount_cents - e.paid_cents;
  if p_amount_cents is null or p_amount_cents <= 0 or p_amount_cents > v_remaining or coalesce(p_fine_cents, 0) < 0 then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  begin v_kind := p_account::public.account_kind; exception when others then raise exception 'invalid_account' using errcode = 'P0001'; end;
  select id into v_acc from public.financial_accounts where establishment_id = e.establishment_id and kind = v_kind for update;
  select coalesce(sum(amount_cents), 0) into v_bal from public.financial_transactions where account_id = v_acc;
  v_total := p_amount_cents + coalesce(p_fine_cents, 0);
  if v_bal < v_total then raise exception 'insufficient_balance:%', v_bal using errcode = 'P0001'; end if;

  v_tx := private.add_tx(e.establishment_id, v_kind, -v_total, 'payment', coalesce(e.title, e.description),
                         coalesce(p_method, '') || coalesce(' · ' || e.ref, '') || case when coalesce(p_fine_cents, 0) > 0 then ' · com multa e juros' else '' end,
                         null, null, null, e.id, p_amount_cents);
  update public.financial_entries set paid_cents = paid_cents + p_amount_cents where id = e.id returning * into e;
  if e.paid_cents >= e.amount_cents then
    update public.financial_entries set paid_at = coalesce(p_paid_at, now()) where id = e.id;
    if e.recurring then
      insert into public.financial_entries (establishment_id, direction, description, title, kind_label, amount_cents, due_at, origin, ref, supplier_id, note, tag, recurring, generated_from)
      values (e.establishment_id, e.direction, e.description, e.title, e.kind_label, e.amount_cents, e.due_at + interval '1 month', e.origin, e.ref, e.supplier_id, e.note, e.tag, true, e.id)
      returning id into v_next;
    end if;
  end if;
  return jsonb_build_object('transaction_id', v_tx, 'balance_after', v_bal - v_total, 'next_entry_id', v_next);
end;
$$;

create function public.undo_payment(p_transaction uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.financial_transactions; e public.financial_entries;
begin
  select * into t from public.financial_transactions where id = p_transaction for update;
  if not found or t.kind <> 'payment' or t.entry_id is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(t.establishment_id, 'finance') then raise exception 'forbidden' using errcode = '42501'; end if;
  if exists (select 1 from public.financial_transactions r where r.reversal_of = t.id) then raise exception 'cannot_reverse' using errcode = 'P0001'; end if;
  select * into e from public.financial_entries where id = t.entry_id for update;
  -- a próxima despesa fixa só some se ninguém mexeu nela
  if exists (select 1 from public.financial_entries f where f.generated_from = e.id and f.paid_cents > 0) then raise exception 'cannot_reverse' using errcode = 'P0001'; end if;
  insert into public.financial_transactions (establishment_id, account_id, amount_cents, kind, title, note, entry_id, reversal_of)
  values (t.establishment_id, t.account_id, -t.amount_cents, 'manual', 'Pagamento desfeito · ' || t.title, '', e.id, t.id);
  delete from public.financial_entries where generated_from = e.id;
  update public.financial_entries
     set paid_cents = greatest(0, paid_cents - coalesce(t.principal_cents, -t.amount_cents)),
         paid_at = null
   where id = e.id;
end;
$$;

-- ───────── entregas: equipe ─────────
create function public.delivery_assign(p_order uuid, p_courier uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; c public.couriers; est public.establishments; v_status public.delivery_status; v_items int; v_id uuid; v_fee bigint; v_route boolean;
begin
  select * into o from public.orders where id = p_order for update;
  if not found or o.fulfillment <> 'delivery' then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'deliveries') then raise exception 'forbidden' using errcode = '42501'; end if;
  if exists (select 1 from public.deliveries d where d.order_id = o.id and d.status not in ('delivered', 'returned')) then raise exception 'already_assigned' using errcode = 'P0001'; end if;
  if o.status <> 'ready_for_delivery' then raise exception 'not_ready' using errcode = 'P0001'; end if;
  select * into est from public.establishments where id = o.establishment_id;
  select coalesce(sum(qty), 0)::int into v_items from public.order_items where order_id = o.id;

  if p_courier is null then
    v_status := 'published'; v_fee := coalesce((est.settings ->> 'partner_fee_cents')::bigint, 900);
  else
    select * into c from public.couriers where id = p_courier and establishment_id = o.establishment_id and kind = 'own';
    if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
    v_route := exists (select 1 from public.deliveries d where d.courier_id = c.id and d.status = 'en_route');
    v_status := case when v_route then 'reserved'::public.delivery_status else 'assigned'::public.delivery_status end;
  end if;
  insert into public.deliveries (establishment_id, order_id, courier_id, status, fee_cents, items)
  values (o.establishment_id, o.id, p_courier, v_status, v_fee, v_items) returning id into v_id;
  return jsonb_build_object('delivery_id', v_id, 'status', v_status, 'courier_name', c.name);
end;
$$;

-- Só dá para desfazer enquanto a entrega não saiu.
create function public.delivery_unassign(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare d public.deliveries;
begin
  select * into d from public.deliveries where order_id = p_order and status not in ('delivered', 'returned') for update;
  if not found or d.status = 'en_route' then raise exception 'no_assignment' using errcode = 'P0001'; end if;
  if not private.can_staff(d.establishment_id, 'deliveries') then raise exception 'forbidden' using errcode = '42501'; end if;
  delete from public.deliveries where id = d.id;
end;
$$;

-- Entrega publicada que ninguém aceitou no prazo volta para a casa (H-I71). Chamada pela tela de atribuição ou por rotina.
create function public.delivery_expire_published(p_establishment uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare est public.establishments; n int;
begin
  if not private.can_staff(p_establishment, 'deliveries') then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into est from public.establishments where id = p_establishment;
  delete from public.deliveries
   where establishment_id = p_establishment and status = 'published' and courier_id is null
     and at < now() - make_interval(mins => coalesce((est.settings ->> 'partner_timeout_minutes')::int, 10));
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ───────── entregas: app do entregador ─────────
-- O entregador entra pelo celular (Auth). Ao entrar, a conta é ligada ao cadastro que a casa fez com o mesmo número.
-- D21: o código por SMS/WhatsApp é mensagem real; só liga depois que o dono aprovar.
create function public.courier_link()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_phone text; c public.couriers;
begin
  if v_uid is null then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into c from public.couriers where user_id = v_uid;
  if not found then
    select right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 11) into v_phone from auth.users u where u.id = v_uid;
    if coalesce(v_phone, '') = '' then raise exception 'unknown_phone' using errcode = 'P0001'; end if;
    update public.couriers set user_id = v_uid
     where user_id is null and right(regexp_replace(phone, '\D', '', 'g'), 11) = v_phone
    returning * into c;
    if not found then raise exception 'unknown_phone' using errcode = 'P0001'; end if;
  end if;
  return jsonb_build_object('id', c.id, 'establishment_id', c.establishment_id, 'name', c.name, 'kind', c.kind, 'phone', c.phone, 'vehicle', c.vehicle, 'available', c.available, 'pix_key', c.pix_key);
end;
$$;

create function private.me_courier()
returns public.couriers language plpgsql stable security definer set search_path = '' as $$
declare c public.couriers;
begin
  select * into c from public.couriers where user_id = (select auth.uid());
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  return c;
end;
$$;

create function public.courier_set_available(p_available boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.couriers := private.me_courier();
begin
  update public.couriers set available = coalesce(p_available, available) where id = c.id;
end;
$$;

create function public.courier_save_pix(p_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.couriers := private.me_courier();
begin
  update public.couriers set pix_key = left(btrim(coalesce(p_key, '')), 120) where id = c.id;
end;
$$;

-- Cartão de entrega para o app. Nunca inclui o código de confirmação.
create function private.courier_card(p_order public.orders, p_delivery public.deliveries, p_full boolean)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'order_id', p_order.id, 'number', p_order.number,
    'state', coalesce(p_delivery.status::text, 'free'),
    'district', coalesce(p_order.address ->> 'district', ''),
    'street', coalesce(nullif(btrim(coalesce(p_order.address ->> 'street', '') || ' ' || coalesce(p_order.address ->> 'number', '')), ''), ''),
    'items', coalesce((select sum(qty)::int from public.order_items where order_id = p_order.id), 0),
    'total_cents', p_order.total_cents, 'payment_method', p_order.payment_method, 'payment_paid', p_order.payment_paid,
    'change_for_cents', p_order.change_for_cents,
    'fee_cents', p_delivery.fee_cents, 'at', p_delivery.at, 'expected_at', p_delivery.expected_at, 'return_at', p_delivery.return_at,
    'problem_reason', p_delivery.problem_reason)
  || case when p_full then jsonb_build_object('customer', p_order.contact_name, 'phone', p_order.contact_phone,
                                              'address', p_order.address) else '{}'::jsonb end;
$$;

create function public.courier_list()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare c public.couriers := private.me_courier(); v_avail jsonb := '[]'::jsonb; v_mine jsonb;
begin
  v_mine := coalesce((
    select jsonb_agg(private.courier_card(o, d, true) order by case d.status when 'en_route' then 0 when 'accepted' then 1 when 'assigned' then 2 when 'reserved' then 3 else 4 end)
    from public.deliveries d join public.orders o on o.id = d.order_id
    where d.courier_id = c.id and d.status not in ('delivered', 'returned')), '[]'::jsonb);
  if c.available then
    if c.kind = 'own' then
      v_avail := coalesce((
        select jsonb_agg(private.courier_card(o, null, false) order by o.created_at)
        from public.orders o
        where o.establishment_id = c.establishment_id and o.fulfillment = 'delivery' and o.status = 'ready_for_delivery'
          and not exists (select 1 from public.deliveries d where d.order_id = o.id and d.status not in ('delivered', 'returned'))), '[]'::jsonb);
    else
      v_avail := coalesce((
        select jsonb_agg(private.courier_card(o, d, false) order by d.at)
        from public.deliveries d join public.orders o on o.id = d.order_id
        where d.establishment_id = c.establishment_id and d.status = 'published' and d.courier_id is null), '[]'::jsonb);
    end if;
  end if;
  return jsonb_build_object('available', v_avail, 'mine', v_mine);
end;
$$;

create function public.courier_detail(p_order uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare c public.couriers := private.me_courier(); o public.orders; d public.deliveries; est public.establishments; v_mine boolean;
begin
  select * into o from public.orders where id = p_order and establishment_id = c.establishment_id and fulfillment = 'delivery';
  if not found then return null; end if;
  select * into d from public.deliveries x where x.order_id = o.id order by (x.status in ('delivered', 'returned')), x.created_at desc limit 1;
  v_mine := d.id is not null and d.courier_id = c.id;
  if not v_mine and not (c.available and ((c.kind = 'own' and o.status = 'ready_for_delivery' and d.id is null) or (d.status = 'published' and d.courier_id is null))) then return null; end if;
  select * into est from public.establishments where id = c.establishment_id;
  return private.courier_card(o, d, v_mine) || jsonb_build_object('store_address', est.address, 'mine', v_mine);
end;
$$;

create function public.courier_take(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.couriers := private.me_courier(); o public.orders; d public.deliveries; v_route boolean;
begin
  if not c.available then raise exception 'unavailable' using errcode = 'P0001'; end if;
  select * into o from public.orders where id = p_order and establishment_id = c.establishment_id and fulfillment = 'delivery' for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if c.kind = 'partner' then
    select * into d from public.deliveries where order_id = o.id and status = 'published' and courier_id is null for update;
    if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
    update public.deliveries set courier_id = c.id, status = 'assigned', at = now() where id = d.id;
  else
    if o.status <> 'ready_for_delivery' or exists (select 1 from public.deliveries x where x.order_id = o.id and x.status not in ('delivered', 'returned')) then
      raise exception 'already_assigned' using errcode = 'P0001';
    end if;
    v_route := exists (select 1 from public.deliveries x where x.courier_id = c.id and x.status = 'en_route');
    insert into public.deliveries (establishment_id, order_id, courier_id, status, items)
    values (o.establishment_id, o.id, c.id, case when v_route then 'reserved'::public.delivery_status else 'assigned'::public.delivery_status end,
            coalesce((select sum(qty)::int from public.order_items where order_id = o.id), 0));
  end if;
end;
$$;

create function private.my_open_delivery(p_order uuid, p_courier uuid)
returns public.deliveries language plpgsql security definer set search_path = '' as $$
declare d public.deliveries;
begin
  select * into d from public.deliveries where order_id = p_order and status not in ('delivered', 'returned') for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if d.courier_id is distinct from p_courier then raise exception 'not_yours' using errcode = 'P0001'; end if;
  return d;
end;
$$;

create function public.courier_accept(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.couriers := private.me_courier(); d public.deliveries := private.my_open_delivery(p_order, (private.me_courier()).id);
begin
  if d.status not in ('assigned', 'reserved') then raise exception 'wrong_state' using errcode = 'P0001'; end if;
  update public.deliveries set status = 'accepted', at = now() where id = d.id;
end;
$$;

-- "Saí da loja": a entrega vai para Em rota, o pedido para "saiu para entrega" e o estoque sai. Previsão = km × minutos por km.
create function public.courier_depart(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.couriers := private.me_courier(); d public.deliveries := private.my_open_delivery(p_order, (private.me_courier()).id);
        o public.orders; est public.establishments; v_km numeric; v_eta timestamptz;
begin
  if d.status <> 'accepted' then raise exception 'wrong_state' using errcode = 'P0001'; end if;
  select * into o from public.orders where id = p_order for update;
  select * into est from public.establishments where id = o.establishment_id;
  v_km := coalesce((est.settings -> 'district_km' ->> (o.address ->> 'district'))::numeric, 3);
  v_eta := now() + make_interval(mins => round(v_km * coalesce((est.settings ->> 'minutes_per_km')::numeric, 3))::int);
  update public.deliveries set status = 'en_route', at = now(), expected_at = v_eta, return_at = v_eta + interval '10 minutes' where id = d.id;
  perform private.order_take_stock(o.id);
  update public.orders
     set status = 'out_for_delivery', step_times = step_times || jsonb_build_object('out_for_delivery', private.hhmm(now())),
         eta_label = 'Hoje, ' || private.hhmm(v_eta), courier_name = c.name
   where id = o.id;
end;
$$;

-- O código de 4 números que quem comprou tem precisa conferir (H-E5). Pendência: limitar tentativas erradas (anotada em DECISIONS).
create function public.courier_confirm(p_order uuid, p_code text)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.couriers := private.me_courier(); d public.deliveries := private.my_open_delivery(p_order, (private.me_courier()).id); o public.orders;
begin
  if d.status <> 'en_route' then raise exception 'wrong_state' using errcode = 'P0001'; end if;
  select * into o from public.orders where id = p_order for update;
  if btrim(coalesce(p_code, '')) is distinct from o.delivery_code then raise exception 'wrong_code' using errcode = 'P0001'; end if;
  update public.deliveries set status = 'delivered', at = now() where id = d.id;
  -- pagamento na entrega (dinheiro ou cartão): o que foi cobrado na porta passa a pago
  update public.orders
     set status = 'delivered', step_times = step_times || jsonb_build_object('delivered', private.hhmm(now())), eta_label = null, payment_paid = true
   where id = o.id;
end;
$$;

-- Devolução à loja: o pedido volta a "pronto", o estoque volta e a casa decide se reenvia.
create function public.courier_problem(p_order uuid, p_reason text, p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare c public.couriers := private.me_courier(); d public.deliveries := private.my_open_delivery(p_order, (private.me_courier()).id);
begin
  if d.status <> 'en_route' then raise exception 'wrong_state' using errcode = 'P0001'; end if;
  if btrim(coalesce(p_reason, '')) = '' then raise exception 'invalid_reason' using errcode = 'P0001'; end if;
  update public.deliveries
     set status = 'returned', problem_reason = p_reason, problem_note = btrim(coalesce(p_note, '')),
         problem_prev = jsonb_build_object('at', d.at, 'expectedAt', d.expected_at, 'returnAt', d.return_at), at = now()
   where id = d.id;
  perform private.order_return_stock(p_order, 'Entrega devolvida · volta ao estoque');
  update public.orders set status = 'ready_for_delivery', courier_name = null, eta_label = null where id = p_order;
end;
$$;

create function public.courier_undo_problem(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.couriers := private.me_courier(); d public.deliveries; o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  select * into d from public.deliveries where order_id = p_order and courier_id = c.id and status = 'returned' and problem_prev is not null order by at desc limit 1 for update;
  if not found then raise exception 'wrong_state' using errcode = 'P0001'; end if;
  if o.status <> 'ready_for_delivery' or exists (select 1 from public.deliveries x where x.order_id = p_order and x.status not in ('delivered', 'returned')) then
    raise exception 'wrong_state' using errcode = 'P0001';
  end if;
  update public.deliveries
     set status = 'en_route', at = (d.problem_prev ->> 'at')::timestamptz, expected_at = (d.problem_prev ->> 'expectedAt')::timestamptz,
         return_at = (d.problem_prev ->> 'returnAt')::timestamptz, problem_reason = null, problem_note = null, problem_prev = null
   where id = d.id;
  perform private.order_take_stock(p_order);
  update public.orders
     set status = 'out_for_delivery', courier_name = c.name,
         eta_label = case when d.problem_prev ->> 'expectedAt' is not null then 'Hoje, ' || private.hhmm((d.problem_prev ->> 'expectedAt')::timestamptz) end
   where id = p_order;
end;
$$;

-- Histórico de hoje (fuso de São Paulo). Quem calcula o que o parceiro recebe é o app, com os valores que vêm daqui.
create function public.courier_history()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare c public.couriers := private.me_courier(); est public.establishments;
begin
  select * into est from public.establishments where id = c.establishment_id;
  return jsonb_build_object(
    'partner_fee_cents', coalesce((est.settings ->> 'partner_fee_cents')::bigint, 900),
    'partner_return_fee_cents', coalesce((est.settings ->> 'partner_return_fee_cents')::bigint, 450),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object('order_id', o.id, 'number', o.number, 'district', coalesce(o.address ->> 'district', ''), 'at', d.at, 'status', d.status, 'fee_cents', d.fee_cents) order by d.at desc)
      from public.deliveries d join public.orders o on o.id = d.order_id
      where d.courier_id = c.id and d.status in ('delivered', 'returned')
        and (d.at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date), '[]'::jsonb));
end;
$$;

-- ───────── permissões ─────────
-- Escrita em entregas só pelas funções (o código de confirmação e o estoque dependem disso).
drop policy deliveries_insert on public.deliveries;
drop policy deliveries_update on public.deliveries;
drop policy deliveries_delete on public.deliveries;

revoke all on function
  public.set_my_pin(uuid, text), public.order_accept(uuid), public.order_mark_ready(uuid, uuid[]), public.order_undo_ready(uuid), public.order_complete_pickup(uuid),
  public.pos_open_session(uuid, bigint), public.pos_checkout(uuid, jsonb), public.pos_cancel_sale(uuid, text), public.pos_cash_movement(uuid, text, bigint, text),
  public.pos_close_session(uuid, bigint), public.pos_reopen_session(uuid), public.pos_send_receipt(uuid, text), public.pos_sync_pending(uuid),
  public.pay_entry(uuid, bigint, bigint, text, text, timestamptz), public.undo_payment(uuid),
  public.delivery_assign(uuid, uuid), public.delivery_unassign(uuid), public.delivery_expire_published(uuid),
  public.courier_link(), public.courier_set_available(boolean), public.courier_save_pix(text), public.courier_list(), public.courier_detail(uuid),
  public.courier_take(uuid), public.courier_accept(uuid), public.courier_depart(uuid), public.courier_confirm(uuid, text),
  public.courier_problem(uuid, text, text), public.courier_undo_problem(uuid), public.courier_history()
  from public, anon;
grant execute on function
  public.set_my_pin(uuid, text), public.order_accept(uuid), public.order_mark_ready(uuid, uuid[]), public.order_undo_ready(uuid), public.order_complete_pickup(uuid),
  public.pos_open_session(uuid, bigint), public.pos_checkout(uuid, jsonb), public.pos_cancel_sale(uuid, text), public.pos_cash_movement(uuid, text, bigint, text),
  public.pos_close_session(uuid, bigint), public.pos_reopen_session(uuid), public.pos_send_receipt(uuid, text), public.pos_sync_pending(uuid),
  public.pay_entry(uuid, bigint, bigint, text, text, timestamptz), public.undo_payment(uuid),
  public.delivery_assign(uuid, uuid), public.delivery_unassign(uuid), public.delivery_expire_published(uuid),
  public.courier_link(), public.courier_set_available(boolean), public.courier_save_pix(text), public.courier_list(), public.courier_detail(uuid),
  public.courier_take(uuid), public.courier_accept(uuid), public.courier_depart(uuid), public.courier_confirm(uuid, text),
  public.courier_problem(uuid, text, text), public.courier_undo_problem(uuid), public.courier_history()
  to authenticated;

-- Funções de apoio: ficam fora do alcance da API (só as públicas acima são chamadas pelo app).
revoke all on function
  private.hhmm(timestamptz), private.unit_kg(text), private.account_id(uuid, public.account_kind),
  private.add_tx(uuid, public.account_kind, bigint, public.tx_kind, text, text, uuid, uuid, uuid, uuid, bigint),
  private.cash_expected(uuid), private.order_take_stock(uuid), private.order_return_stock(uuid, text), private.me_courier(),
  private.courier_card(public.orders, public.deliveries, boolean), private.my_open_delivery(uuid, uuid),
  private.actor_name(uuid), private.consume_stock(uuid, uuid, numeric, public.movement_type, text, text, uuid), private.lot_balance(uuid)
  from public, anon, authenticated;
