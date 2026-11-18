-- Pedido da loja por WhatsApp (D19): a pessoa só retira na loja e paga lá, então o pedido
-- nasce com a forma de pagamento "on_pickup" (pagar na retirada). Aditivo: nada existente muda.
-- 1) novo valor do tipo
alter type public.payment_method add value if not exists 'on_pickup';

-- 2) place_order passa a aceitar o novo valor (troca só a lista de valores aceitos)
do $mig$
declare d text;
begin
  select pg_get_functiondef(p.oid) into d
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'place_order';
  d := replace(d, $q$v_method not in ('pix', 'card_on_delivery', 'cash')$q$, $q$v_method not in ('pix', 'card_on_delivery', 'cash', 'on_pickup')$q$);
  if d not like '%''on_pickup''%' then raise exception 'place_order: trecho não encontrado'; end if;
  execute d;
end
$mig$;
