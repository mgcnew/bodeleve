-- Pedido da loja por WhatsApp pode pedir "a prazo" (D21). Quem pede não é identificado; o dono confere:
-- aceitar exige prazo cadastrado no cliente, e concluir a retirada cria a conta a receber (vence hoje + prazo).
-- Depende de 2026-11-18_customer_credit.sql.
do $mig$
declare d text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'place_order';
  d := replace(d, $q$v_method not in ('pix', 'card_on_delivery', 'cash', 'on_pickup')$q$, $q$v_method not in ('pix', 'card_on_delivery', 'cash', 'on_pickup', 'on_account')$q$);
  if d not like '%''on_pickup'', ''on_account''%' then raise exception 'place_order: trecho não encontrado'; end if;
  execute d;

  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'order_accept';
  d := replace(d, $q$  update public.orders set status = 'preparing'$q$, $q$  if o.payment_method = 'on_account' and (select c.credit_days from public.customers c where c.id = o.customer_id) is null then
    raise exception 'no_credit' using errcode = 'P0001';
  end if;
  update public.orders set status = 'preparing'$q$);
  if d not like '%no_credit%' then raise exception 'order_accept: trecho não encontrado'; end if;
  execute d;

  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'order_complete_pickup';
  d := replace(d, $q$declare o public.orders;$q$, $q$declare o public.orders; v_name text; v_days int;$q$);
  d := replace(d, $q$  perform private.order_take_stock(o.id);$q$, $q$  if o.payment_method = 'on_account' then
    select c.name, c.credit_days into v_name, v_days from public.customers c where c.id = o.customer_id;
    if v_days is null then raise exception 'no_credit' using errcode = 'P0001'; end if;
    insert into public.financial_entries (establishment_id, direction, description, title, kind_label, amount_cents, due_at, origin, ref, recurring, customer_id)
    values (o.establishment_id, 'receivable', 'Pedido ' || o.number || ' · a prazo', v_name, 'Venda a prazo', o.total_cents, now() + make_interval(days => v_days), 'sale', o.number, false, o.customer_id);
  end if;
  perform private.order_take_stock(o.id);$q$);
  d := replace(d, $q$payment_paid = true,$q$, $q$payment_paid = (o.payment_method <> 'on_account'),$q$);
  if d not like '%Venda a prazo%' or d not like '%o.payment_method <> ''on_account''%' then raise exception 'order_complete_pickup: trecho não encontrado'; end if;
  execute d;
end
$mig$;

-- o dono muda a forma de pagamento de um pedido da loja (ex.: de "a prazo" para "na retirada")
create or replace function public.order_set_payment(p_order uuid, p_method text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $f$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can_staff(o.establishment_id, 'orders') then raise exception 'forbidden' using errcode = '42501'; end if;
  if o.channel <> 'online' or o.status not in ('received', 'preparing', 'ready_for_pickup') then raise exception 'invalid_transition' using errcode = 'P0001'; end if;
  if p_method is null or p_method not in ('on_pickup', 'on_account') then raise exception 'invalid_payment' using errcode = 'P0001'; end if;
  if p_method = 'on_account' and (select c.credit_days from public.customers c where c.id = o.customer_id) is null then raise exception 'no_credit' using errcode = 'P0001'; end if;
  update public.orders set payment_method = p_method::public.payment_method where id = o.id;
  return jsonb_build_object('payment_method', p_method);
end;
$f$;

revoke all on function public.order_set_payment(uuid, text) from public, anon;
grant execute on function public.order_set_payment(uuid, text) to authenticated;
