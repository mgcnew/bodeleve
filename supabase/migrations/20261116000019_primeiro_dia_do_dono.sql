-- Bodeleve · o que o dono precisa no primeiro dia: saldo inicial das contas, custo do estoque contado e convite de quem já tem login.

create or replace function public.stock_count_apply(p_establishment uuid, p_lines jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_count uuid; ln record; v_system numeric; v_diff numeric; v_lot uuid; v_units numeric := 0; v_cost bigint := 0; v_cnt int := 0;
begin
  if not private.can(p_establishment, 'stock') then raise exception 'forbidden' using errcode = '42501'; end if;
  if coalesce(jsonb_typeof(p_lines), '') <> 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'empty_count' using errcode = 'P0001'; end if;
  insert into public.inventory_counts (establishment_id, created_by) values (p_establishment, (select auth.uid())) returning id into v_count;

  for ln in select (x ->> 'product_id')::uuid as product_id, (x ->> 'counted')::numeric as counted from jsonb_array_elements(p_lines) x loop
    if ln.counted is null or ln.counted < 0 then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
    perform 1 from public.products where id = ln.product_id and establishment_id = p_establishment for update;
    if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
    select coalesce(sum(qty), 0) into v_system from public.stock_movements where product_id = ln.product_id;
    insert into public.inventory_count_items (count_id, product_id, counted, system_qty) values (v_count, ln.product_id, ln.counted, v_system);
    v_diff := ln.counted - v_system;
    if v_diff = 0 then continue; end if;
    v_cnt := v_cnt + 1;
    if v_diff < 0 then
      perform private.consume_stock(p_establishment, ln.product_id, -v_diff, 'inventory', 'Inventário', 'Inventário · contagem', v_count);
      v_units := v_units + v_diff;
    else
      select id into v_lot from public.product_lots where product_id = ln.product_id order by received_at desc, id limit 1;
      if v_lot is null then
        -- o lote da primeira contagem leva o último custo conhecido do produto (sem ele o custo e a margem ficariam zerados)
        insert into public.product_lots (establishment_id, product_id, code, unit_cost_cents, source)
        values (p_establishment, ln.product_id, 'INV-' || to_char(now(), 'YYMMDD'), coalesce((select last_cost_cents from public.products where id = ln.product_id), 0), 'Inventário') returning id into v_lot;
      end if;
      insert into public.stock_movements (establishment_id, product_id, lot_id, type, qty, ref, description, created_by, created_by_name, batch_id)
      values (p_establishment, ln.product_id, v_lot, 'inventory', v_diff, 'Inventário', 'Inventário · contagem', (select auth.uid()), private.actor_name(p_establishment), v_count);
      v_units := v_units + v_diff;
    end if;
  end loop;
  return jsonb_build_object('count_id', v_count, 'changed_products', v_cnt, 'delta_units', v_units);
end;
$$;


-- Saldo inicial de uma conta (banco ou caixa). Vale uma vez só: depois, o saldo muda só por lançamentos.
create function public.set_opening_balance(p_establishment uuid, p_account text, p_cents bigint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_kind public.account_kind; v_acc uuid;
begin
  if not private.can(p_establishment, 'finance') then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_cents is null or p_cents < 0 then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  begin v_kind := p_account::public.account_kind; exception when others then raise exception 'invalid_account' using errcode = 'P0001'; end;
  select id into v_acc from public.financial_accounts where establishment_id = p_establishment and kind = v_kind for update;
  if v_acc is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if exists (select 1 from public.financial_transactions where account_id = v_acc and kind = 'opening') then raise exception 'already_set' using errcode = 'P0001'; end if;
  if p_cents = 0 then return v_acc; end if;
  return private.add_tx(p_establishment, v_kind, p_cents, 'opening', 'Saldo inicial', 'Informado ao começar a usar o sistema');
end;
$$;
revoke all on function public.set_opening_balance(uuid, text, bigint) from public, anon;
grant execute on function public.set_opening_balance(uuid, text, bigint) to authenticated;

-- Convidar quem já tem login: o vínculo nasce ativo (com o cadastro público desligado, é assim que a pessoa entra para a equipe).
create function private.link_membership_to_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  if new.user_id is null then
    select id into v_user from auth.users where lower(email) = new.email limit 1;
    if v_user is not null then
      new.user_id := v_user;
      new.status := 'active';
    end if;
  end if;
  return new;
end;
$$;
create trigger memberships_link_existing_user before insert on public.memberships
  for each row execute function private.link_membership_to_user();
revoke all on function private.link_membership_to_user() from public, anon, authenticated;
