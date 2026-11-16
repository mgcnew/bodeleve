-- Bodeleve — base (estabelecimento, perfis, vínculos) e catálogo.
-- Fonte: docs/DATA_MODEL_DRAFT.md. Toda tabela de negócio carrega establishment_id
-- e o RLS filtra pelo vínculo do usuário com o estabelecimento (D7, H-G27).

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'manager', 'clerk', 'production', 'courier');
create type public.item_type as enum ('resale', 'raw_material', 'finished');
create type public.product_origin as enum ('third_party', 'house_made', 'bodeleve_brand');
create type public.unit as enum ('un', 'kg', 'g', 'l', 'ml');

-- ---------------------------------------------------------------------------
-- Base
-- ---------------------------------------------------------------------------
create table public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
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
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (establishment_id, profile_id)
);
create index on public.memberships (profile_id);

-- Perfil criado junto com o usuário do Auth
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- O usuário atual tem um destes papéis ativos no estabelecimento?
-- security definer para não cair em recursão no RLS de memberships.
create function public.has_role(est uuid, allowed public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.establishment_id = est
      and m.profile_id = (select auth.uid())
      and m.active
      and m.role = any (allowed)
  );
$$;

create function public.is_member(est uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(est, enum_range(null::public.member_role));
$$;

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.categories (establishment_id);

-- Tipo de item e origem são dimensões separadas (P-E)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text,
  item_type public.item_type not null,
  origin public.product_origin,
  unit public.unit not null default 'un',
  sold_by_weight boolean not null default false,
  price_cents int check (price_cents >= 0),
  min_stock numeric(12, 3),
  tracks_lots boolean not null default false,
  is_published boolean not null default false,
  is_favorite_pos boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- matéria-prima não tem origem de venda
  constraint origin_only_for_sellable check (item_type <> 'raw_material' or origin is null)
);
create index on public.products (establishment_id);
create index on public.products (category_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  position int not null default 0
);
create index on public.product_images (product_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.establishments enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

-- Dados da casa são públicos (a loja mostra nome, endereço, horários)
create policy "casa visível a todos" on public.establishments
  for select using (true);
create policy "dono edita a casa" on public.establishments
  for update using (public.has_role(id, '{owner}'));

create policy "perfil próprio" on public.profiles
  for select using (id = (select auth.uid()));
create policy "atualiza perfil próprio" on public.profiles
  for update using (id = (select auth.uid()));

create policy "membros veem a equipe" on public.memberships
  for select using (public.is_member(establishment_id));
-- Só dono ou gestor cadastra pessoas (H-G1)
create policy "dono e gestor gerenciam equipe" on public.memberships
  for all using (public.has_role(establishment_id, '{owner,manager}'))
  with check (public.has_role(establishment_id, '{owner,manager}'));

-- Catálogo visível sem conta (D5): categorias e produtos publicados
create policy "categorias públicas" on public.categories
  for select using (true);
create policy "gestão edita categorias" on public.categories
  for all using (public.has_role(establishment_id, '{owner,manager}'))
  with check (public.has_role(establishment_id, '{owner,manager}'));

create policy "produtos publicados ou membros" on public.products
  for select using (is_published or public.is_member(establishment_id));
create policy "gestão edita produtos" on public.products
  for all using (public.has_role(establishment_id, '{owner,manager}'))
  with check (public.has_role(establishment_id, '{owner,manager}'));

create policy "imagens de produtos visíveis" on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.is_published or public.is_member(p.establishment_id))
    )
  );
create policy "gestão edita imagens" on public.product_images
  for all using (public.has_role(establishment_id, '{owner,manager}'))
  with check (public.has_role(establishment_id, '{owner,manager}'));
