# IMPLEMENTATION — estado da implementação

Os quatro ambientes estão implementados em `app/` (React + Vite + TypeScript), com **dados de exemplo guardados no aparelho**. Nada fala com o banco ainda. Este documento diz o que existe, o que é simulado e o que falta para ligar o Supabase.

## Telas

| Ambiente | Rota | Telas | Situação |
|---|---|---|---|
| Loja online | `/` | 18 | Completa, com checkout sem conta |
| Gestão | `/gestao` | 36 | Completa |
| PDV | `/pdv` | 12 (em 9 quadros) | Completo |
| Entregas | `/entregas` | 9 | Completo |

## Como entrar para testar

- **Gestão e PDV com o Supabase ligado**: `/gestao/entrar` com o usuário de teste de desenvolvimento (papel gestor), cujo e-mail e senha ficam só no seu `app/.env.local` (`VITE_DEV_STAFF_EMAIL` e `VITE_DEV_STAFF_PASSWORD`) e preenchem o formulário no modo dev. Sem o Supabase, qualquer e-mail com `@` e senha de 4+ caracteres entra como dono.
- **Entregas**: `/entregas/entrar` com um celular cadastrado — Bruno `(00) 90000-0300` (da casa), Carlos `(00) 90000-0310` (da casa), Diego `(00) 90000-0301` (parceiro) — e qualquer código de 4 números.
- **Cancelar venda no PDV**: qualquer senha numérica de 4 ou mais dígitos.

Para voltar aos dados de exemplo, apague as chaves `bodeleve.*` do `localStorage` do navegador.

## Como os dados estão organizados

`app/src/lib/store.ts` cria um estado compartilhado e persistido no aparelho. Cada `*Store` faz o papel de uma ou mais tabelas de `DATA_MODEL_DRAFT.md`:

| Store | Arquivo | Vira no Supabase |
|---|---|---|
| `itemsStore` | `services/gestao/backoffice.ts` | `products` (item de estoque e produto de venda ainda são o mesmo registro) |
| `stockStore` (lotes e movimentações) | idem | `product_lots`, `stock_movements`. O saldo **não é coluna**: deriva dos movimentos (`services/gestao/stock.ts`) |
| `suppliersStore`, `purchasesStore` | idem | `suppliers`, `purchase_orders` (+ itens e recebimentos) |
| `recipesStore`, `productionStore` | idem | `recipes`, `production_orders` (+ consumos) |
| `accountsStore`, `ledgerStore`, `entriesStore` | idem | `financial_accounts`, lançamentos, `financial_entries` |
| `staffOrdersStore` | `services/gestao/orders.ts` | `orders` + `order_items` (a loja, o balcão e a gestão leem o **mesmo** pedido) |
| `categoriesStore`, `customersStore`, `couriersStore`, `teamStore`, `establishmentStore` | `services/gestao/people.ts` | `categories`, `customers`, `couriers`, `memberships`, `establishments` |
| `salesStore`, `cashStore`, `cartStore` | `services/pdv.ts` | `orders` (channel pos), `payments`, `cash_sessions`, `cash_movements` |
| `courierSessionStore`, `deliveryLogStore` | `services/entregas.ts` | `deliveries` e sessão do entregador |
| pedidos e sacola da loja | `services/orders.ts`, `ui/loja/state/*` | `orders` (guest) e carrinho no aparelho |

As telas só falam com `services/` e `domain/`; para ligar o banco troca-se a implementação dos serviços, sem mexer nas telas.

## O que já se encadeia (testado)

Pedido feito na loja → aparece em Novos na gestão → aceite, conferência item a item e "pronto" → atribuição a entregador → app do entregador (aceite, coleta, rota, código de 4 números) → "entregue" → a tela de acompanhamento da loja acompanha cada passo. Venda no PDV baixa o estoque pelo lote que vence primeiro e lança o dinheiro; cancelar desfaz. Recebimento de compra entra no estoque e cria a conta a pagar. Produção consome insumos e cria o lote. Preço e publicação definidos no cadastro valem na loja.

