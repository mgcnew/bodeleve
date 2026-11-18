-- Prazo por cliente (D21): cada cliente pode ter um prazo em dias; no balcão, a venda "a prazo" vira
-- conta a receber com vencimento = hoje + prazo. Aditivo: nada existente muda de comportamento.
-- 1) novo valor do tipo de pagamento (rodar sozinho antes do resto)
alter type public.payment_method add value if not exists 'on_account';

-- 2) prazo do cliente
alter table public.customers add column if not exists credit_days int check (credit_days is null or credit_days between 1 and 365);

-- 3) pos_checkout aceita cliente e pagamento on_account; undo_payment também desfaz recebimentos (kind 'settlement')
do $mig$
declare d text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'pos_checkout';
  d := replace(d, $q$v_ref text := nullif(btrim(coalesce(p_sale ->> 'client_ref', '')), '');$q$,
    $q$v_ref text := nullif(btrim(coalesce(p_sale ->> 'client_ref', '')), '');
  v_credit bigint := 0; v_customer uuid := nullif(btrim(coalesce(p_sale ->> 'customer_id', '')), '')::uuid; v_cname text; v_days int;$q$);
  d := replace(d, $q$if pay.method not in ('cash', 'pix', 'debit', 'credit') or$q$, $q$if pay.method not in ('cash', 'pix', 'debit', 'credit', 'on_account') or$q$);
  d := replace(d, $q$if pay.method = 'pix' then v_pix := v_pix + pay.cents; end if;$q$,
    $q$if pay.method = 'pix' then v_pix := v_pix + pay.cents; end if;
    if pay.method = 'on_account' then v_credit := v_credit + pay.cents; end if;$q$);
  d := replace(d, $q$if v_paid <> v_total or v_total <= 0 then raise exception 'invalid_payment' using errcode = 'P0001'; end if;$q$,
    $q$if v_paid <> v_total or v_total <= 0 then raise exception 'invalid_payment' using errcode = 'P0001'; end if;
  if v_customer is not null then
    select c.name, c.credit_days into v_cname, v_days from public.customers c where c.id = v_customer and c.establishment_id = p_establishment;
    if not found then raise exception 'unknown_customer' using errcode = 'P0001'; end if;
  end if;
  if v_credit > 0 and (v_customer is null or v_days is null) then raise exception 'no_credit' using errcode = 'P0001'; end if;$q$);
  d := replace(d, $q$payment_method, payment_paid, cash_session_id, created_by, created_by_name, pending_sync, client_ref)$q$, $q$payment_method, payment_paid, cash_session_id, created_by, created_by_name, pending_sync, client_ref, customer_id)$q$);
  d := replace(d, $q$end, true, s.id,$q$, $q$end, (v_credit = 0), s.id,$q$);
  d := replace(d, $q$private.actor_name(p_establishment), false, v_ref)$q$, $q$private.actor_name(p_establishment), false, v_ref, v_customer)$q$);
  d := replace(d, $q$  if v_cash > 0 then perform private.add_tx($q$,
    $q$  if v_credit > 0 then
    insert into public.financial_entries (establishment_id, direction, description, title, kind_label, amount_cents, due_at, origin, ref, recurring)
    values (p_establishment, 'receivable', 'Venda ' || v_number || ' · a prazo', v_cname, 'Venda a prazo', v_credit, now() + make_interval(days => v_days), 'sale', v_number, false);
  end if;
  if v_cash > 0 then perform private.add_tx($q$);
  if d not like '%no_credit%' or d not like '%client_ref, customer_id)%' or d not like '%(v_credit = 0), s.id%' or d not like '%v_ref, v_customer)%' or d not like '%Venda a prazo%' or d not like '%''debit'', ''credit'', ''on_account''%' or d not like '%v_credit := v_credit%' then
    raise exception 'pos_checkout: algum trecho não foi encontrado';
  end if;
  execute d;

  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'undo_payment';
  d := replace(d, $q$t.kind <> 'payment'$q$, $q$t.kind not in ('payment', 'settlement')$q$);
  if d not like '%''settlement''%' then raise exception 'undo_payment: trecho não encontrado'; end if;
  execute d;
end
$mig$;

-- 4) receber uma conta a receber (venda a prazo, cartão a liquidar)
create or replace function public.receive_entry(p_entry uuid, p_amount_cents bigint, p_account text, p_method text, p_received_at timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path to ''
as $f$
declare e public.financial_entries; v_kind public.account_kind; v_tx uuid; v_remaining bigint;
begin
  select * into e from public.financial_entries where id = p_entry for update;
  if not found or e.direction <> 'receivable' then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.can(e.establishment_id, 'finance') then raise exception 'forbidden' using errcode = '42501'; end if;
  if e.paid_at is not null or e.paid_cents >= e.amount_cents then raise exception 'already_paid' using errcode = 'P0001'; end if;
  v_remaining := e.amount_cents - e.paid_cents;
  if p_amount_cents is null or p_amount_cents <= 0 or p_amount_cents > v_remaining then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  begin v_kind := p_account::public.account_kind; exception when others then raise exception 'invalid_account' using errcode = 'P0001'; end;
  v_tx := private.add_tx(e.establishment_id, v_kind, p_amount_cents, 'settlement', coalesce(e.title, e.description),
                         coalesce(p_method, '') || coalesce(' · ' || e.ref, ''), null, null, null, e.id, p_amount_cents);
  update public.financial_entries set paid_cents = paid_cents + p_amount_cents where id = e.id returning * into e;
  if e.paid_cents >= e.amount_cents then
    update public.financial_entries set paid_at = coalesce(p_received_at, now()) where id = e.id;
  end if;
  return jsonb_build_object('transaction_id', v_tx);
end;
$f$;

revoke all on function public.receive_entry(uuid, bigint, text, text, timestamptz) from public, anon;
grant execute on function public.receive_entry(uuid, bigint, text, text, timestamptz) to authenticated;

-- 5) a conta a receber guarda de qual cliente é (para somar o que cada um deve)
alter table public.financial_entries add column if not exists customer_id uuid references public.customers(id) on delete set null;

do $mig$
declare d text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'pos_checkout';
  d := replace(d, $q$origin, ref, recurring)
    values (p_establishment, 'receivable'$q$, $q$origin, ref, recurring, customer_id)
    values (p_establishment, 'receivable'$q$);
  d := replace(d, $q$'sale', v_number, false);$q$, $q$'sale', v_number, false, v_customer);$q$);
  if d not like '%recurring, customer_id)%' or d not like '%''sale'', v_number, false, v_customer)%' then raise exception 'trecho não encontrado'; end if;
  execute d;
end
$mig$;

-- 6) cancelar a venda a prazo apaga a conta a receber (se o cliente já pagou parte, o cancelamento é recusado)
do $mig$
declare d text;
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'pos_cancel_sale';
  d := replace(d, $q$  perform private.order_return_stock($q$, $q$  -- venda a prazo: some a conta a receber, a não ser que o cliente já tenha pago parte dela
  if exists (select 1 from public.financial_entries fe where fe.establishment_id = o.establishment_id and fe.ref = o.number and fe.direction = 'receivable' and fe.customer_id is not null and fe.paid_cents > 0) then
    raise exception 'credit_already_received' using errcode = 'P0001';
  end if;
  delete from public.financial_entries fe where fe.establishment_id = o.establishment_id and fe.ref = o.number and fe.direction = 'receivable' and fe.customer_id is not null and fe.paid_cents = 0;
  perform private.order_return_stock($q$);
  if d not like '%credit_already_received%' then raise exception 'trecho não encontrado'; end if;
  execute d;
end
$mig$;
