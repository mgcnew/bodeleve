-- Bodeleve · funções que escrevem o razão do estoque: ajuste, contagem, recebimento de compra e produção.
-- Porta para o banco as regras já testadas no app (domain/stock, receiving, production): baixa pelo lote que vence primeiro,
-- custo real por lote, desfazer por lançamento contrário (o histórico nunca é apagado). Tudo atômico: se algo falta, nada é lançado.

create function private.actor_name(p_establishment uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((
    select coalesce(nullif(m.display_name, ''), nullif(pr.full_name, ''), (select u.email::text from auth.users u where u.id = m.user_id))
    from public.memberships m left join public.profiles pr on pr.id = m.user_id
    where m.user_id = (select auth.uid()) and m.establishment_id = p_establishment and m.status = 'active'
    limit 1
  ), 'Equipe');
$$;

-- Saída pelo lote que vence primeiro (FEFO); passa para o próximo se acabar. Devolve [{lot_id, code, qty, movement_id, unit_cost_cents}].
create function private.consume_stock(p_establishment uuid, p_product uuid, p_qty numeric, p_type public.movement_type, p_ref text, p_description text, p_batch uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_left numeric := p_qty;
  v_take numeric;
  v_mid uuid;
  v_out jsonb := '[]'::jsonb;
  lot record;
begin
  if p_qty is null or p_qty <= 0 then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
  perform 1 from public.products where id = p_product and establishment_id = p_establishment for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;

  for lot in
    select l.id, l.code, l.unit_cost_cents, sum(m.qty) as bal
    from public.product_lots l join public.stock_movements m on m.lot_id = l.id
    where l.product_id = p_product
    group by l.id
    having sum(m.qty) > 0
    order by l.expires_at nulls last, l.received_at, l.id
  loop
    exit when v_left <= 0;
    v_take := least(v_left, lot.bal);
    insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name, batch_id)
    values (p_establishment, p_product, lot.id, p_type, -v_take, coalesce(p_ref, ''), p_description, (select auth.uid()), private.actor_name(p_establishment), p_batch)
    returning id into v_mid;
    v_out := v_out || jsonb_build_object('lot_id', lot.id, 'code', lot.code, 'qty', v_take, 'movement_id', v_mid, 'unit_cost_cents', lot.unit_cost_cents);
    v_left := v_left - v_take;
  end loop;

  if v_left > 0 then raise exception 'insufficient_stock' using errcode = 'P0001'; end if;
  return v_out;
end;
$$;

create function private.lot_balance(p_lot uuid)
returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(sum(qty), 0) from public.stock_movements where lot_id = p_lot;
$$;

-- ───────── ajuste e perda ─────────
-- p_kind: 'loss' | 'internal' | 'correction'. Por padrão tira do lote; p_add = true coloca (correção de contagem).
create function public.stock_adjust(p_product uuid, p_lot uuid, p_qty numeric, p_kind text, p_reason text default '', p_add boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare p public.products; l public.product_lots; v_id uuid; v_label text;
begin
  select * into p from public.products where id = p_product;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(p.establishment_id, 'stock') then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_kind not in ('loss', 'internal', 'correction') then raise exception 'invalid_kind' using errcode = 'P0001'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
  select * into l from public.product_lots where id = p_lot and product_id = p_product;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  perform 1 from public.products where id = p_product for update;
  if not p_add and private.lot_balance(l.id) < p_qty then raise exception 'insufficient' using errcode = 'P0001'; end if;
  v_label := case p_kind when 'loss' then 'Perda' when 'internal' then 'Consumo interno' else 'Correção' end;
  insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name)
  values (p.establishment_id, p_product, p_lot, case when p_kind = 'loss' then 'loss'::public.movement_type else 'adjustment'::public.movement_type end,
          case when p_add then p_qty else -p_qty end, 'Ajuste manual',
          v_label || case when coalesce(p_reason, '') <> '' then ' · ' || lower(p_reason) else '' end,
          (select auth.uid()), private.actor_name(p.establishment_id))
  returning id into v_id;
  return v_id;
end;
$$;

-- Desfaz um ajuste, perda ou contagem com um lançamento contrário. Só uma vez e só se o saldo permitir.
create function public.stock_reverse(p_movement uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare o public.stock_movements; v_id uuid;
begin
  select * into o from public.stock_movements where id = p_movement;
  if not found or o.lot_id is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(o.establishment_id, 'stock') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.type not in ('adjustment', 'loss', 'inventory') or o.reversal_of is not null then raise exception 'cannot_reverse' using errcode = 'P0001'; end if;
  if exists (select 1 from public.stock_movements where reversal_of = p_movement) then raise exception 'cannot_reverse' using errcode = 'P0001'; end if;
  perform 1 from public.products where id = o.product_id for update;
  if o.qty > 0 and private.lot_balance(o.lot_id) < o.qty then raise exception 'insufficient' using errcode = 'P0001'; end if;
  insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name, batch_id, reversal_of)
  values (o.establishment_id, o.product_id, o.lot_id, 'adjustment', -o.qty, o.ref, 'Desfeito · ' || coalesce(o.description, 'lançamento'),
          (select auth.uid()), private.actor_name(o.establishment_id), o.batch_id, o.id)
  returning id into v_id;
  return v_id;
end;
$$;

-- ───────── inventário ─────────
-- p_lines: [{product_id, counted}]. Falta sai do lote que vence primeiro; sobra entra no lote mais recente (H-G13).
create function public.stock_count_apply(p_establishment uuid, p_lines jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_count uuid; ln record; v_system numeric; v_diff numeric; v_lot uuid; v_units numeric := 0; v_cost bigint := 0; v_cnt int := 0;
begin
  if not private.can(p_establishment, 'stock') then raise exception 'forbidden' using errcode = '42501'; end if;
  if coalesce(jsonb_typeof(p_lines), '') <> 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'empty_count' using errcode = 'P0001'; end if;
  insert into public.inventory_counts (establishment_id, created_by) values (p_establishment, (select auth.uid())) returning id into v_count;

  for ln in select (x ->> 'product_id')::uuid as product_id, (x ->> 'counted')::numeric as counted from jsonb_array_elements(p_lines) x loop
    if ln.counted is null or ln.counted < 0 then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
    perform 1 from public.products where id = ln.product_id and establishment_id = p_establishment for update;
    if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
    select coalesce(sum(qty), 0) into v_system from public.stock_movements where product_id = ln.product_id;
    insert into public.inventory_count_items (count_id, product_id, counted, system_qty) values (v_count, ln.product_id, ln.counted, v_system);
    v_diff := ln.counted - v_system;
    if v_diff = 0 then continue; end if;
    v_cnt := v_cnt + 1;
    if v_diff < 0 then
      perform private.consume_stock(p_establishment, ln.product_id, -v_diff, 'inventory', 'Inventário', 'Inventário · contagem', v_count);
      v_units := v_units + v_diff;
    else
      select id into v_lot from public.product_lots where product_id = ln.product_id order by received_at desc, id limit 1;
      if v_lot is null then
        insert into public.product_lots (establishment_id, product_id, code, source)
        values (p_establishment, ln.product_id, 'INV-' || to_char(now(), 'YYMMDD'), 'Inventário') returning id into v_lot;
      end if;
      insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name, batch_id)
      values (p_establishment, ln.product_id, v_lot, 'inventory', v_diff, 'Inventário', 'Inventário · contagem', (select auth.uid()), private.actor_name(p_establishment), v_count);
      v_units := v_units + v_diff;
    end if;
  end loop;
  return jsonb_build_object('count_id', v_count, 'changed_products', v_cnt, 'delta_units', v_units);
end;
$$;

create function public.stock_count_undo(p_count uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare c public.inventory_counts; m record; n int := 0;
begin
  select * into c from public.inventory_counts where id = p_count;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(c.establishment_id, 'stock') then raise exception 'forbidden' using errcode = '42501'; end if;
  if c.undone_at is not null then raise exception 'already_undone' using errcode = 'P0001'; end if;
  for m in select * from public.stock_movements where batch_id = p_count and reversal_of is null order by at, id loop
    perform 1 from public.products where id = m.product_id for update;
    if m.qty > 0 and private.lot_balance(m.lot_id) < m.qty then raise exception 'insufficient' using errcode = 'P0001'; end if;
    insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name, batch_id, reversal_of)
    values (m.establishment_id, m.product_id, m.lot_id, 'adjustment', -m.qty, m.ref, 'Desfeito · ' || coalesce(m.description, 'inventário'),
            (select auth.uid()), private.actor_name(m.establishment_id), m.batch_id, m.id);
    n := n + 1;
  end loop;
  update public.inventory_counts set undone_at = now() where id = p_count;
  return n;
end;
$$;

-- ───────── recebimento de compra ─────────
-- p_lines: [{item_id (item do pedido), qty, lot, expires_at}]. Cria lote e entrada, atualiza o custo do produto e gera a conta a pagar (H-I49).
create function public.receive_purchase(p_po uuid, p_lines jsonb, p_close_short boolean default false, p_due_at timestamptz default null, p_payment_label text default 'Boleto')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  po public.purchase_orders; sup public.suppliers; ln record; it public.purchase_order_items; pr public.products;
  v_receipt uuid; v_lot uuid; v_code text; v_total bigint := 0; v_open int; v_entry uuid; v_n int; v_any boolean := false;
begin
  select * into po from public.purchase_orders where id = p_po for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(po.establishment_id, 'purchasing') then raise exception 'forbidden' using errcode = '42501'; end if;
  if po.status not in ('sent', 'partially_received') then raise exception 'not_receivable' using errcode = 'P0001'; end if;
  if coalesce(jsonb_typeof(p_lines), '') <> 'array' then raise exception 'empty_receipt' using errcode = 'P0001'; end if;
  select * into sup from public.suppliers where id = po.supplier_id;

  insert into public.goods_receipts (establishment_id, purchase_order_id, received_by) values (po.establishment_id, po.id, (select auth.uid())) returning id into v_receipt;

  for ln in select x ->> 'item_id' as item_id, (x ->> 'qty')::numeric as qty, nullif(btrim(x ->> 'lot'), '') as lot, nullif(x ->> 'expires_at', '')::timestamptz as expires_at from jsonb_array_elements(p_lines) x loop
    if ln.qty is null or ln.qty < 0 then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
    if ln.qty = 0 then continue; end if;
    select * into it from public.purchase_order_items where id = ln.item_id::uuid and purchase_order_id = po.id for update;
    if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
    if ln.qty > it.qty - it.received_qty then raise exception 'over_received' using errcode = 'P0001'; end if;
    select * into pr from public.products where id = it.product_id for update;
    if pr.tracks_expiry and ln.expires_at is null then raise exception 'expiry_required:%', pr.name using errcode = 'P0001'; end if;

    v_n := (select count(*) from public.product_lots where product_id = pr.id) + 1;
    v_code := coalesce(ln.lot, 'L' || to_char(now(), 'YYMMDD') || '-' || v_n);
    insert into public.product_lots (establishment_id, product_id, code, expires_at, unit_cost_cents, source)
    values (po.establishment_id, pr.id, v_code, ln.expires_at, it.unit_cost_cents, po.number) returning id into v_lot;
    insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name)
    values (po.establishment_id, pr.id, v_lot, 'purchase_in', ln.qty, po.number, 'Compra · ' || po.number || ' · Entrada do lote ' || v_code, (select auth.uid()), private.actor_name(po.establishment_id));
    insert into public.goods_receipt_items (receipt_id, purchase_order_item_id, product_id, qty, cost_cents, lot_id)
    values (v_receipt, it.id, pr.id, ln.qty, it.unit_cost_cents, v_lot);
    update public.purchase_order_items set received_qty = received_qty + ln.qty where id = it.id;
    update public.products set last_cost_cents = it.unit_cost_cents where id = pr.id;
    v_total := v_total + round(ln.qty * it.unit_cost_cents);
    v_any := true;
  end loop;

  if not v_any then raise exception 'empty_receipt' using errcode = 'P0001'; end if;
  update public.goods_receipts set total_cents = v_total where id = v_receipt;

  select count(*) into v_open from public.purchase_order_items where purchase_order_id = po.id and received_qty < qty;
  update public.purchase_orders
     set status = case when v_open = 0 or p_close_short then 'received'::public.po_status else 'partially_received'::public.po_status end,
         received_at = case when v_open = 0 or p_close_short then now() else received_at end
   where id = po.id;

  -- a conta de compra nasce no recebimento, pelo valor recebido
  insert into public.financial_entries (establishment_id, direction, description, title, kind_label, amount_cents, due_at, origin, ref, supplier_id)
  values (po.establishment_id, 'payable', sup.name, sup.name, coalesce(p_payment_label, 'Boleto') || ' · compra ' || po.number, v_total, coalesce(p_due_at, now() + interval '30 days'), 'purchase', po.number, po.supplier_id)
  returning id into v_entry;

  return jsonb_build_object('receipt_id', v_receipt, 'total_cents', v_total, 'entry_id', v_entry, 'closed', (v_open = 0 or p_close_short));
