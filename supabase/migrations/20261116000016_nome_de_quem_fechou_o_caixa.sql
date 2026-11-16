-- O caixa passa a guardar o nome de quem fechou (a tela mostra, e quem tem só o papel de balcão não lê a equipe).
alter table public.cash_sessions add column closed_by_name text;

create or replace function public.pos_close_session(p_establishment uuid, p_counted_cents bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.cash_sessions; v_expected bigint; v_diff bigint; v_tx uuid;
begin
  if not private.can_staff(p_establishment, 'pos') then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into s from public.cash_sessions where establishment_id = p_establishment and status = 'open' for update;
  if not found then raise exception 'no_session' using errcode = 'P0001'; end if;
  if p_counted_cents is null or p_counted_cents < 0 then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  v_expected := private.cash_expected(s.id);
  v_diff := p_counted_cents - v_expected;
  -- a diferença acerta o saldo do caixa no financeiro: o que está na gaveta é o que foi contado
  if v_diff <> 0 then
    v_tx := private.add_tx(p_establishment, 'cash', v_diff, 'manual', 'Diferença do caixa · ' || case when v_diff > 0 then 'sobra' else 'falta' end, 'Fechamento do caixa');
  end if;
  update public.cash_sessions
     set status = 'closed', closed_at = now(), closed_by = (select auth.uid()), closed_by_name = private.actor_name(p_establishment), counted_cents = p_counted_cents, expected_cents = v_expected, difference_tx_id = v_tx
   where id = s.id;
  return jsonb_build_object('session_id', s.id, 'expected_cents', v_expected, 'counted_cents', p_counted_cents, 'difference_cents', v_diff);
end;
$$;

