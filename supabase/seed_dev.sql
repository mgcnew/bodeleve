-- Catálogo FICTÍCIO para desenvolvimento (dados das telas de design). Pode ser reaplicado.
-- Não faz parte das migrações: é só para ver a loja funcionando num banco de desenvolvimento.
-- Chaves de `details` usadas pela loja: size, storage, shelf_life, ingredients, popular_rank.

with est as (select id from public.establishments where slug = 'bodeleve'),
cats as (
  insert into public.categories (establishment_id, slug, name, position)
  select est.id, c.slug, c.name, c.pos
  from est, (values ('queijos', 'Queijos e laticínios', 1), ('carnes', 'Carnes e embutidos', 2), ('farinhas', 'Farinhas e grãos', 3), ('doces', 'Doces', 4)) as c(slug, name, pos)
  where not exists (select 1 from public.categories x where x.establishment_id = est.id and x.slug = c.slug)
  returning id
)
select count(*) from cats;

insert into public.products (establishment_id, slug, name, unit, item_type, origin, category_id, price_cents, is_published, is_active, description, details)
select e.id, p.slug, p.name, 'un', p.item_type::public.item_type, p.origin::public.item_origin, c.id, p.price, true, true,
       '[DESCRIÇÃO DO PRODUTO: como é feito, sabor, sugestão de uso]',
       jsonb_build_object('size', p.size, 'storage', '[COMO CONSERVAR]', 'shelf_life', '[PRAZO DE VALIDADE]', 'ingredients', '[INGREDIENTES]', 'popular_rank', p.rank)
from public.establishments e
cross join
  (values
    ('queijo-coalho',       'Queijo coalho',       '500 g', 3290, 'finished', 'house',  'queijos',  1),
    ('carne-de-sol',        'Carne de sol',        '500 g', 3490, 'resale',   'resale', 'carnes',   2),
    ('farinha-de-mandioca', 'Farinha de mandioca', '1 kg',  1290, 'resale',   'resale', 'farinhas', 3),
    ('tapioca-granulada',   'Tapioca granulada',   '500 g',  990, 'resale',   'resale', 'farinhas', 4),
    ('queijo-manteiga',     'Queijo manteiga',     '500 g', 3690, 'finished', 'house',  'queijos',  null),
    ('doce-de-leite',       'Doce de leite',       '400 g', 1890, 'finished', 'house',  'doces',    null),
    ('rapadura',            'Rapadura',            '400 g', 1450, 'resale',   'brand',  'doces',    null),
    ('manteiga-de-garrafa', 'Manteiga de garrafa', '200 ml',2800, 'resale',   'brand',  'queijos',  null),
    ('requeijao',           'Requeijão',           '250 g', 1190, 'resale',   'resale', 'queijos',  null),
    ('nata',                'Nata',                '200 g',  950, 'resale',   'resale', 'queijos',  null)
  ) as p(slug, name, size, price, item_type, origin, cat, rank)
join public.categories c on c.establishment_id = e.id and c.slug = p.cat
where e.slug = 'bodeleve'
  and not exists (select 1 from public.products x where x.establishment_id = e.id and x.slug = p.slug);
