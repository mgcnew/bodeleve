-- Bodeleve · corrige as proteções da migration 10: o gatilho roda como a pessoa logada, que não pode executar a função auxiliar.
-- A checagem agora é feita dentro de cada gatilho (current_user: as funções do banco rodam como dono e passam; a API roda como authenticated e é barrada).
create or replace function private.guard_purchase_items()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' and new.received_qty <> 0 then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
    if tg_op = 'UPDATE' and new.received_qty is distinct from old.received_qty then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
  end if;
  return new;
end;
$$;
create trigger purchase_items_guard before insert or update on public.purchase_order_items
  for each row execute function private.guard_purchase_items();

-- Pedido de compra: rascunho, enviado e cancelado são da equipe; recebido e recebido parcial, só do recebimento.
create or replace function private.guard_purchase_orders()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.status in ('received', 'partially_received') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
      raise exception 'direct_write_blocked' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and old.status in ('received', 'partially_received') and new.status is distinct from old.status then
      raise exception 'direct_write_blocked' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.received_at is distinct from old.received_at then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
  end if;
  return new;
end;
$$;
create trigger purchase_orders_guard before insert or update on public.purchase_orders
  for each row execute function private.guard_purchase_orders();

-- Ordem de produção: planejada e em andamento são da equipe; concluir e o que vem do apontamento, só a função.
create or replace function private.guard_production_orders()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
    if tg_op = 'UPDATE' and old.status = 'done' then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
    if tg_op = 'INSERT' and (new.good_qty is not null or new.lot_id is not null or new.cost_per_unit_cents is not null or new.done_at is not null) then
      raise exception 'direct_write_blocked' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and (new.good_qty is distinct from old.good_qty or new.lot_id is distinct from old.lot_id
        or new.cost_per_unit_cents is distinct from old.cost_per_unit_cents or new.done_at is distinct from old.done_at) then
      raise exception 'direct_write_blocked' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger production_orders_guard before insert or update on public.production_orders
  for each row execute function private.guard_production_orders();

-- Contas a pagar e a receber: o que foi pago só muda por pagamento (que lança no caixa e dá para desfazer).
create or replace function private.guard_financial_entries()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' and (new.paid_cents <> 0 or new.paid_at is not null) then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
    if tg_op = 'UPDATE' and (new.paid_cents is distinct from old.paid_cents or new.paid_at is distinct from old.paid_at) then
      raise exception 'direct_write_blocked' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and old.paid_cents > 0 and new.amount_cents is distinct from old.amount_cents then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
    if tg_op = 'DELETE' and old.paid_cents > 0 then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger financial_entries_guard before insert or update or delete on public.financial_entries
  for each row execute function private.guard_financial_entries();

drop function private.is_api_caller();
