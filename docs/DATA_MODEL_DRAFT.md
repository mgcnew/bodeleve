# DATA_MODEL_DRAFT — Bodeleve

Status: rascunho conceitual da Etapa 1 para orientar o design. **Nada foi criado no Supabase.** Nomes em inglês por convenção de banco; tudo é hipótese até a fase de implementação.

## Princípios

- Toda tabela de negócio carrega `establishment_id`; Row Level Security filtra por vínculo do usuário com o estabelecimento.
- Saldo de estoque não é coluna editável: deriva de movimentações.
- Valores monetários em centavos (inteiro); quantidades em decimal com unidade.

## Entidades

**Base**
- `establishments` — a casa.
- `profiles` — pessoa autenticada (Supabase Auth).
- `memberships` — profile × establishment × `role` (owner, manager, clerk, production, courier).

**Catálogo**
- `categories`
- `products` — `item_type` (resale | raw_material | finished) · `origin` (third_party | house_made | bodeleve_brand) · `unit` (un, kg, g, l…) · `sold_by_weight` · `price` · `is_published` (loja) · `is_favorite_pos` · `min_stock`
- `product_images` — Supabase Storage.

**Compras**
- `suppliers`
- `purchase_orders` (+ `purchase_order_items`) — status: draft, sent, partially_received, received, cancelled
- `goods_receipts` (+ `goods_receipt_items`: qty, cost, lot, expiry)

**Estoque**
- `product_lots` — lote, validade, custo unitário
- `stock_movements` — `type` (purchase_in, production_in, production_out, sale_out, adjustment, loss, inventory) · qty · lot · origem (documento)
- `stock_reservations` — por pedido online / ordem de produção
- `inventory_counts` (+ `inventory_count_items`: contado × sistema)

Saldos (views): `physical` = Σ movimentos · `reserved` = Σ reservas ativas · `available` = physical − reserved · `projected` = available + a receber + em produção.

**Produção**
- `recipes` (ficha técnica: produto acabado, rendimento esperado) + `recipe_items` (insumo, qty)
- `production_orders` — status: planned, in_progress, done, cancelled · qty planejada · rendimento real
- `production_consumptions` — consumo real por insumo/lote

**Vendas**
- `customers` (+ `customer_addresses`)
- `orders` — `channel` (pos | online) · `fulfillment` (counter | pickup | delivery) · status · totais · desconto · `guest_contact`
- `order_items`
- `payments` — method (cash, pix, debit, credit…) · amount · um pedido pode ter vários (pagamento combinado)
- `cash_sessions` — abertura, fechamento, esperado, contado
- `cash_movements` — sangria, suprimento

**Entregas**
- `couriers` — `kind` (own | partner)
- `deliveries` — order · courier · status (ready, assigned, picked_up, en_route, delivered, failed, returned) · `delivery_code` · taxa

**Financeiro**
- `financial_accounts` — caixa, banco
- `financial_categories`
- `financial_entries` — `direction` (payable | receivable) · due_date · paid_at · amount · paid_amount · origem (compra, venda, manual)

## Onde o Realtime provavelmente importa

Pedidos novos na Gestão · status do pedido para o cliente · entregas disponíveis para o entregador · saldo de estoque no PDV.

## Camadas previstas no código (para a fase de implementação)

`ui/` (telas) · `components/` · `mocks/` (dados simulados) · `services/` (interfaces que hoje leem mocks e depois Supabase) · `domain/` (regras: saldos, custos, totais) · `permissions/`.

## Ajustes ao modelo (descobertos na implementação simulada, Etapas 3 a 7)

Para a Etapa 1 (Supabase), além do que está acima:

**Catálogo e venda**
- `products` (ou `product_sales`, 1–1 com o item de estoque): `price` da embalagem, `weight_price` (preço do kg no balcão, H-I80), `is_published`, `is_favorite_pos`, `sold_by_weight`, `description`. O cadastro do item (nome, medida, tipo, origem, categoria, mínimo, validade) é o do estoque (H-I58).
- `categories`: `is_internal` (insumos não são categoria da loja).
- `customers`: `notes` (observação interna), `since`; a chave real é o celular. O histórico anterior ao sistema é importação, não coluna.

**Vendas do balcão**
- `cash_sessions`: abertura (troco contado), quem abriu e fechou, esperado, contado, diferença, status, e o lançamento da diferença no financeiro (reabrir desfaz).
- `cash_movements`: sangria e suprimento com motivo; "levar ao banco" gera transferência entre contas.
- `pos_sales` + `pos_sale_items`: preço no momento, quantidade ou peso (kg, 3 casas), lotes de onde saiu (`pos_sale_item_lots`), desconto (tipo, valor, motivo), cancelamento (quem aprovou), `pending_sync` para venda feita sem conexão. A numeração `V-0001` é por estabelecimento e deve ser gerada no servidor (RPC).
- `payments`: um pedido pode ter vários; dinheiro guarda `received_cents` (troco). A baixa de estoque, os lançamentos do financeiro e o número da venda devem ser **uma RPC atômica** (H-G11).

**Entregas**
- `couriers`: `kind`, `phone`, `vehicle`, `available`, `pix_key`, vínculo com `profiles` para login por celular.
- `deliveries`: **várias por pedido** (a devolvida fica no histórico e o pedido pode ser atribuído de novo); status `published`, `reserved`, `assigned`, `accepted`, `en_route`, `delivered`, `returned`; `fee_cents`, `problem_reason`, `problem_note`, horários e previsão. O código de entrega do pedido **nunca** vai para o app do entregador: a conferência é uma RPC.
- Pagamento na entrega: ao entregar, o pedido passa a pago; falta o registro do repasse do dinheiro à loja (P58).

**Financeiro**
- `cash_transactions`: `account` (banco ou caixa), `kind` (opening, sale, payment, settlement, transfer, manual), `principal_cents` (parte que quitou a conta; o resto é multa e juros), `transfer_id` (as duas pontas), `reversal_of` (histórico nunca é apagado).
- `financial_entries`: `recurring` (despesa fixa gera a do mês seguinte), `paid_cents` (pagamento parcial), `origin` e `ref`; a conta de compra nasce no recebimento (H-I49).

**Configuração**
- `establishment_settings`: nome, CNPJ, endereço, WhatsApp e três horários; o que estiver vazio aparece como marcador na loja.
- `memberships`: convite pendente (`status`), sem e-mail enviado até D21 liberar.

**Realtime (H-I101)**: pedidos (gestão e quem comprou), entregas (painel, entregadores e parceiros), estoque e caixa. As telas já assinam por assunto; basta trocar a implementação em `mocks/realtime.ts`.

**O que não deve ir para o banco**: as senhas e códigos de teste (`MOCK_*`), o histórico de vendas de exemplo (`salesHistory`), a base do caixa de exemplo e os pedidos de exemplo.
