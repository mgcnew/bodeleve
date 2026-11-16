-- Bodeleve · catálogo, estoque por lote, compras e produção.
-- O saldo de estoque NÃO é coluna: deriva de stock_movements (view product_balances, migration seguinte).
-- Tabelas de razão (movimentos, lotes, recebimentos, consumos) não têm política de escrita: só as funções
-- (security definer) escrevem, para a baixa por lote e o custo nunca dependerem do cliente.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  slug text not null,
  name text not null,
  -- área do estoque que não é categoria da loja (insumos)
  is_internal boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (establishment_id, slug),
  unique (establishment_id, name)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  name text not null,
  supplies text not null default '',
  phone text,
  email text,
  tax_id text,
  lead_time_days int,
  payment_terms text,
  previous_purchases_cents bigint not null default 0,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Item de estoque e produto de venda são a mesma linha (H-I58): o cadastro é do estoque; a venda acrescenta preço e publicação.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  slug text not null,
  name text not null,
  -- medida da embalagem: "500 g", "1 kg", "200 ml"
  unit text not null default '',
  item_type public.item_type not null,
  origin public.item_origin,
  category_id uuid references public.categories (id) on delete set null,
  -- quanto cada unidade contém, para fichas técnicas ("Coalho líquido 50 ml" = 1 un com 50 ml)
  content_qty numeric(14,4),
  content_unit text,
  min_stock numeric(14,4) not null default 0,
  tracks_expiry boolean not null default false,
  supplier_id uuid references public.suppliers (id) on delete set null,
  last_cost_cents bigint,
  price_cents bigint check (price_cents is null or price_cents >= 0),
  -- preço do quilo no balcão (H-I80); a loja online vende a embalagem pelo price_cents
  weight_price_cents bigint check (weight_price_cents is null or weight_price_cents >= 0),
  is_published boolean not null default false,
  is_favorite_pos boolean not null default false,
  sold_by_weight boolean not null default false,
  description text not null default '',
  -- ingredientes, conservação, validade: conteúdo do dono (P5)
  details jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (establishment_id, slug),
  constraint products_raw_material_not_sold check (
    item_type <> 'raw_material'
    or (origin is null and price_cents is null and not is_published and not is_favorite_pos and not sold_by_weight)
  ),
  constraint products_published_has_price check (not is_published or price_cents is not null),
  constraint products_weight_has_price check (not sold_by_weight or weight_price_cents is not null)
);
create index products_category_idx on public.products (category_id);
create index products_supplier_idx on public.products (supplier_id);
create index products_establishment_published_idx on public.products (establishment_id) where is_published;

create table public.product_lots (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  code text not null,
  expires_at timestamptz,
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  received_at timestamptz not null default now(),
  -- documento de origem: PC-0057, OP-0032
  source text,
  unique (product_id, code)
);
create index product_lots_establishment_idx on public.product_lots (establishment_id);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  lot_id uuid references public.product_lots (id) on delete restrict,
  type public.movement_type not null,
  -- positivo entra, negativo sai
  qty numeric(14,4) not null check (qty <> 0),
  at timestamptz not null default now(),
  -- documento de origem: V-0212, PC-0057, OP-0031, "Ajuste manual"
  ref text not null default '',
  description text,
  created_by uuid references auth.users (id) on delete set null,
  created_by_name text,
  batch_id uuid,
  -- o histórico nunca é apagado: desfazer é um lançamento contrário
  reversal_of uuid references public.stock_movements (id) on delete restrict
);
create index stock_movements_product_idx on public.stock_movements (product_id, at desc);
create index stock_movements_lot_idx on public.stock_movements (lot_id);
create index stock_movements_establishment_idx on public.stock_movements (establishment_id, at desc);
create index stock_movements_reversal_idx on public.stock_movements (reversal_of);
create index stock_movements_batch_idx on public.stock_movements (batch_id) where batch_id is not null;

create table public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  qty numeric(14,4) not null check (qty > 0),
  ref text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index stock_reservations_product_idx on public.stock_reservations (product_id);
create index stock_reservations_establishment_idx on public.stock_reservations (establishment_id);

create table public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  undone_at timestamptz
);
create index inventory_counts_establishment_idx on public.inventory_counts (establishment_id);

create table public.inventory_count_items (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references public.inventory_counts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  counted numeric(14,4) not null check (counted >= 0),
  system_qty numeric(14,4) not null
);
create index inventory_count_items_count_idx on public.inventory_count_items (count_id);
create index inventory_count_items_product_idx on public.inventory_count_items (product_id);

