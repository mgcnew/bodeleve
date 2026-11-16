-- O cartão de entrega do app do entregador passa a levar o endereço desde antes de aceitar (para decidir se pega) e a hora em que o pedido ficou pronto.
-- Nome e celular de quem comprou continuam só para quem pegou a entrega; o código de confirmação nunca vai.
create or replace function private.courier_card(p_order public.orders, p_delivery public.deliveries, p_full boolean)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'order_id', p_order.id, 'number', p_order.number,
    'state', coalesce(p_delivery.status::text, 'free'),
    'district', coalesce(p_order.address ->> 'district', ''),
    'street', coalesce(nullif(btrim(coalesce(p_order.address ->> 'street', '') || ' ' || coalesce(p_order.address ->> 'number', '')), ''), ''),
    'address', jsonb_build_object('street', coalesce(p_order.address ->> 'street', ''), 'number', coalesce(p_order.address ->> 'number', ''),
                                  'complement', coalesce(p_order.address ->> 'complement', ''), 'district', coalesce(p_order.address ->> 'district', ''),
                                  'reference', coalesce(p_order.address ->> 'reference', '')),
    'items', coalesce((select sum(qty)::int from public.order_items where order_id = p_order.id), 0),
    'total_cents', p_order.total_cents, 'payment_method', p_order.payment_method, 'payment_paid', p_order.payment_paid,
    'change_for_cents', p_order.change_for_cents, 'ready_at', p_order.step_times ->> 'ready_for_delivery',
    'fee_cents', p_delivery.fee_cents, 'at', p_delivery.at, 'expected_at', p_delivery.expected_at, 'return_at', p_delivery.return_at,
    'problem_reason', p_delivery.problem_reason)
  || case when p_full then jsonb_build_object('customer', p_order.contact_name, 'phone', p_order.contact_phone) else '{}'::jsonb end;
$$;
revoke all on function private.courier_card(public.orders, public.deliveries, boolean) from public, anon, authenticated;
