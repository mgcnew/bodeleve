-- Bodeleve · financeiro, caixa de mensagens, saldos (views) e Realtime.

create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  kind public.account_kind not null,
  name text not null,
  unique (establishment_id, kind)
);

create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  direction public.entry_direction not null,
  description text not null,
  title text,
  -- "Boleto · compra PC-0053", "Despesa fixa · débito automático"
  kind_label text,
  amount_cents bigint not null check (amount_cents > 0),
  due_at timestamptz not null,
  paid_at timestamptz,
  -- pagamento parcial (H-I50)
  paid_cents bigint not null default 0 check (paid_cents >= 0 and paid_cents <= amount_cents),
  -- origem: compra, venda, manual ou despesa fixa
  origin text not null check (origin in ('purchase', 'sale', 'manual', 'fixed')),
  ref text,
  supplier_id uuid references public.suppliers (id) on delete set null,
  note text,
  tag text,
  -- despesa fixa: ao pagar, gera a do mês seguinte
  recurring boolean not null default false,
  generated_from uuid references public.financial_entries (id) on delete set null,
  created_at timestamptz not null default now()
);
create index financial_entries_open_idx on public.financial_entries (establishment_id, due_at) where paid_at is null;
create index financial_entries_supplier_idx on public.financial_entries (supplier_id);
create index financial_entries_generated_idx on public.financial_entries (generated_from);

-- Lançamentos de dinheiro nas duas contas (banco e caixa). O saldo é a soma. Histórico nunca é apagado: desfazer é um lançamento contrário.
create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  at timestamptz not null default now(),
  account_id uuid not null references public.financial_accounts (id) on delete restrict,
  -- positivo entra, negativo sai
  amount_cents bigint not null check (amount_cents <> 0),
  kind public.tx_kind not null,
  title text not null,
  note text not null default '',
  entry_id uuid references public.financial_entries (id) on delete set null,
  -- parte que quitou a conta; o resto é multa e juros
  principal_cents bigint,
  -- as duas pontas de uma transferência
  transfer_id uuid,
  reversal_of uuid references public.financial_transactions (id) on delete restrict,
  receipt_path text
);
create index financial_transactions_account_idx on public.financial_transactions (account_id, at desc);
create index financial_transactions_establishment_idx on public.financial_transactions (establishment_id, at desc);
create index financial_transactions_entry_idx on public.financial_transactions (entry_id);
create index financial_transactions_reversal_idx on public.financial_transactions (reversal_of);
create index financial_transactions_transfer_idx on public.financial_transactions (transfer_id) where transfer_id is not null;

alter table public.cash_sessions
  add constraint cash_sessions_difference_tx_fk foreign key (difference_tx_id) references public.financial_transactions (id) on delete set null;
create index cash_sessions_difference_tx_idx on public.cash_sessions (difference_tx_id);

-- D21: mensagens que o sistema montou e NÃO enviou (pedido ao fornecedor, comprovante, convite). Quando o envio for aprovado, um serviço lê daqui.
create table public.outbox_messages (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  kind text not null,
  recipient text not null,
  body text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index outbox_messages_establishment_idx on public.outbox_messages (establishment_id, created_at desc);

alter table public.financial_accounts enable row level security;
alter table public.financial_entries enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.outbox_messages enable row level security;

create policy financial_accounts_read on public.financial_accounts for select to authenticated
  using ((select private.can_any(establishment_id, array['finance','pos','dashboard']::public.app_module[])));
create policy financial_entries_read on public.financial_entries for select to authenticated
  using ((select private.can_any(establishment_id, array['finance','purchasing','dashboard']::public.app_module[])));
-- conta nova ou ainda sem pagamento: cadastro direto. Pagar mexe em dinheiro: só pela função.
create policy financial_entries_insert on public.financial_entries for insert to authenticated
  with check ((select private.can(establishment_id, 'finance')) and paid_cents = 0 and paid_at is null);
create policy financial_entries_update on public.financial_entries for update to authenticated
  using ((select private.can(establishment_id, 'finance')) and paid_cents = 0 and paid_at is null)
  with check ((select private.can(establishment_id, 'finance')) and paid_cents = 0 and paid_at is null);
create policy financial_entries_delete on public.financial_entries for delete to authenticated
  using ((select private.can(establishment_id, 'finance')) and paid_cents = 0 and paid_at is null);
create policy financial_transactions_read on public.financial_transactions for select to authenticated
  using ((select private.can_any(establishment_id, array['finance','dashboard']::public.app_module[])));
create policy outbox_messages_read on public.outbox_messages for select to authenticated
  using ((select private.can_any(establishment_id, array['team','finance','purchasing']::public.app_module[])));

-- ───────── atualização automática de updated_at ─────────
create function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger products_touch before update on public.products
  for each row execute function private.touch_updated_at();

-- ───────── saldos (derivados dos movimentos; nunca colunas editáveis) ─────────
-- security_invoker: quem consulta só vê o que a política das tabelas de baixo deixa.
create view public.lot_balances with (security_invoker = true) as
select l.id as lot_id, l.establishment_id, l.product_id, l.code, l.expires_at, l.unit_cost_cents, l.received_at,
       coalesce(sum(m.qty), 0) as balance
from public.product_lots l
left join public.stock_movements m on m.lot_id = l.id
group by l.id;

-- físico = soma dos movimentos; reservado = pedidos online que ainda não saíram da casa + reservas manuais;
-- disponível = físico − reservado (H2, H-I31). "Em compra" e "em produção" entram nas telas, a partir das tabelas próprias.
create view public.product_balances with (security_invoker = true) as
select p.id as product_id, p.establishment_id, p.slug, p.name, p.min_stock,
       coalesce(mv.physical, 0) as physical,
       coalesce(ro.reserved, 0) + coalesce(rm.reserved, 0) as reserved,
       coalesce(mv.physical, 0) - (coalesce(ro.reserved, 0) + coalesce(rm.reserved, 0)) as available
from public.products p
left join (select product_id, sum(qty) as physical from public.stock_movements group by product_id) mv on mv.product_id = p.id
left join (
  select oi.product_id, sum(oi.qty) as reserved
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.channel = 'online' and o.status in ('received', 'preparing', 'ready_for_delivery', 'ready_for_pickup')
  group by oi.product_id
) ro on ro.product_id = p.id
left join (select product_id, sum(qty) as reserved from public.stock_reservations group by product_id) rm on rm.product_id = p.id;

create view public.account_balances with (security_invoker = true) as
select a.id as account_id, a.establishment_id, a.kind, a.name, coalesce(sum(t.amount_cents), 0)::bigint as balance_cents
from public.financial_accounts a
left join public.financial_transactions t on t.account_id = a.id
group by a.id;

-- ───────── Realtime: pedidos, entregas, estoque e caixa (o Realtime respeita as políticas acima) ─────────
alter publication supabase_realtime add table public.orders, public.deliveries, public.stock_movements, public.cash_sessions, public.cash_movements;