end;
$$;

-- Desfaz o último recebimento do pedido, se o que entrou ainda está inteiro e a conta ainda não foi paga.
create function public.undo_receipt(p_receipt uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare g public.goods_receipts; po public.purchase_orders; gi record; v_entry uuid;
begin
  select * into g from public.goods_receipts where id = p_receipt for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(g.establishment_id, 'purchasing') then raise exception 'forbidden' using errcode = '42501'; end if;
  if g.undone_at is not null then raise exception 'already_undone' using errcode = 'P0001'; end if;
  if exists (select 1 from public.goods_receipts x where x.purchase_order_id = g.purchase_order_id and x.undone_at is null and x.received_at > g.received_at) then
    raise exception 'not_last_receipt' using errcode = 'P0001';
  end if;
  select * into po from public.purchase_orders where id = g.purchase_order_id for update;
  select id into v_entry from public.financial_entries where origin = 'purchase' and ref = po.number and establishment_id = g.establishment_id
    and paid_cents = 0 and abs(amount_cents - g.total_cents) = 0 order by created_at desc limit 1;
  if v_entry is null then raise exception 'entry_already_paid' using errcode = 'P0001'; end if;

  for gi in select * from public.goods_receipt_items where receipt_id = g.id loop
    if private.lot_balance(gi.lot_id) < gi.qty then raise exception 'lot_already_used' using errcode = 'P0001'; end if;
    insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name)
    values (g.establishment_id, gi.product_id, gi.lot_id, 'adjustment', -gi.qty, po.number, 'Desfeito · Compra · ' || po.number, (select auth.uid()), private.actor_name(g.establishment_id));
    update public.purchase_order_items set received_qty = received_qty - gi.qty where id = gi.purchase_order_item_id;
  end loop;
  delete from public.financial_entries where id = v_entry;
  update public.goods_receipts set undone_at = now() where id = g.id;
  update public.purchase_orders set status = case when exists (select 1 from public.goods_receipts x where x.purchase_order_id = po.id and x.undone_at is null) then 'partially_received'::public.po_status else 'sent'::public.po_status end,
         received_at = null where id = po.id;
