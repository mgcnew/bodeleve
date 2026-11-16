-- Bodeleve · ajustes dos avisos do Supabase (desempenho):
-- 1) políticas "for all" repetiam a de leitura; separadas em inserir, alterar e apagar (uma política de leitura por tabela);
-- 2) índices nas chaves estrangeiras que faltavam.

-- índices
create index goods_receipts_received_by_idx on public.goods_receipts (received_by);
create index inventory_counts_created_by_idx on public.inventory_counts (created_by);
create index production_orders_created_by_idx on public.production_orders (created_by);
create index purchase_orders_created_by_idx on public.purchase_orders (created_by);
create index recipes_product_idx on public.recipes (product_id);
create index stock_movements_created_by_idx on public.stock_movements (created_by);
create index stock_reservations_created_by_idx on public.stock_reservations (created_by);
create index suppliers_establishment_idx on public.suppliers (establishment_id);

-- categorias, produtos (módulo estoque)
drop policy categories_write on public.categories;
create policy categories_insert on public.categories for insert to authenticated with check ((select private.can(establishment_id, 'stock')));
create policy categories_update on public.categories for update to authenticated
  using ((select private.can(establishment_id, 'stock'))) with check ((select private.can(establishment_id, 'stock')));
create policy categories_delete on public.categories for delete to authenticated using ((select private.can(establishment_id, 'stock')));

drop policy products_write on public.products;
create policy products_insert on public.products for insert to authenticated with check ((select private.can(establishment_id, 'stock')));
create policy products_update on public.products for update to authenticated
  using ((select private.can(establishment_id, 'stock'))) with check ((select private.can(establishment_id, 'stock')));
create policy products_delete on public.products for delete to authenticated using ((select private.can(establishment_id, 'stock')));

drop policy stock_reservations_write on public.stock_reservations;
create policy stock_reservations_insert on public.stock_reservations for insert to authenticated with check ((select private.can(establishment_id, 'stock')));
create policy stock_reservations_update on public.stock_reservations for update to authenticated
  using ((select private.can(establishment_id, 'stock'))) with check ((select private.can(establishment_id, 'stock')));
create policy stock_reservations_delete on public.stock_reservations for delete to authenticated using ((select private.can(establishment_id, 'stock')));

-- fornecedores (módulo compras)
drop policy suppliers_write on public.suppliers;
create policy suppliers_insert on public.suppliers for insert to authenticated with check ((select private.can(establishment_id, 'purchasing')));
create policy suppliers_update on public.suppliers for update to authenticated
  using ((select private.can(establishment_id, 'purchasing'))) with check ((select private.can(establishment_id, 'purchasing')));
create policy suppliers_delete on public.suppliers for delete to authenticated using ((select private.can(establishment_id, 'purchasing')));

-- fichas técnicas (módulo produção)
drop policy recipes_write on public.recipes;
create policy recipes_insert on public.recipes for insert to authenticated with check ((select private.can(establishment_id, 'production')));
create policy recipes_update on public.recipes for update to authenticated
  using ((select private.can(establishment_id, 'production'))) with check ((select private.can(establishment_id, 'production')));
create policy recipes_delete on public.recipes for delete to authenticated using ((select private.can(establishment_id, 'production')));

drop policy recipe_items_write on public.recipe_items;
create policy recipe_items_insert on public.recipe_items for insert to authenticated
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and (select private.can(r.establishment_id, 'production'))));
create policy recipe_items_update on public.recipe_items for update to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and (select private.can(r.establishment_id, 'production'))))
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and (select private.can(r.establishment_id, 'production'))));
create policy recipe_items_delete on public.recipe_items for delete to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and (select private.can(r.establishment_id, 'production'))));

-- clientes (a equipe do balcão lê; quem cuida dos pedidos altera)
drop policy customers_write on public.customers;
create policy customers_insert on public.customers for insert to authenticated with check ((select private.can_staff(establishment_id, 'orders')));
create policy customers_update on public.customers for update to authenticated
  using ((select private.can_staff(establishment_id, 'orders'))) with check ((select private.can_staff(establishment_id, 'orders')));

-- entregadores e entregas: leitura única (equipe ou o próprio entregador), escrita só da equipe
drop policy couriers_staff on public.couriers;
drop policy couriers_self_read on public.couriers;
create policy couriers_read on public.couriers for select to authenticated
  using ((select private.can_staff(establishment_id, 'deliveries')) or user_id = (select auth.uid()));
create policy couriers_insert on public.couriers for insert to authenticated with check ((select private.can_staff(establishment_id, 'deliveries')));
create policy couriers_update on public.couriers for update to authenticated
  using ((select private.can_staff(establishment_id, 'deliveries'))) with check ((select private.can_staff(establishment_id, 'deliveries')));
create policy couriers_delete on public.couriers for delete to authenticated using ((select private.can_staff(establishment_id, 'deliveries')));

drop policy deliveries_staff on public.deliveries;
drop policy deliveries_courier_read on public.deliveries;
create policy deliveries_read on public.deliveries for select to authenticated
  using (
    (select private.can_staff(establishment_id, 'deliveries'))
    or courier_id in (select c.id from public.couriers c where c.user_id = (select auth.uid()))
  );
create policy deliveries_insert on public.deliveries for insert to authenticated with check ((select private.can_staff(establishment_id, 'deliveries')));
create policy deliveries_update on public.deliveries for update to authenticated
  using ((select private.can_staff(establishment_id, 'deliveries'))) with check ((select private.can_staff(establishment_id, 'deliveries')));
create policy deliveries_delete on public.deliveries for delete to authenticated using ((select private.can_staff(establishment_id, 'deliveries')));
