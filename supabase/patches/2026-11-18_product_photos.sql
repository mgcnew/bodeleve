-- Foto do produto: coluna, espaço de armazenamento "produtos" e a vitrine (store_catalog) devolvendo a foto.
alter table public.products add column if not exists photo_url text
  check (photo_url is null or (length(photo_url) <= 1000 and photo_url ~* '^https://'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy produtos_foto_envio on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and (select private.can(((storage.foldername(name))[1])::uuid, 'stock'::public.app_module)));
create policy produtos_foto_troca on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and (select private.can(((storage.foldername(name))[1])::uuid, 'stock'::public.app_module)))
  with check (bucket_id = 'produtos' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and (select private.can(((storage.foldername(name))[1])::uuid, 'stock'::public.app_module)));
create policy produtos_foto_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and (select private.can(((storage.foldername(name))[1])::uuid, 'stock'::public.app_module)));

drop function if exists public.store_catalog(text);
create function public.store_catalog(p_slug text)
returns table(slug text, name text, unit text, price_cents bigint, origin public.item_origin, category_slug text, description text, details jsonb, photo_url text)
language sql
stable
security definer
set search_path to ''
as $f$
  select p.slug, p.name, p.unit, p.price_cents, p.origin, c.slug, p.description, p.details, p.photo_url
  from public.products p
  join public.establishments e on e.id = p.establishment_id
  left join public.categories c on c.id = p.category_id
  where e.slug = p_slug and p.is_published and p.is_active and p.item_type <> 'raw_material' and p.price_cents is not null
  order by p.name;
$f$;
grant execute on function public.store_catalog(text) to anon, authenticated;

-- a equipe precisa "ver" os arquivos pela API para trocar ou apagar (a leitura pública por endereço não depende disto)
create policy produtos_foto_leitura on storage.objects for select to authenticated
  using (bucket_id = 'produtos' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and (select private.can(((storage.foldername(name))[1])::uuid, 'stock'::public.app_module)));
