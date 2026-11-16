-- Bodeleve · cadastros que o dono precisa para começar: contato do fornecedor e ficha técnica gravada de uma vez.

alter table public.suppliers add column contact_name text not null default '';

-- Cria ou troca a ficha técnica de um produto acabado, com todas as linhas, numa operação só.
-- p_data: { product_id, yield_per_batch, batch_label, shelf_life_days, lot_prefix, overhead_cents, method, lines:[{product_id, qty_per_batch}] }
create function public.save_recipe(p_establishment uuid, p_recipe uuid, p_data jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_product uuid := (p_data ->> 'product_id')::uuid; v_yield numeric := (p_data ->> 'yield_per_batch')::numeric; ln record; v_n int := 0; v_type public.item_type;
begin
  if not private.can(p_establishment, 'production') then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_yield is null or v_yield <= 0 then raise exception 'invalid_input' using errcode = 'P0001'; end if;
  if coalesce((p_data ->> 'overhead_cents')::bigint, 0) < 0 or coalesce((p_data ->> 'shelf_life_days')::int, 0) < 0 then raise exception 'invalid_input' using errcode = 'P0001'; end if;
  select item_type into v_type from public.products where id = v_product and establishment_id = p_establishment;
  if v_type is null or v_type <> 'finished' then raise exception 'invalid_product' using errcode = 'P0001'; end if;
  if coalesce(jsonb_typeof(p_data -> 'lines'), '') <> 'array' or jsonb_array_length(p_data -> 'lines') = 0 then raise exception 'empty_recipe' using errcode = 'P0001'; end if;

  if p_recipe is null then
    if exists (select 1 from public.recipes where establishment_id = p_establishment and product_id = v_product) then raise exception 'duplicate' using errcode = 'P0001'; end if;
    insert into public.recipes (establishment_id, product_id, yield_per_batch) values (p_establishment, v_product, v_yield) returning id into v_id;
  else
    select id into v_id from public.recipes where id = p_recipe and establishment_id = p_establishment for update;
    if v_id is null then raise exception 'not_found' using errcode = 'P0001'; end if;
    if v_product is distinct from (select product_id from public.recipes where id = v_id) then raise exception 'invalid_product' using errcode = 'P0001'; end if;
  end if;

  update public.recipes
     set yield_per_batch = v_yield, batch_label = coalesce(nullif(btrim(p_data ->> 'batch_label'), ''), 'fornada'),
         shelf_life_days = nullif((p_data ->> 'shelf_life_days')::int, 0), lot_prefix = upper(btrim(coalesce(p_data ->> 'lot_prefix', ''))),
         overhead_cents = coalesce((p_data ->> 'overhead_cents')::bigint, 0), method = coalesce(p_data ->> 'method', '')
   where id = v_id;

  delete from public.recipe_items where recipe_id = v_id;
  for ln in select (x ->> 'product_id')::uuid as product_id, (x ->> 'qty_per_batch')::numeric as qty from jsonb_array_elements(p_data -> 'lines') x loop
    if ln.qty is null or ln.qty <= 0 or ln.product_id = v_product then raise exception 'invalid_input' using errcode = 'P0001'; end if;
    if not exists (select 1 from public.products where id = ln.product_id and establishment_id = p_establishment) then raise exception 'not_found' using errcode = 'P0001'; end if;
    insert into public.recipe_items (recipe_id, product_id, qty_per_batch) values (v_id, ln.product_id, ln.qty);
    v_n := v_n + 1;
  end loop;
  return v_id;
end;
$$;

revoke all on function public.save_recipe(uuid, uuid, jsonb) from public, anon;
grant execute on function public.save_recipe(uuid, uuid, jsonb) to authenticated;
