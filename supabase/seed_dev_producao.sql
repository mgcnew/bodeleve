-- Ficha de teste para o banco de desenvolvimento (dados fictícios; a ficha real é da casa).
-- Doce de leite: 12 un por tacho, com nata e rapadura como insumos de teste. Reaplicável sem duplicar.
-- O saldo de insumos de teste entra por lote "TESTE-PROD-*" (movimento de ajuste), para a produção poder ser exercitada.
do $$
declare
  est uuid := (select id from public.establishments limit 1);
  fin uuid := (select id from public.products where slug = 'doce-de-leite');
  nata uuid := (select id from public.products where slug = 'nata');
  rap uuid := (select id from public.products where slug = 'rapadura');
  rec uuid;
  lot uuid;
  p uuid;
begin
  if not exists (select 1 from public.recipes where product_id = fin) then
    insert into public.recipes (establishment_id, product_id, yield_per_batch, batch_label, shelf_life_days, lot_prefix, overhead_cents, method)
    values (est, fin, 12, 'tacho', 60, 'DL', 500, '[MODO DE PREPARO DA CASA]') returning id into rec;
    insert into public.recipe_items (recipe_id, product_id, qty_per_batch) values (rec, nata, 4), (rec, rap, 6);
  end if;

  foreach p in array array[nata, rap] loop
    if not exists (select 1 from public.product_lots where product_id = p and code = 'TESTE-PROD-1') then
      insert into public.product_lots (establishment_id, product_id, code, expires_at, unit_cost_cents, source)
      values (est, p, 'TESTE-PROD-1', now() + interval '90 days', (select last_cost_cents from public.products where id = p), 'seed_dev_producao') returning id into lot;
      insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by_name)
      values (est, p, lot, 'adjustment', 20, 'seed_dev_producao', 'Saldo de teste para produção', 'Seed de desenvolvimento');
    end if;
  end loop;
end $$;
