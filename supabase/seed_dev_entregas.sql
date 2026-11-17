-- Entregadores de teste para o banco de desenvolvimento (nomes e telefones fictícios; os reais a casa cadastra).
-- Reaplicável sem duplicar. O entregador só entra no app depois de vinculado ao celular (`courier_link`),
-- o que depende do login por código (P8); até lá a gestão já atribui entregas a eles.
insert into public.couriers (establishment_id, name, kind, phone, vehicle, available)
select e.id, v.name, v.kind::public.courier_kind, v.phone, v.vehicle, v.available
from public.establishments e
cross join (values
  ('Bruno',  'own',     '(00) 90000-0300', 'Moto · [PLACA]', true),
  ('Carlos', 'own',     '(00) 90000-0310', 'Moto · [PLACA]', true),
  ('Diego',  'partner', '(00) 90000-0301', 'Moto · [PLACA]', true)
) as v(name, kind, phone, vehicle, available)
where not exists (select 1 from public.couriers c where c.establishment_id = e.id and c.phone = v.phone);