end;
$$;

-- ───────── produção ─────────
-- Conclui a ordem: baixa os insumos (lote que vence primeiro), cria o lote do acabado com o custo REAL por unidade (H-G18, H-I42).
-- Se faltar qualquer insumo, nada é lançado e o erro diz qual.
create function public.finish_production(p_order uuid, p_good_qty numeric, p_lot_code text default null, p_expires_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  o public.production_orders; r public.recipes; fin public.products; rit record; c jsonb; x jsonb; v_input_cost numeric := 0; v_total numeric; v_unit bigint;
  v_lot uuid; v_code text; v_mid uuid; v_n int;
begin
  select * into o from public.production_orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(o.establishment_id, 'production') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.status = 'done' then raise exception 'already_done' using errcode = 'P0001'; end if;
  if p_good_qty is null or p_good_qty <= 0 then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
  select * into r from public.recipes where id = o.recipe_id;
  select * into fin from public.products where id = o.product_id for update;

  for rit in select i.product_id, i.qty_per_batch, pr.name as pname from public.recipe_items i join public.products pr on pr.id = i.product_id where i.recipe_id = r.id loop
    begin
      c := private.consume_stock(o.establishment_id, rit.product_id, rit.qty_per_batch * o.batches, 'production_out', o.number, 'Produção · ' || o.number || ' · Consumo');
    exception when others then
      if sqlerrm = 'insufficient_stock' then raise exception 'insufficient_input:%', rit.pname using errcode = 'P0001'; end if;
      raise;
    end;
    for x in select value from jsonb_array_elements(c) loop
      insert into public.production_consumptions (production_order_id, product_id, lot_id, qty, movement_id)
      values (o.id, rit.product_id, (x ->> 'lot_id')::uuid, (x ->> 'qty')::numeric, (x ->> 'movement_id')::uuid);
      v_input_cost := v_input_cost + (x ->> 'qty')::numeric * (x ->> 'unit_cost_cents')::numeric;
    end loop;
  end loop;

  v_total := v_input_cost + r.overhead_cents * o.batches;
  v_unit := round(v_total / p_good_qty);
  v_n := (select count(*) from public.product_lots where product_id = fin.id) + 1;
  v_code := coalesce(nullif(btrim(p_lot_code), ''), r.lot_prefix || '-' || to_char(now(), 'YYMMDD') || '-' || v_n);
  insert into public.product_lots (establishment_id, product_id, code, expires_at, unit_cost_cents, source)
  values (o.establishment_id, fin.id, v_code, coalesce(p_expires_at, case when r.shelf_life_days is not null then now() + make_interval(days => r.shelf_life_days) end), v_unit, o.number)
  returning id into v_lot;
  insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name)
  values (o.establishment_id, fin.id, v_lot, 'production_in', p_good_qty, o.number, 'Produção · ' || o.number || ' · Entrada do lote ' || v_code, (select auth.uid()), private.actor_name(o.establishment_id))
  returning id into v_mid;

  update public.production_orders
     set status = 'done', done_at = now(), started_at = coalesce(started_at, now()), good_qty = p_good_qty, lot_id = v_lot, cost_per_unit_cents = v_unit
   where id = o.id;
  update public.products set last_cost_cents = v_unit where id = fin.id;
  return jsonb_build_object('lot_id', v_lot, 'lot_code', v_code, 'cost_per_unit_cents', v_unit, 'good_qty', p_good_qty, 'planned_qty', o.planned_qty);
