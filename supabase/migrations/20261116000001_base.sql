-- Bodeleve · base: tipos, estabelecimento, pessoas, papéis e permissões.
-- Toda tabela de negócio carrega establishment_id; o acesso é decidido por papel (H-G27) em funções do schema private.

create schema if not exists private;

-- ───────── tipos ─────────
create type public.app_role as enum ('owner', 'manager', 'clerk', 'production', 'courier');
create type public.app_module as enum ('dashboard', 'orders', 'pos', 'stock', 'purchasing', 'production', 'finance', 'deliveries', 'team');
create type public.membership_status as enum ('active', 'invited', 'disabled');
create type public.item_type as enum ('resale', 'raw_material', 'finished');
create type public.item_origin as enum ('house', 'brand', 'resale');
create type public.movement_type as enum ('purchase_in', 'production_in', 'production_out', 'sale_out', 'adjustment', 'loss', 'inventory');
create type public.po_status as enum ('draft', 'sent', 'partially_received', 'received', 'cancelled');
create type public.production_status as enum ('planned', 'in_progress', 'done');
create type public.order_channel as enum ('online', 'pos');
create type public.fulfillment as enum ('delivery', 'pickup', 'counter');
create type public.order_status as enum ('received', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'ready_for_pickup', 'picked_up', 'completed', 'cancelled');
create type public.payment_method as enum ('pix', 'card_on_delivery', 'cash', 'debit', 'credit');
create type public.delivery_status as enum ('published', 'reserved', 'assigned', 'accepted', 'en_route', 'delivered', 'returned');
create type public.courier_kind as enum ('own', 'partner');
create type public.account_kind as enum ('bank', 'cash');
create type public.tx_kind as enum ('opening', 'sale', 'payment', 'settlement', 'transfer', 'manual');
create type public.entry_direction as enum ('payable', 'receivable');
create type public.cash_session_status as enum ('open', 'closed');

-- ───────── estabelecimento ─────────
create table public.establishments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  cnpj text,
  address text,
  whatsapp text,
  -- horários em três faixas (A casa): {"weekdays": "", "saturday": "", "sunday": ""}
  hours jsonb not null default '{"weekdays":"","saturday":"","sunday":""}'::jsonb,
  -- hipóteses de operação (H-L*, H-I*): taxa de entrega, valor do parceiro etc. Trocam sem mexer em tela.
  settings jsonb not null default '{"delivery_fee_cents":800,"partner_fee_cents":900,"partner_return_fee_cents":450}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  -- convite pendente: ainda sem conta, só o e-mail
  user_id uuid references auth.users (id) on delete cascade,
  email text not null check (email = lower(email)),
  display_name text,
  role public.app_role not null,
  status public.membership_status not null default 'invited',
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (establishment_id, email)
);
create unique index memberships_user_per_establishment on public.memberships (establishment_id, user_id) where user_id is not null;
create index memberships_user_idx on public.memberships (user_id);

-- Matriz de acesso por papel (a mesma de app/src/permissions/index.ts). É dado de referência, não de exemplo.
create table public.role_modules (
  role public.app_role not null,
  module public.app_module not null,
  primary key (role, module)
);
insert into public.role_modules (role, module)
select 'owner'::public.app_role, m from unnest(enum_range(null::public.app_module)) m
union all
select 'manager'::public.app_role, m from unnest(enum_range(null::public.app_module)) m where m <> 'team'
union all
values ('clerk'::public.app_role, 'orders'::public.app_module), ('clerk', 'pos'), ('production', 'stock'), ('production', 'production'), ('courier', 'deliveries');

-- ───────── permissões ─────────
-- security definer: lê memberships sem depender da política de quem chama. search_path vazio por segurança.
create function private.can(p_establishment uuid, p_module public.app_module)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.memberships m
    join public.role_modules rm on rm.role = m.role
    where m.user_id = (select auth.uid())
      and m.establishment_id = p_establishment
      and m.status = 'active'
      and rm.module = p_module
  );
$$;

create function private.can_any(p_establishment uuid, p_modules public.app_module[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.memberships m
    join public.role_modules rm on rm.role = m.role
    where m.user_id = (select auth.uid())
      and m.establishment_id = p_establishment
      and m.status = 'active'
      and rm.module = any (p_modules)
  );
$$;

create function private.is_member(p_establishment uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid()) and m.establishment_id = p_establishment and m.status = 'active'
  );
$$;

create function private.role_of(p_establishment uuid)
returns public.app_role language sql stable security definer set search_path = '' as $$
  select m.role from public.memberships m
  where m.user_id = (select auth.uid()) and m.establishment_id = p_establishment and m.status = 'active'
  limit 1;
$$;

grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- Quem cria a conta no Auth vira perfil e assume os convites feitos para o mesmo e-mail.
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.phone)
  on conflict (id) do nothing;

  update public.memberships
     set user_id = new.id, status = 'active'
   where user_id is null and email = lower(new.email) and status = 'invited';
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ───────── numeração por estabelecimento (pedidos 1042, vendas V-0213, compras PC-0057, ordens OP-0032) ─────────
create table public.counters (
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  key text not null,
  value bigint not null default 0,
  primary key (establishment_id, key)
);

create function private.next_number(p_establishment uuid, p_key text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v bigint;
begin
  insert into public.counters (establishment_id, key, value) values (p_establishment, p_key, 1)
  on conflict (establishment_id, key) do update set value = public.counters.value + 1
  returning value into v;
  return v;
end;
$$;

-- ───────── RLS: base ─────────
alter table public.establishments enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.role_modules enable row level security;
alter table public.counters enable row level security;

create policy establishments_select on public.establishments for select to authenticated
  using ((select private.is_member(id)));
create policy establishments_update on public.establishments for update to authenticated
  using ((select private.can(id, 'team'))) with check ((select private.can(id, 'team')));

create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy memberships_select on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or (select private.can(establishment_id, 'team')));
create policy memberships_insert on public.memberships for insert to authenticated
  with check ((select private.can(establishment_id, 'team')) and role <> 'owner');
create policy memberships_update on public.memberships for update to authenticated
  using ((select private.can(establishment_id, 'team')) and role <> 'owner')
  with check ((select private.can(establishment_id, 'team')) and role <> 'owner');
create policy memberships_delete on public.memberships for delete to authenticated
  using ((select private.can(establishment_id, 'team')) and role <> 'owner');

create policy role_modules_read on public.role_modules for select to authenticated using (true);
-- counters: sem política = ninguém lê nem escreve direto; só as funções (security definer).

-- Nada de acesso anônimo direto às tabelas: a loja pública usa funções (migration de vendas).
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public, anon;