## Simulado ou dependente de decisão

| O quê | Situação | Depende de |
|---|---|---|
| Login da equipe, do entregador e do cliente (código por WhatsApp) | Simulado; aceita qualquer senha ou código válido no formato | Supabase Auth, P8 (provedor de mensagens) |
| Senha do gestor ao cancelar venda | Só exige 4+ dígitos | Conferência no servidor |
| Pix: QR e confirmação | Espaço reservado; confirmação manual | P8 (provedor de pagamento), Q8 |
| Taxa e área de entrega | Taxa fixa R$ 8,00; todo CEP completo é aceito | Q6, Q7 |
| Relatório de vendas e "resultado do mês" | Números de exemplo | Vendas gravadas no banco |
| Anexos (comprovante de pagamento, foto de problema na entrega) | Campo desativado | Supabase Storage |
| Fotos de produto e da casa, logotipo, textos da casa | Marcadores entre colchetes | P3, P4, P5 |
| Convite de equipe por e-mail | Registra o convite; não envia | Supabase Auth |
| Mapa e rastreio | Só "Abrir no mapa" do celular (H-E4) | — |
| PDV em conexão ruim | Funciona local; fila de envio ainda não existe | Banco ligado |
| Realtime (pedido novo, status, entregas livres) | A tela atualiza ao recarregar ou navegar | Supabase Realtime |

## Backend (Supabase)

O app usa o projeto Supabase **já existente** (`afqcwqikkolyoowkozak`), que tem esquema, RLS e funções prontos. A configuração fica em `app/.env.local` (não vai ao Git; modelo em `app/.env.example`). Sem ela, o app roda só com dados de exemplo.

| Área | Situação |
|---|---|
| Loja: catálogo, categorias, dados da casa (taxa, janelas) | **Ligado** (`store_catalog`, `store_categories`, `store_info`) |
| Loja: fazer pedido e acompanhar | **Ligado e testado**: um pedido de teste (nº 1001, "TESTE Integração") foi criado e aparece no acompanhamento |
| Gestão: login da equipe | **Ligado** (Supabase Auth + papel em `memberships`) |
| Gestão: pedidos (fila, aceitar, conferir, pronto, desfazer, retirada) | **Ligado e testado** (`order_accept`, `order_mark_ready`, `order_undo_ready`, `order_complete_pickup`), com Realtime e atualização a cada 15 s |
| Gestão: estoque (saldos, lotes, movimentos, ajuste/perda, contagem e desfazer) | **Ligado e testado** (`stock_adjust`, `stock_count_apply`, `stock_count_undo`, `stock_reverse`; saldo reservado pelos pedidos reais) |
| Gestão: compras e fornecedores (criar pedido, receber, encerrar, desfazer) | **Ligado** (`create_purchase_order`, `receive_purchase`, `close_purchase_short`, `undo_receipt`); falta testar com dados, porque o banco ainda não tem fornecedores (ver `supabase/seed_dev_estoque.sql`, não aplicado) |
| Gestão: entregas (atribuir), produção, financeiro, produtos (edição), clientes | Ainda nos dados de exemplo. Produção começa vazia com o banco ligado |
| PDV e Entregas (app do entregador) | Ainda nos dados de exemplo (`pos_*`, `courier_*` existem no banco) |

O catálogo fictício de `supabase/seed_dev.sql` já está aplicado no banco de desenvolvimento.

## Próximos passos

1. Ligar o login da equipe (Supabase Auth) e trocar cada `*Store` da gestão, do PDV e das entregas pelas funções do banco, uma área por vez.
2. Ligar Realtime em pedidos, status do pedido e entregas livres.
3. Resolver P2 e P8 de `DECISIONS.md` antes de pagamentos reais, nota fiscal e área de entrega.
