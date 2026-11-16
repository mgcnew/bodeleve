-- Bodeleve · clientes, pedidos (loja e balcão), pagamentos, caixa e entregas.
-- Pedidos e vendas de balcão são a mesma tabela (orders.channel), como no rascunho do modelo.
-- Escritas que mexem em estoque, caixa e financeiro vão só por função (migration seguinte); aqui ficam leitura e cadastro simples.

-- Equipe da casa (tudo que não é entregador). O papel entregador tem o módulo "deliveries", mas só pelo app dele.
create function private.can_staff(p_establishment uuid, p_module public.app_module)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.memberships m
    join public.role_modules rm on rm.role = m.role
    where m.user_id = (select auth.uid())
      and m.establishment_id = p_establishment
      and m.status = 'active'
      and m.role <> 'courier'
      and rm.module = p_module
  );
$$;
revoke all on function private.can_staff(uuid, public.app_module) from public, anon;
grant execute on function private.can_staff(uuid, public.app_module) to authenticated;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  phone text not null,
  name text not null,
  since date,
  -- observação interna da equipe
  notes text not null default '',
  channel_note text,
  -- histórico anterior ao sistema (importação): pedidos, total e o que mais compra
  baseline_orders int not null default 0,
  baseline_spent_cents bigint not null default 0,
  baseline_products jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (establishment_id, phone)
);

create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  opened_at timestamptz not null default now(),
  opened_by uuid references auth.users (id) on delete set null,
  opened_by_name text,
  -- dinheiro contado ao abrir, para troco
  opening_cents bigint not null check (opening_cents >= 0),
  baseline jsonb not null default '{"count":0,"cashCents":0,"pixCents":0,"cardCents":0}'::jsonb,
  status public.cash_session_status not null default 'open',
  closed_at timestamptz,
  closed_by uuid references auth.users (id) on delete set null,
  counted_cents bigint,
  expected_cents bigint,
  -- lançamento da diferença no financeiro (reabrir desfaz)
  difference_tx_id uuid
);
create unique index cash_sessions_one_open on public.cash_sessions (establishment_id) where status = 'open';
create index cash_sessions_opened_by_idx on public.cash_sessions (opened_by);
create index cash_sessions_closed_by_idx on public.cash_sessions (closed_by);

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  session_id uuid not null references public.cash_sessions (id) on delete cascade,
  kind text not null check (kind in ('sangria', 'suprimento')),
  cents bigint not null check (cents > 0),
  reason text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_by_name text,
  at timestamptz not null default now()
);
create index cash_movements_session_idx on public.cash_movements (session_id);
create index cash_movements_establishment_idx on public.cash_movements (establishment_id);
create index cash_movements_created_by_idx on public.cash_movements (created_by);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  -- "1042" (loja) ou "V-0213" (balcão)
  number text not null,
  channel public.order_channel not null,
  fulfillment public.fulfillment not null,
  status public.order_status not null default 'received',
  customer_id uuid references public.customers (id) on delete set null,
  -- compra sem conta: quem comprou acompanha pelo número e pelo celular; com login anônimo, também por este vínculo
  customer_user_id uuid references auth.users (id) on delete set null,
  contact_name text not null default '',
  contact_phone text not null default '',
  address jsonb,
  delivery_window jsonb,
  subtotal_cents bigint not null check (subtotal_cents >= 0),
  delivery_fee_cents bigint not null default 0 check (delivery_fee_cents >= 0),
  discount_kind text,
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  discount_reason text,
  total_cents bigint not null check (total_cents >= 0),
  -- pagamento online (um só); no balcão valem as linhas de payments
  payment_method public.payment_method,
  payment_paid boolean not null default false,
  change_for_cents bigint,
  -- código de 4 números que quem comprou informa ao entregador (H-E5). Nunca vai para o app do entregador.
  delivery_code text,
  eta_label text,
  courier_name text,
  step_times jsonb not null default '{}'::jsonb,
  cash_session_id uuid references public.cash_sessions (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_by_name text,
  cancelled_at timestamptz,
  cancelled_by_name text,
  approved_by_name text,
  -- venda de balcão feita sem conexão e ainda não enviada
  pending_sync boolean not null default false,
  created_at timestamptz not null default now(),
  unique (establishment_id, number),
  constraint orders_total_matches check (total_cents = subtotal_cents + delivery_fee_cents - discount_cents),
  constraint orders_delivery_has_address check (fulfillment <> 'delivery' or address is not null)
);
create index orders_customer_idx on public.orders (customer_id);
create index orders_customer_user_idx on public.orders (customer_user_id);
create index orders_cash_session_idx on public.orders (cash_session_id);
create index orders_created_by_idx on public.orders (created_by);
create index orders_open_idx on public.orders (establishment_id, created_at desc) where status not in ('delivered', 'picked_up', 'completed', 'cancelled');
create index orders_day_idx on public.orders (establishment_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  unit text not null default '',
  kind text not null default 'unit' check (kind in ('unit', 'weight')),
  -- unidades inteiras, ou kg (3 casas) nas linhas por peso
  qty numeric(14,4) not null check (qty > 0),
  -- preço da embalagem, ou do kg nas linhas por peso
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  total_cents bigint not null check (total_cents >= 0),
  -- lotes de onde saiu (venda de balcão): [{"lotCode":"QC-1107","qty":2}]
  lots jsonb not null default '[]'::jsonb
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  method public.payment_method not null,
  cents bigint not null check (cents > 0),
  -- dinheiro: quanto o cliente entregou (o troco é a diferença)
  received_cents bigint,
  created_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);
