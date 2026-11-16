-- Corrige a criação da ordem de produção (faltava o tipo do status no case).
create or replace function public.create_production_order(p_establishment uuid, p_recipe uuid, p_batches int, p_destination uuid default null, p_starts_at timestamptz default null, p_start_now boolean default false)
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
  values (p_establishment, v_number, r.id, r.product_id, p_batches, r.yield_per_batch * p_batches, case when p_start_now then 'in_progress'::public.production_status else 'planned'::public.production_status end,
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

