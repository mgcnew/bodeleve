-- Venda feita sem conexão: quando chega ao banco ela é registrada mesmo que o estoque tenha mudado (baixa o que houver), e já entra como enviada.
create or replace function public.pos_checkout(p_establishment uuid, p_sale jsonb)
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
    -- venda feita sem conexão já aconteceu no balcão: o banco registra mesmo que o estoque tenha mudado nesse meio tempo
    if ln.need > v_avail and not v_offline then raise exception 'insufficient_stock:%', ln.product_id using errcode = 'P0001'; end if;
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
          (select auth.uid()), private.actor_name(p_establishment), false)
  returning * into v_order;

  for ln in select x from jsonb_array_elements(v_lines) x loop
    v_units := (ln.x ->> 'units')::numeric;
    if v_offline then
      select coalesce(sum(m.qty), 0) into v_avail from public.stock_movements m where m.product_id = (ln.x ->> 'product_id')::uuid and m.lot_id is not null;
      v_units := least(v_units, greatest(v_avail, 0));
    end if;
    v_lots := case when v_units > 0 then
      (select coalesce(jsonb_agg(jsonb_build_object('lotCode', c ->> 'code', 'qty', (c ->> 'qty')::numeric)), '[]'::jsonb)
         from jsonb_array_elements(private.consume_stock(p_establishment, (ln.x ->> 'product_id')::uuid, v_units, 'sale_out', v_number, 'Venda no balcão', v_order.id)) c)
      else '[]'::jsonb end;
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