create index payments_establishment_idx on public.payments (establishment_id, created_at desc);

-- ───────── entregas ─────────
create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  -- login por celular (Auth); vazio enquanto o cadastro não foi vinculado
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  kind public.courier_kind not null,
  phone text not null,
  vehicle text not null default '',
  available boolean not null default true,
  pix_key text not null default '',
  created_at timestamptz not null default now(),
  unique (establishment_id, phone)
);
create unique index couriers_user_idx on public.couriers (user_id) where user_id is not null;

-- Várias entregas por pedido: a devolvida fica no histórico e o pedido pode ser atribuído de novo (H-I97).
create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  -- null = publicada para parceiros, ainda sem quem aceitou
  courier_id uuid references public.couriers (id) on delete set null,
  status public.delivery_status not null,
  -- valor pago ao parceiro por esta entrega
  fee_cents bigint,
  items int not null default 0,
  -- quando entrou neste status
  at timestamptz not null default now(),
  expected_at timestamptz,
  return_at timestamptz,
  problem_reason text,
  problem_note text,
  problem_prev jsonb,
  created_at timestamptz not null default now()
);
create unique index deliveries_one_open_per_order on public.deliveries (order_id) where status not in ('delivered', 'returned');
create index deliveries_order_idx on public.deliveries (order_id);
create index deliveries_courier_idx on public.deliveries (courier_id);
create index deliveries_establishment_idx on public.deliveries (establishment_id, at desc);

-- ───────── RLS ─────────
do $$
declare t text;
begin
  foreach t in array array['customers','cash_sessions','cash_movements','orders','order_items','payments','couriers','deliveries']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy customers_read on public.customers for select to authenticated
  using ((select private.can_staff(establishment_id, 'orders')) or (select private.can_staff(establishment_id, 'pos')));
create policy customers_write on public.customers for all to authenticated
  using ((select private.can_staff(establishment_id, 'orders'))) with check ((select private.can_staff(establishment_id, 'orders')));

create policy orders_read on public.orders for select to authenticated
  using (
    (select private.can_any(establishment_id, array['orders','pos','dashboard']::public.app_module[]))
    or customer_user_id = (select auth.uid())
  );
-- mudar status, cancelar e criar pedido mexem em estoque, caixa e financeiro: só por função.
create policy order_items_read on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and ((select private.can_any(o.establishment_id, array['orders','pos','dashboard']::public.app_module[])) or o.customer_user_id = (select auth.uid()))
  ));
create policy payments_read on public.payments for select to authenticated
  using ((select private.can_any(establishment_id, array['orders','pos','dashboard','finance']::public.app_module[])));

create policy cash_sessions_read on public.cash_sessions for select to authenticated
  using ((select private.can_any(establishment_id, array['pos','finance','dashboard']::public.app_module[])));
create policy cash_movements_read on public.cash_movements for select to authenticated
  using ((select private.can_any(establishment_id, array['pos','finance','dashboard']::public.app_module[])));

create policy couriers_staff on public.couriers for all to authenticated
  using ((select private.can_staff(establishment_id, 'deliveries'))) with check ((select private.can_staff(establishment_id, 'deliveries')));
create policy couriers_self_read on public.couriers for select to authenticated
  using (user_id = (select auth.uid()));

create policy deliveries_staff on public.deliveries for all to authenticated
  using ((select private.can_staff(establishment_id, 'deliveries'))) with check ((select private.can_staff(establishment_id, 'deliveries')));
create policy deliveries_courier_read on public.deliveries for select to authenticated
  using (courier_id in (select c.id from public.couriers c where c.user_id = (select auth.uid())));
