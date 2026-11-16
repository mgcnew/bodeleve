-- Bodeleve · fecha as escritas diretas que pulariam as funções.
-- A equipe pode cadastrar e editar compras, ordens de produção e contas, mas não pode marcar como recebido, produzido ou pago por fora:
-- isso só as funções fazem (recebimento gera lote e conta; apontamento baixa insumos; pagamento lança no caixa).
-- As funções rodam como dono (security definer), então passam; chamadas da API rodam como `authenticated` e são barradas.

create function private.is_api_caller()
returns boolean language sql stable set search_path = '' as $$
  select current_user in ('authenticated', 'anon');
$$;

-- Itens de compra: o que foi recebido só muda no recebimento.
create function private.guard_purchase_items()
returns trigger language plpgsql set search_path = '' as $$
begin
  if private.is_api_caller() then
    if tg_op = 'INSERT' and new.received_qty <> 0 then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
    if tg_op = 'UPDATE' and new.received_qty is distinct from old.received_qty then raise exception 'direct_write_blocked' using errcode = '42501'; end if;
  end if;
  return new;
end;
$$;
create trigger purchase_items_guard before insert or update on public.purchase_order_items
  for each row execute function private.guard_purchase_items();

-- Pedido de compra: rascunho, enviado e cancelado são da equipe; recebido e recebido parcial, só do recebimento.
create function private.guard_purchase_orders()
returns trigger language plpgsql set search_path = '' as $$
begin
  if private.is_api_caller() then
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
create function private.guard_production_orders()
returns trigger language plpgsql set search_path = '' as $$
begin
  if private.is_api_caller() then
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
create function private.guard_financial_entries()
returns trigger language plpgsql set search_path = '' as $$
begin
  if private.is_api_caller() then
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

revoke all on function private.is_api_caller(), private.guard_purchase_items(), private.guard_purchase_orders(),
  private.guard_production_orders(), private.guard_financial_entries() from public, anon, authenticated;