end;
$$;

-- Corrige o apontamento: devolve os insumos e tira o lote do acabado, enquanto nada saiu dele.
create function public.undo_finish_production(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.production_orders; pc record; m public.stock_movements;
begin
  select * into o from public.production_orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(o.establishment_id, 'production') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.status <> 'done' or o.lot_id is null then raise exception 'not_done' using errcode = 'P0001'; end if;
  if private.lot_balance(o.lot_id) < o.good_qty then raise exception 'lot_already_used' using errcode = 'P0001'; end if;

  insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name)
  values (o.establishment_id, o.product_id, o.lot_id, 'adjustment', -o.good_qty, o.number, 'Desfeito · Produção · ' || o.number, (select auth.uid()), private.actor_name(o.establishment_id));
  for pc in select * from public.production_consumptions where production_order_id = o.id loop
    insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name, reversal_of)
    values (o.establishment_id, pc.product_id, pc.lot_id, 'adjustment', pc.qty, o.number, 'Desfeito · Produção · ' || o.number || ' · Consumo', (select auth.uid()), private.actor_name(o.establishment_id), pc.movement_id);
  end loop;
  delete from public.production_consumptions where production_order_id = o.id;
  update public.production_orders set status = 'in_progress', done_at = null, good_qty = null, cost_per_unit_cents = null, lot_id = null where id = o.id;
end;
$$;

-- ───────── permissões das funções ─────────
revoke all on function public.stock_adjust(uuid, uuid, numeric, text, text, boolean), public.stock_reverse(uuid),
  public.stock_count_apply(uuid, jsonb), public.stock_count_undo(uuid),
  public.receive_purchase(uuid, jsonb, boolean, timestamptz, text), public.undo_receipt(uuid),
  public.finish_production(uuid, numeric, text, timestamptz), public.undo_finish_production(uuid) from public, anon;
grant execute on function public.stock_adjust(uuid, uuid, numeric, text, text, boolean), public.stock_reverse(uuid),
  public.stock_count_apply(uuid, jsonb), public.stock_count_undo(uuid),
  public.receive_purchase(uuid, jsonb, boolean, timestamptz, text), public.undo_receipt(uuid),
  public.finish_production(uuid, numeric, text, timestamptz), public.undo_finish_production(uuid) to authenticated;
