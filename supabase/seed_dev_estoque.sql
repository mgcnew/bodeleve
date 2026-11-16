-- Fornecedores e parâmetros de estoque FICTÍCIOS para desenvolvimento (reaplicável).
-- Complementa seed_dev.sql: dá custo, estoque mínimo, controle de validade e fornecedor aos 10 produtos.

insert into public.suppliers (establishment_id, name, supplies, contact_name, phone, lead_time_days, payment_terms, active)
select e.id, s.name, s.supplies, s.contact, s.phone, s.lead, s.terms, true
from public.establishments e
cross join (values
  ('Engenho Boa Vista',      'Rapadura, melaço, açúcar',  'Seu Antônio', '(00) 90000-0100', 4, 'Boleto, 14 dias'),
  ('Laticínios Serra Verde', 'Leite, requeijão, nata',    'Dona Célia',  '(00) 90000-0101', 2, 'Boleto, 14 dias'),
  ('Moinho Sertão',          'Farinhas, tapioca, flocão', 'Jorge',       '(00) 90000-0102', 6, 'Pix na entrega'),
  ('Charqueada Norte',       'Carne de sol, charque',     'Raimundo',    '(00) 90000-0103', 4, 'Boleto, 14 dias')
) as s(name, supplies, contact, phone, lead, terms)
where e.slug = 'bodeleve'
  and not exists (select 1 from public.suppliers x where x.establishment_id = e.id and x.name = s.name);

update public.products p
   set last_cost_cents = v.cost,
       min_stock = v.min_stock,
       tracks_expiry = v.expiry,
       supplier_id = (select s.id from public.suppliers s where s.establishment_id = p.establishment_id and s.name = v.supplier)
  from (values
    ('queijo-coalho',       1420, 15, true,  null),
    ('queijo-manteiga',     1680,  6, true,  null),
    ('doce-de-leite',        790,  8, true,  null),
    ('tapioca-granulada',    520, 10, false, 'Moinho Sertão'),
    ('rapadura',             780, 12, true,  'Engenho Boa Vista'),
    ('nata',                 520,  6, true,  'Laticínios Serra Verde'),
    ('requeijao',            680,  8, true,  'Laticínios Serra Verde'),
    ('farinha-de-mandioca',  640, 12, false, 'Moinho Sertão'),
    ('manteiga-de-garrafa', 1500,  6, false, 'Laticínios Serra Verde'),
    ('carne-de-sol',        3600,  5, true,  'Charqueada Norte')
  ) as v(slug, cost, min_stock, expiry, supplier)
 where p.slug = v.slug and p.establishment_id = (select id from public.establishments where slug = 'bodeleve');
