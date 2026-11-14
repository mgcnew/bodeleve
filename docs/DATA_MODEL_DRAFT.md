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