-- ───────── compras ─────────
create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  number text not null,
  supplier_id uuid not null references public.suppliers (id) on delete restrict,
  status public.po_status not null default 'draft',
  payment_term text,
  expected_at timestamptz,
  sent_at timestamptz,
  received_at timestamptz,
  notes text not null default '',
  -- texto montado para o fornecedor. D21: guardado, não enviado.
  message_text text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (establishment_id, number)
);
create index purchase_orders_supplier_idx on public.purchase_orders (supplier_id);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  qty numeric(14,4) not null check (qty > 0),
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  received_qty numeric(14,4) not null default 0 check (received_qty >= 0)
);
create index purchase_order_items_po_idx on public.purchase_order_items (purchase_order_id);
create index purchase_order_items_product_idx on public.purchase_order_items (product_id);

create table public.goods_receipts (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders (id) on delete restrict,
  received_at timestamptz not null default now(),
  received_by uuid references auth.users (id) on delete set null,
  total_cents bigint not null default 0,
  undone_at timestamptz
);
create index goods_receipts_po_idx on public.goods_receipts (purchase_order_id);
create index goods_receipts_establishment_idx on public.goods_receipts (establishment_id);

create table public.goods_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.goods_receipts (id) on delete cascade,
  purchase_order_item_id uuid references public.purchase_order_items (id) on delete set null,
  product_id uuid not null references public.products (id) on delete restrict,
  qty numeric(14,4) not null check (qty > 0),
  cost_cents bigint not null default 0,
  lot_id uuid references public.product_lots (id) on delete restrict
);
create index goods_receipt_items_receipt_idx on public.goods_receipt_items (receipt_id);
create index goods_receipt_items_po_item_idx on public.goods_receipt_items (purchase_order_item_id);
create index goods_receipt_items_product_idx on public.goods_receipt_items (product_id);
create index goods_receipt_items_lot_idx on public.goods_receipt_items (lot_id);

-- ───────── produção ─────────
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  yield_per_batch numeric(14,4) not null check (yield_per_batch > 0),
  batch_label text not null default 'fornada',
  shelf_life_days int,
  lot_prefix text not null default '',
  -- gás e energia por fornada (H-G19)
  overhead_cents bigint not null default 0 check (overhead_cents >= 0),
  method text not null default '',
  created_at timestamptz not null default now(),
  unique (establishment_id, product_id)
);

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  qty_per_batch numeric(14,4) not null check (qty_per_batch > 0)
);
create index recipe_items_recipe_idx on public.recipe_items (recipe_id);
create index recipe_items_product_idx on public.recipe_items (product_id);

