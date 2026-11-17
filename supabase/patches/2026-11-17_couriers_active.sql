-- Desativar entregador sem apagar o histórico de entregas.
--
-- `couriers.active` (padrão verdadeiro). A gestão esconde quem está inativo e o entregador inativo perde o acesso ao
-- app (`me_courier` e `courier_link` só enxergam ativos) e deixa de receber atribuições (`delivery_assign`).
-- Aplicado em 2026-11-17 como migração `couriers_active`.

alter table public.couriers add column if not exists active boolean not null default true;

create or replace function private.me_courier()
 returns public.couriers
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare c public.couriers;
begin
  select * into c from public.couriers where user_id = (select auth.uid()) and active;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  return c;
end;
$function$;

create or replace function public.courier_link()
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_uid uuid := (select auth.uid()); v_phone text; c public.couriers;
begin
  if v_uid is null then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into c from public.couriers where user_id = v_uid and active;
  if not found then
    select right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 11) into v_phone from auth.users u where u.id = v_uid;
    if coalesce(v_phone, '') = '' then raise exception 'unknown_phone' using errcode = 'P0001'; end if;
    update public.couriers set user_id = v_uid
     where user_id is null and active and right(regexp_replace(phone, '\D', '', 'g'), 11) = v_phone
    returning * into c;
    if not found then raise exception 'unknown_phone' using errcode = 'P0001'; end if;
  end if;
  return jsonb_build_object('id', c.id, 'establishment_id', c.establishment_id, 'name', c.name, 'kind', c.kind, 'phone', c.phone, 'vehicle', c.vehicle, 'available', c.available, 'pix_key', c.pix_key);
end;
$function$;

create or replace function public.delivery_assign(p_order uuid, p_courier uuid default null)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare o public.orders; c public.couriers; est public.establishments; v_status public.delivery_status; v_items int; v_id uuid; v_fee bigint; v_route boolean;
begin
  select * into o from public.orders where id = p_order for update;
  if not found or o.fulfillment <> 'delivery' then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'deliveries') then raise exception 'forbidden' using errcode = '42501'; end if;
  if exists (select 1 from public.deliveries d where d.order_id = o.id and d.status not in ('delivered', 'returned')) then raise exception 'already_assigned' using errcode = 'P0001'; end if;
  if o.status <> 'ready_for_delivery' then raise exception 'not_ready' using errcode = 'P0001'; end if;
  select * into est from public.establishments where id = o.establishment_id;
  select coalesce(sum(qty), 0)::int into v_items from public.order_items where order_id = o.id;

  if p_courier is null then
    v_status := 'published'; v_fee := coalesce((est.settings ->> 'partner_fee_cents')::bigint, 900);
  else
    select * into c from public.couriers where id = p_courier and establishment_id = o.establishment_id and kind = 'own' and active;
    if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
    v_route := exists (select 1 from public.deliveries d where d.courier_id = c.id and d.status = 'en_route');
    v_status := case when v_route then 'reserved'::public.delivery_status else 'assigned'::public.delivery_status end;
  end if;
  insert into public.deliveries (establishment_id, order_id, courier_id, status, fee_cents, items)
  values (o.establishment_id, o.id, p_courier, v_status, v_fee, v_items) returning id into v_id;
  return jsonb_build_object('delivery_id', v_id, 'status', v_status, 'courier_name', c.name);
end;
$function$;
