-- Corrige o nome de quem aprova o cancelamento: perfil com nome vazio ('') não é nulo; cai para o e-mail da conta.
create or replace function public.pos_cancel_sale(p_order uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  o public.orders; v_uid uuid := (select auth.uid()); v_fails int; v_approver record; t record;
begin
  select * into o from public.orders where id = p_order for update;
  if not found or o.channel <> 'pos' then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.status = 'cancelled' then raise exception 'already_cancelled' using errcode = 'P0001'; end if;

  select count(*) into v_fails from public.pin_failures where establishment_id = o.establishment_id and user_id = v_uid and at > now() - interval '10 minutes';
  if v_fails >= 5 then return jsonb_build_object('error', 'pin_locked'); end if;

  select m.id,
         coalesce(nullif(m.display_name, ''), (select nullif(pr.full_name, '') from public.profiles pr where pr.id = m.user_id), nullif(m.email, ''), 'Gestor') as name,
         m.role
    into v_approver
    from public.memberships m join public.manager_pins mp on mp.membership_id = m.id
   where m.establishment_id = o.establishment_id and m.status = 'active' and m.role in ('owner', 'manager')
     and mp.pin_hash = extensions.crypt(coalesce(p_pin, ''), mp.pin_hash)
   limit 1;
  if v_approver.id is null then
    insert into public.pin_failures (establishment_id, user_id) values (o.establishment_id, v_uid);
    return jsonb_build_object('error', 'invalid_pin');
  end if;

  perform private.order_return_stock(o.id, 'Venda ' || o.number || ' cancelada · volta ao estoque');
  for t in select * from public.financial_transactions x where x.order_id = o.id and x.reversal_of is null
            and not exists (select 1 from public.financial_transactions r where r.reversal_of = x.id) loop
    insert into public.financial_transactions (establishment_id, account_id, amount_cents, kind, title, note, order_id, reversal_of)
    values (t.establishment_id, t.account_id, -t.amount_cents, 'sale', replace(t.title, ' · ', ' cancelada · '), 'Balcão', o.id, t.id);
  end loop;
  update public.orders
     set status = 'cancelled', cancelled_at = now(), cancelled_by_name = private.actor_name(o.establishment_id),
         approved_by_name = v_approver.name || case v_approver.role when 'owner' then ' (Dono)' else ' (Gerente)' end
   where id = o.id;
  return jsonb_build_object('ok', true, 'approved_by', v_approver.name);
end;
$$;
