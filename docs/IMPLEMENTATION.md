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

- **Gestão e PDV**: `/gestao/entrar` com qualquer e-mail com `@` e senha de 4 ou mais caracteres. Entra como dono.
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

## Próximos passos

1. Criar o projeto Supabase e aplicar `supabase/migrations/`. A primeira migração cobre base, catálogo e RLS; faltam compras, estoque, produção, vendas, entregas e financeiro.
2. Trocar cada `*Store` por consultas aos serviços de `services/`, uma área por vez, começando por login e catálogo.
3. Ligar Realtime em pedidos, status do pedido e entregas livres.
4. Resolver P2 e P8 de `DECISIONS.md` antes de pagamentos reais, nota fiscal e área de entrega.