create table public.production_orders (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  number text not null,
  recipe_id uuid not null references public.recipes (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  batches int not null check (batches > 0),
  planned_qty numeric(14,4) not null check (planned_qty > 0),
  status public.production_status not null default 'planned',
  -- ordem para um pedido da loja; sem isso, vai para o estoque
  destination_order_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  started_at timestamptz,
  done_at timestamptz,
  good_qty numeric(14,4),
  lot_id uuid references public.product_lots (id) on delete set null,
  cost_per_unit_cents bigint,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (establishment_id, number)
);
create index production_orders_recipe_idx on public.production_orders (recipe_id);
create index production_orders_product_idx on public.production_orders (product_id);
create index production_orders_lot_idx on public.production_orders (lot_id);
create index production_orders_destination_idx on public.production_orders (destination_order_id) where destination_order_id is not null;

create table public.production_consumptions (
  id uuid primary key default gen_random_uuid(),
  production_order_id uuid not null references public.production_orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  lot_id uuid references public.product_lots (id) on delete restrict,
  qty numeric(14,4) not null check (qty > 0),
  movement_id uuid references public.stock_movements (id) on delete restrict
);
create index production_consumptions_order_idx on public.production_consumptions (production_order_id);
create index production_consumptions_product_idx on public.production_consumptions (product_id);
create index production_consumptions_lot_idx on public.production_consumptions (lot_id);
create index production_consumptions_movement_idx on public.production_consumptions (movement_id);

-- ───────── RLS ─────────
do $$
declare t text;
begin
  foreach t in array array['categories','suppliers','products','product_lots','stock_movements','stock_reservations','inventory_counts','inventory_count_items',
    'purchase_orders','purchase_order_items','goods_receipts','goods_receipt_items','recipes','recipe_items','production_orders','production_consumptions']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- leitura do catálogo: quem vende, repõe, produz ou confere o estoque
create policy categories_read on public.categories for select to authenticated
  using ((select private.can_any(establishment_id, array['stock','pos','orders','purchasing','production']::public.app_module[])));
create policy categories_write on public.categories for all to authenticated
  using ((select private.can(establishment_id, 'stock'))) with check ((select private.can(establishment_id, 'stock')));

create policy products_read on public.products for select to authenticated
  using ((select private.can_any(establishment_id, array['stock','pos','orders','purchasing','production']::public.app_module[])));
create policy products_write on public.products for all to authenticated
  using ((select private.can(establishment_id, 'stock'))) with check ((select private.can(establishment_id, 'stock')));

create policy suppliers_read on public.suppliers for select to authenticated
  using ((select private.can_any(establishment_id, array['purchasing','stock']::public.app_module[])));
create policy suppliers_write on public.suppliers for all to authenticated
  using ((select private.can(establishment_id, 'purchasing'))) with check ((select private.can(establishment_id, 'purchasing')));

-- razão do estoque: só leitura direta
create policy product_lots_read on public.product_lots for select to authenticated
  using ((select private.can_any(establishment_id, array['stock','pos','orders','purchasing','production']::public.app_module[])));
create policy stock_movements_read on public.stock_movements for select to authenticated
  using ((select private.can_any(establishment_id, array['stock','pos','orders','purchasing','production']::public.app_module[])));

create policy stock_reservations_read on public.stock_reservations for select to authenticated
  using ((select private.can_any(establishment_id, array['stock','orders','pos']::public.app_module[])));
create policy stock_reservations_write on public.stock_reservations for all to authenticated
  using ((select private.can(establishment_id, 'stock'))) with check ((select private.can(establishment_id, 'stock')));

create policy inventory_counts_read on public.inventory_counts for select to authenticated
  using ((select private.can(establishment_id, 'stock')));
create policy inventory_count_items_read on public.inventory_count_items for select to authenticated
  using (exists (select 1 from public.inventory_counts c where c.id = count_id and (select private.can(c.establishment_id, 'stock'))));

create policy purchase_orders_all on public.purchase_orders for all to authenticated
  using ((select private.can(establishment_id, 'purchasing'))) with check ((select private.can(establishment_id, 'purchasing')));
create policy purchase_order_items_all on public.purchase_order_items for all to authenticated
  using (exists (select 1 from public.purchase_orders p where p.id = purchase_order_id and (select private.can(p.establishment_id, 'purchasing'))))
  with check (exists (select 1 from public.purchase_orders p where p.id = purchase_order_id and (select private.can(p.establishment_id, 'purchasing'))));
create policy goods_receipts_read on public.goods_receipts for select to authenticated
  using ((select private.can_any(establishment_id, array['purchasing','stock']::public.app_module[])));
create policy goods_receipt_items_read on public.goods_receipt_items for select to authenticated
  using (exists (select 1 from public.goods_receipts g where g.id = receipt_id and (select private.can_any(g.establishment_id, array['purchasing','stock']::public.app_module[]))));

create policy recipes_read on public.recipes for select to authenticated
  using ((select private.can_any(establishment_id, array['production','stock']::public.app_module[])));
create policy recipes_write on public.recipes for all to authenticated
  using ((select private.can(establishment_id, 'production'))) with check ((select private.can(establishment_id, 'production')));
create policy recipe_items_read on public.recipe_items for select to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and (select private.can_any(r.establishment_id, array['production','stock']::public.app_module[]))));
create policy recipe_items_write on public.recipe_items for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and (select private.can(r.establishment_id, 'production'))))
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and (select private.can(r.establishment_id, 'production'))));

create policy production_orders_read on public.production_orders for select to authenticated
  using ((select private.can_any(establishment_id, array['production','stock']::public.app_module[])));
-- concluir uma ordem baixa insumos e cria lote: só pela função. Direto, a ordem não pode ir para "done".
create policy production_orders_insert on public.production_orders for insert to authenticated
  with check ((select private.can(establishment_id, 'production')) and status <> 'done');
create policy production_orders_update on public.production_orders for update to authenticated
  using ((select private.can(establishment_id, 'production')) and status <> 'done')
  with check ((select private.can(establishment_id, 'production')) and status <> 'done');
create policy production_consumptions_read on public.production_consumptions for select to authenticated
  using (exists (select 1 from public.production_orders o where o.id = production_order_id and (select private.can_any(o.establishment_id, array['production','stock']::public.app_module[]))));
