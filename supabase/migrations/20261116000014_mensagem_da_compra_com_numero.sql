-- A mensagem ao fornecedor é montada pelo app com {number}; o banco troca pelo número do pedido recém-criado.
create or replace function public.create_purchase_order(p_establishment uuid, p_supplier uuid, p_expected timestamptz, p_payment text, p_items jsonb, p_message text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare sup public.suppliers; v_id uuid; v_number text; ln record; pr public.products; v_n int := 0;
begin
  if not private.can(p_establishment, 'purchasing') then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into sup from public.suppliers where id = p_supplier and establishment_id = p_establishment;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  if coalesce(jsonb_typeof(p_items), '') <> 'array' then raise exception 'empty_order' using errcode = 'P0001'; end if;
  if p_payment is null or p_payment not in ('boleto14', 'pix_on_delivery', 'cash_on_delivery') then raise exception 'invalid_payment' using errcode = 'P0001'; end if;

  v_number := 'PC-' || lpad(private.next_number(p_establishment, 'purchase')::text, 4, '0');
  insert into public.purchase_orders (establishment_id, number, supplier_id, status, payment_term, expected_at, sent_at, message_text, created_by)
  values (p_establishment, v_number, p_supplier, 'sent', p_payment, p_expected, now(), replace(p_message, '{number}', v_number), (select auth.uid()))
  returning id into v_id;

  for ln in select (x ->> 'product_id')::uuid as product_id, (x ->> 'qty')::numeric as qty from jsonb_array_elements(p_items) x loop
    if ln.qty is null or ln.qty <= 0 then continue; end if;
    select * into pr from public.products where id = ln.product_id and establishment_id = p_establishment;
    if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
    -- o custo vem do cadastro (último custo), nunca do aparelho
    insert into public.purchase_order_items (purchase_order_id, product_id, qty, unit_cost_cents) values (v_id, pr.id, ln.qty, coalesce(pr.last_cost_cents, 0));
    v_n := v_n + 1;
  end loop;
  if v_n = 0 then raise exception 'empty_order' using errcode = 'P0001'; end if;

  -- D21: a mensagem ao fornecedor é montada e guardada; nada é enviado
  if p_message is not null then
    insert into public.outbox_messages (establishment_id, kind, recipient, body) values (p_establishment, 'purchase_order', coalesce(sup.phone, ''), replace(p_message, '{number}', v_number));
  end if;
  return jsonb_build_object('id', v_id, 'number', v_number);
end;
$$;

