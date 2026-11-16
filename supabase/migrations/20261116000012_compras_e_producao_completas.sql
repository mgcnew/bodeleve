-- Bodeleve · o que faltava para ligar Compras e Produção às telas:
-- numeração do pedido de compra e da ordem de produção, reserva de insumos, encerrar compra com falta e apontamento com consumo real.

create function public.create_purchase_order(p_establishment uuid, p_supplier uuid, p_expected timestamptz, p_payment text, p_items jsonb, p_message text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare sup public.suppliers; v_id uuid; v_number text; ln record; pr public.products; v_n int := 0;
begin
  if not private.can(p_establishment, 'purchasing') then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into sup from public.suppliers where id = p_supplier and establishment_id = p_establishment;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if coalesce(jsonb_typeof(p_items), '') <> 'array' then raise exception 'empty_order' using errcode = 'P0001'; end if;
  if p_payment is null or p_payment not in ('boleto14', 'pix_on_delivery', 'cash_on_delivery') then raise exception 'invalid_payment' using errcode = 'P0001'; end if;

  v_number := 'PC-' || lpad(private.next_number(p_establishment, 'purchase')::text, 4, '0');
  insert into public.purchase_orders (establishment_id, number, supplier_id, status, payment_term, expected_at, sent_at, message_text, created_by)
  values (p_establishment, v_number, p_supplier, 'sent', p_payment, p_expected, now(), p_message, (select auth.uid()))
  returning id into v_id;

  for ln in select (x ->> 'product_id')::uuid as product_id, (x ->> 'qty')::numeric as qty from jsonb_array_elements(p_items) x loop
    if ln.qty is null or ln.qty <= 0 then continue; end if;
    select * into pr from public.products where id = ln.product_id and establishment_id = p_establishment;
    if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
    -- o custo vem do cadastro (último custo), nunca do aparelho
    insert into public.purchase_order_items (purchase_order_id, product_id, qty, unit_cost_cents) values (v_id, pr.id, ln.qty, coalesce(pr.last_cost_cents, 0));
    v_n := v_n + 1;
  end loop;
  if v_n = 0 then raise exception 'empty_order' using errcode = 'P0001'; end if;

  -- D21: a mensagem ao fornecedor é montada e guardada; nada é enviado
  if p_message is not null then
    insert into public.outbox_messages (establishment_id, kind, recipient, body) values (p_establishment, 'purchase_order', coalesce(sup.phone, ''), p_message);
  end if;
  return jsonb_build_object('id', v_id, 'number', v_number);
end;
$$;

-- "Encerrar o pedido assim": o que faltou não vem mais.
create function public.close_purchase_short(p_po uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare po public.purchase_orders;
begin
  select * into po from public.purchase_orders where id = p_po for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(po.establishment_id, 'purchasing') then raise exception 'forbidden' using errcode = '42501'; end if;
  if po.status <> 'partially_received' then raise exception 'invalid_state' using errcode = 'P0001'; end if;
  update public.purchase_orders set status = 'received', received_at = now() where id = po.id;
end;
$$;

create function public.create_production_order(p_establishment uuid, p_recipe uuid, p_batches int, p_destination uuid default null, p_starts_at timestamptz default null, p_start_now boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.recipes; v_id uuid; v_number text; it record; v_avail numeric; v_qty numeric; v_reserved jsonb := '[]'::jsonb;
begin
  if not private.can(p_establishment, 'production') then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into r from public.recipes where id = p_recipe and establishment_id = p_establishment;
  if not found or p_batches is null or p_batches < 1 then raise exception 'invalid_input' using errcode = 'P0001'; end if;
  if p_destination is not null and not exists (select 1 from public.orders where id = p_destination and establishment_id = p_establishment) then
    raise exception 'invalid_input:order' using errcode = 'P0001';
  end if;

  v_number := 'OP-' || lpad(private.next_number(p_establishment, 'production')::text, 4, '0');
  insert into public.production_orders (establishment_id, number, recipe_id, product_id, batches, planned_qty, status, destination_order_id, starts_at, started_at, created_by)
  values (p_establishment, v_number, r.id, r.product_id, p_batches, r.yield_per_batch * p_batches, case when p_start_now then 'in_progress' else 'planned' end,
          p_destination, coalesce(p_starts_at, now()), case when p_start_now then now() end, (select auth.uid()))
  returning id into v_id;

  -- reserva os insumos que há (o que falta fica sem reserva)
  for it in select i.product_id, i.qty_per_batch * p_batches as need from public.recipe_items i where i.recipe_id = r.id loop
    select coalesce(b.available, 0) into v_avail from public.product_balances b where b.product_id = it.product_id;
    v_qty := least(it.need, greatest(coalesce(v_avail, 0), 0));
    if v_qty > 0 then
      insert into public.stock_reservations (establishment_id, product_id, qty, ref, created_by) values (p_establishment, it.product_id, v_qty, v_number, (select auth.uid()));
      v_reserved := v_reserved || jsonb_build_object('product_id', it.product_id, 'qty', v_qty);
    end if;
  end loop;
  return jsonb_build_object('id', v_id, 'number', v_number, 'reserved', v_reserved);
end;
$$;

create function public.start_production(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.production_orders;
begin
  select * into o from public.production_orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(o.establishment_id, 'production') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.status <> 'planned' then raise exception 'invalid_state' using errcode = 'P0001'; end if;
  update public.production_orders set status = 'in_progress', started_at = now() where id = o.id;
end;
$$;

-- Desfaz uma ordem que ainda não foi concluída: devolve a reserva dos insumos.
create function public.delete_production_order(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.production_orders;
begin
  select * into o from public.production_orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(o.establishment_id, 'production') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.status = 'done' then raise exception 'invalid_state' using errcode = 'P0001'; end if;
  delete from public.stock_reservations where establishment_id = o.establishment_id and ref = o.number;
  delete from public.production_orders where id = o.id;
end;
$$;

-- Apontamento com o consumo real (H-G18). `p_consumption` = [{product_id, qty}] em unidades de estoque; sem ele vale a ficha técnica.
drop function public.finish_production(uuid, numeric, text, timestamptz);
create function public.finish_production(p_order uuid, p_good_qty numeric, p_lot_code text default null, p_expires_at timestamptz default null, p_consumption jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  o public.production_orders; r public.recipes; fin public.products; rit record; c jsonb; x jsonb; v_input_cost numeric := 0; v_total numeric; v_unit bigint;
  v_lot uuid; v_code text; v_n int; v_pname text;
begin
  select * into o from public.production_orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(o.establishment_id, 'production') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.status = 'done' then raise exception 'already_done' using errcode = 'P0001'; end if;
  if o.status <> 'in_progress' then raise exception 'invalid_state' using errcode = 'P0001'; end if;
  if p_good_qty is null or p_good_qty < 0 then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
  select * into r from public.recipes where id = o.recipe_id;
  select * into fin from public.products where id = o.product_id for update;

  for rit in
    select product_id, qty from (
      select i.product_id, i.qty_per_batch * o.batches as qty from public.recipe_items i where i.recipe_id = r.id and p_consumption is null
      union all
      select (e ->> 'product_id')::uuid, (e ->> 'qty')::numeric from jsonb_array_elements(coalesce(p_consumption, '[]'::jsonb)) e
    ) t where qty > 0
  loop
    select name into v_pname from public.products where id = rit.product_id and establishment_id = o.establishment_id;
    if v_pname is null then raise exception 'invalid_input' using errcode = 'P0001'; end if;
    begin
      c := private.consume_stock(o.establishment_id, rit.product_id, rit.qty, 'production_out', o.number, 'Produção · ' || o.number || ' · Consumo');
    exception when others then
      if sqlerrm = 'insufficient_stock' then raise exception 'insufficient_input:%', v_pname using errcode = 'P0001'; end if;
      raise;
    end;
    for x in select value from jsonb_array_elements(c) loop
      insert into public.production_consumptions (production_order_id, product_id, lot_id, qty, movement_id)
      values (o.id, rit.product_id, (x ->> 'lot_id')::uuid, (x ->> 'qty')::numeric, (x ->> 'movement_id')::uuid);
      v_input_cost := v_input_cost + (x ->> 'qty')::numeric * (x ->> 'unit_cost_cents')::numeric;
    end loop;
  end loop;

  v_total := v_input_cost + r.overhead_cents * o.batches;
  v_unit := case when p_good_qty > 0 then round(v_total / p_good_qty) else 0 end;
  v_n := (select count(*) from public.product_lots where product_id = fin.id) + 1;
  v_code := coalesce(nullif(btrim(p_lot_code), ''), r.lot_prefix || '-' || to_char(now(), 'YYMMDD') || '-' || v_n);
  insert into public.product_lots (establishment_id, product_id, code, expires_at, unit_cost_cents, source)
  values (o.establishment_id, fin.id, v_code, coalesce(p_expires_at, case when r.shelf_life_days is not null then now() + make_interval(days => r.shelf_life_days) end), v_unit, o.number)
  returning id into v_lot;
  if p_good_qty > 0 then
    insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name)
    values (o.establishment_id, fin.id, v_lot, 'production_in', p_good_qty, o.number, 'Produção · ' || o.number || ' · Entrada do lote ' || v_code, (select auth.uid()), private.actor_name(o.establishment_id));
  end if;

  update public.production_orders
     set status = 'done', done_at = now(), started_at = coalesce(started_at, now()), good_qty = p_good_qty, lot_id = v_lot, cost_per_unit_cents = v_unit
   where id = o.id;
  -- a reserva dos insumos termina: o consumo real já saiu do estoque
  delete from public.stock_reservations where establishment_id = o.establishment_id and ref = o.number;
  if p_good_qty > 0 then update public.products set last_cost_cents = v_unit where id = fin.id; end if;
  return jsonb_build_object('lot_id', v_lot, 'lot_code', v_code, 'cost_per_unit_cents', v_unit, 'good_qty', p_good_qty, 'planned_qty', o.planned_qty);
end;
$$;

revoke all on function public.create_purchase_order(uuid, uuid, timestamptz, text, jsonb, text), public.close_purchase_short(uuid),
  public.create_production_order(uuid, uuid, int, uuid, timestamptz, boolean), public.start_production(uuid), public.delete_production_order(uuid),
  public.finish_production(uuid, numeric, text, timestamptz, jsonb) from public, anon;
grant execute on function public.create_purchase_order(uuid, uuid, timestamptz, text, jsonb, text), public.close_purchase_short(uuid),
  public.create_production_order(uuid, uuid, int, uuid, timestamptz, boolean), public.start_production(uuid), public.delete_production_order(uuid),
  public.finish_production(uuid, numeric, text, timestamptz, jsonb) to authenticated;
