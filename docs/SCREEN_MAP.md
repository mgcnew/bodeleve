# SCREEN_MAP — Bodeleve

Status: mapa aprovado (D10) · 75 telas no total · as 75 telas estão desenhadas (Loja 18, Gestão 36, PDV 12, Entregas 9)

Legenda: `[S]` = bottom sheet · sem marca = tela.

## C — Loja online (18)

1. Início
2. Categoria / catálogo
3. Buscar e resultados
4. Produto
5. Linha Bodeleve (vitrine da marca própria)
6. Sacola
7. Identificação (continuar como convidado · entrar)
8. Endereços
9. Entrega ou retirada
10. Pagamento
11. Revisão do pedido
12. Pedido confirmado
13. Acompanhamento do pedido
14. Meus pedidos
15. Detalhe do pedido e recompra
16. Perfil
17. Sobre a Bodeleve (institucional)
18. Entrar / criar conta

## A — Gestão (36)

| Módulo | Telas | Qtde |
|---|---|---|
| Acesso | Entrar | 1 |
| Dashboard | Início | 1 |
| Mais | Hub de módulos | 1 |
| Compras | Pedidos de compra · Novo pedido · Detalhe do pedido · Recebimento | 4 |
| Fornecedores | Lista · Fornecedor | 2 |
| Produtos | Lista · Produto · Categorias | 3 |
| Estoque | Visão geral · Item (saldos e lotes) · Movimentações · Ajuste / perda · Inventário | 5 |
| Produção | Fichas técnicas · Ficha técnica · Ordens de produção · Ordem (apontamento) | 4 |
| Vendas e pedidos | Lista · Pedido | 2 |
| Financeiro | Visão e fluxo de caixa · Lançamentos · Contas a pagar e a receber · Lançamento (baixa) | 4 |
| Clientes | Lista · Cliente | 2 |
| Entregas | Painel de entregas · Atribuição | 2 |
| Relatórios | Hub · Relatório | 2 |
| Configurações | Hub · Estabelecimento · Usuários e permissões | 3 |

## B — PDV (12)

1. Abertura de caixa
2. Vender (Favoritos · Categorias · Buscar)
3. Quantidade / peso `[S]`
4. Sacola
5. Desconto `[S]`
6. Pagamento
7. Pagamento combinado
8. Venda concluída
9. Vendas (histórico)
10. Detalhe da venda
11. Sangria / suprimento `[S]`
12. Fechamento de caixa

## D — Entregas (9)

1. Entrar
2. Entregas (Disponíveis · Minhas)
3. Detalhe e aceite
4. Coleta
5. Em rota
6. Confirmação de entrega
7. Problema na entrega
8. Histórico
9. Perfil

## Total

| Ambiente | Telas |
|---|---|
| C — Loja | 18 |
| A — Gestão | 36 |
| B — PDV | 12 |
| D — Entregas | 9 |
| **Total** | **75** |

O número pode mudar conforme as respostas às pendências em BUSINESS_RULES.md.

## Arquivos de design por tela

Cada tela está em `design/<arquivo>`. A ordem segue o canvas.

### Etapa 3 · Loja online

| Quadro | Arquivo |
|---|---|
| 1 · Início | `Loja-Inicio.dc.html` |
| 2 · Produto | `Loja-Produto.dc.html` |
| 3 · Sacola | `Loja-Sacola.dc.html` |
| 4 · Pedido confirmado | `Loja-Confirmado.dc.html` |
| Checkout 1 · Identificação | `Loja-Identificacao.dc.html` |
| Checkout 2 · Entrega ou retirada | `Loja-Entrega.dc.html` |
| Checkout 2b · Endereço | `Loja-Endereco.dc.html` |
| Checkout 3 · Pagamento | `Loja-Pagamento.dc.html` |
| Checkout 4 · Revisão | `Loja-Revisao.dc.html` |
| Categoria | `Loja-Categoria.dc.html` |
| Buscar | `Loja-Buscar.dc.html` |
| Linha Bodeleve | `Loja-Linha.dc.html` |
| Sobre a Bodeleve | `Loja-Sobre.dc.html` |
| Pedidos | `Loja-Pedidos.dc.html` |
| Acompanhamento | `Loja-Acompanhamento.dc.html` |
| Detalhe e recompra | `Loja-Pedido.dc.html` |
| Perfil | `Loja-Perfil.dc.html` |
| Entrar | `Loja-Entrar.dc.html` |

### Etapa 4 · Gestão

| Quadro | Arquivo |
|---|---|
| Entrar | `Gestao-Entrar.dc.html` |
| 1 · Início | `Gestao-Inicio.dc.html` |
| 2 · Pedidos | `Gestao-Pedidos.dc.html` |
| 3 · Pedido | `Gestao-Pedido.dc.html` |
| 4 · Mais | `Gestao-Mais.dc.html` |
| 5 · Compras | `Gestao-Compras.dc.html` |
| 6 · Novo pedido de compra | `Gestao-CompraNova.dc.html` |
| 7 · Pedido de compra | `Gestao-Compra.dc.html` |
| 8 · Recebimento | `Gestao-Recebimento.dc.html` |
| 9 · Fornecedores | `Gestao-Fornecedores.dc.html` |
| 10 · Fornecedor | `Gestao-Fornecedor.dc.html` |
| 11 · Estoque | `Gestao-Estoque.dc.html` |
| 12 · Item: saldos e lotes | `Gestao-EstoqueItem.dc.html` |
| 13 · Movimentações | `Gestao-Movimentacoes.dc.html` |
| 14 · Ajuste ou perda | `Gestao-Ajuste.dc.html` |
| 15 · Inventário | `Gestao-Inventario.dc.html` |
| 16 · Produção | `Gestao-Producao.dc.html` |
| 17 · Fichas técnicas | `Gestao-Fichas.dc.html` |
| 18 · Ficha técnica e nova ordem | `Gestao-Ficha.dc.html` |
| 19 · Ordem: apontamento | `Gestao-Ordem.dc.html` |
| 20 · Financeiro | `Gestao-Financeiro.dc.html` |
| 21 · Contas a pagar e a receber | `Gestao-Contas.dc.html` |
| 22 · Pagar conta | `Gestao-Baixa.dc.html` |
| 23 · Lançamentos | `Gestao-Lancamentos.dc.html` |
| 24 · Produtos | `Gestao-Produtos.dc.html` |
| 25 · Produto | `Gestao-Produto.dc.html` |
| 26 · Categorias | `Gestao-Categorias.dc.html` |
| 27 · Clientes | `Gestao-Clientes.dc.html` |
| 28 · Cliente | `Gestao-Cliente.dc.html` |
| 29 · Entregas | `Gestao-Entregas.dc.html` |
| 30 · Atribuir entrega | `Gestao-Atribuir.dc.html` |
| 31 · Relatórios | `Gestao-Relatorios.dc.html` |
| 32 · Relatório de vendas | `Gestao-Relatorio.dc.html` |
| 33 · Configurações | `Gestao-Configuracoes.dc.html` |
| 34 · A casa | `Gestao-Estabelecimento.dc.html` |
| 35 · Equipe e permissões | `Gestao-Usuarios.dc.html` |

### Etapa 5 · PDV

| Quadro | Arquivo |
|---|---|
| 1 · Abrir caixa | `PDV-Abertura.dc.html` |
| 2 · Vender (+ peso) | `PDV-Vender.dc.html` |
| 3 · Sacola (+ desconto) | `PDV-Sacola.dc.html` |
| 4 · Pagamento | `PDV-Pagamento.dc.html` |
| 5 · Pagamento combinado | `PDV-Combinado.dc.html` |
| 6 · Venda concluída | `PDV-Concluida.dc.html` |
| 7 · Vendas de hoje | `PDV-Vendas.dc.html` |
| 8 · Detalhe e cancelamento | `PDV-Venda.dc.html` |
| 9 · Caixa: sangria e fechamento | `PDV-Caixa.dc.html` |

### Etapa 6 · Entregas

| Quadro | Arquivo |
|---|---|
| Entrar | `Ent-Entrar.dc.html` |
| 1 · Entregas | `Ent-Lista.dc.html` |
| 2 · Detalhe e aceite | `Ent-Detalhe.dc.html` |
| 3 · Coleta | `Ent-Coleta.dc.html` |
| 4 · Em rota | `Ent-Rota.dc.html` |
| 5 · Confirmar entrega | `Ent-Confirmacao.dc.html` |
| 6 · Problema na entrega | `Ent-Problema.dc.html` |
| 7 · Histórico | `Ent-Historico.dc.html` |
| 8 · Perfil | `Ent-Perfil.dc.html` |

### PDV: telas do mapa dentro de outros quadros

| Tela do mapa | Onde está |
|---|---|
| Quantidade / peso [S] | `PDV-Vender.dc.html` (folha ao tocar produto por peso) |
| Desconto [S] | `PDV-Sacola.dc.html` (folha "Dar desconto") |
| Sangria / suprimento [S] | `PDV-Caixa.dc.html` (folha) |
| Fechamento de caixa | `PDV-Caixa.dc.html` (bloco "Fechar caixa") |

### Referências de tablet e computador

| Quadro | Arquivo |
|---|---|
| Gestão no computador | `Resp-Gestao-Desktop.dc.html` |
| PDV no tablet do balcão | `Resp-PDV-Tablet.dc.html` |
| Loja no computador | `Resp-Loja-Desktop.dc.html` |

## Loja no código (Etapa 3)

Rotas em `app/src/app/routes.tsx`; telas em `app/src/pages/loja/`; moldura (topo no computador, abas, barra da sacola) em `app/src/ui/loja/LojaLayout.tsx`.

| Quadro | Rota | Código |
|---|---|---|
| Início | `/` | `HomePage.tsx` |
| Buscar | `/buscar` (`?q=`) | `SearchPage.tsx` |
| Categoria | `/categoria/:id` | `CategoryPage.tsx` |
| Produto | `/produto/:id` | `ProductPage.tsx` |
| Linha Bodeleve | `/linha` | `BrandPage.tsx` |
| Sobre a Bodeleve | `/sobre` | `AboutPage.tsx` |
| Sacola | `/sacola` | `BagPage.tsx` |
| Checkout 1 · Identificação | `/finalizar/identificacao` | `IdentificationPage.tsx` |
| Checkout 2 · Entrega ou retirada | `/finalizar/entrega` | `DeliveryPage.tsx` |
| Checkout 2b · Endereço | `/finalizar/endereco` | `AddressPage.tsx` |
| Checkout 3 · Pagamento | `/finalizar/pagamento` | `PaymentPage.tsx` |
| Checkout 4 · Revisão | `/finalizar/revisao` | `ReviewPage.tsx` |
| Pedido confirmado | `/pedido-confirmado/:id` | `ConfirmedPage.tsx` |
| Pedidos | `/pedidos` | `OrdersPage.tsx` |
| Acompanhamento (pedido em andamento) e Detalhe e recompra (pedido concluído) | `/pedidos/:id` | `OrderPage.tsx` |
| Perfil | `/perfil` | `ProfilePage.tsx` |
| Entrar | `/entrar` (`?next=`) | `LoginPage.tsx` |
| Catálogo do design system (interno) | `/design-system` | `gallery/Gallery.tsx` |

## Gestão no código (Etapa 4)

Rotas em `app/src/app/routes.tsx` (`/gestao/...`); telas em `app/src/pages/gestao/`; moldura, menu e acesso por papel em `app/src/ui/gestao/`. Os módulos ainda não implementados abrem uma página "chega nos próximos lotes" com o menu definitivo.

| Quadro | Rota | Código | Lote |
|---|---|---|---|
| Entrar | `/gestao/entrar` | `LoginPage.tsx` | 1 |
| 1 · Início | `/gestao` | `DashboardPage.tsx` | 1 |
| 2 · Pedidos | `/gestao/pedidos` | `OrdersPage.tsx` | 1 |
| 3 · Pedido | `/gestao/pedidos/:id` | `OrderPage.tsx` | 1 |
| 4 · Mais | `/gestao/mais` | `MorePage.tsx` | 1 |
| 5 · Compras | `/gestao/compras` | `purchasing.tsx` | 2 |
| 6 · Novo pedido de compra | `/gestao/compras/novo` (`?fornecedor=`) | `NewPurchasePage.tsx` | 2 |
| 7 · Pedido de compra | `/gestao/compras/:id` | `PurchasePage.tsx` | 2 |
| 8 · Recebimento | `/gestao/compras/:id/receber` | `ReceivingPage.tsx` | 2 |
| 9 · Fornecedores | `/gestao/fornecedores` | `suppliers.tsx` | 2 |
| 10 · Fornecedor | `/gestao/fornecedores/:id` | `suppliers.tsx` | 2 |
| 11 · Estoque | `/gestao/estoque` (`?filtro=baixo\|vencendo`) | `stock.tsx` | 3 |
| 12 · Item: saldos e lotes | `/gestao/estoque/:id` | `stock.tsx` | 3 |
| 13 · Movimentações | `/gestao/estoque/:id/movimentacoes` | `StockMovementsPage.tsx` | 3 |
| 14 · Ajuste ou perda | `/gestao/estoque/:id/ajuste` (ou `/gestao/estoque/ajuste`) | `StockAdjustPage.tsx` | 3 |
| 15 · Inventário | `/gestao/estoque/contagem` | `StockCountPage.tsx` | 3 |
| 16 · Produção | `/gestao/producao` | `production.tsx` | 4 |
| 17 · Fichas técnicas | `/gestao/producao/fichas` | `production.tsx` | 4 |
| 18 · Ficha técnica e nova ordem | `/gestao/producao/fichas/:id` | `RecipePage.tsx` | 4 |
| 19 · Ordem: apontamento | `/gestao/producao/ordens/:id` | `ProductionOrderPage.tsx` | 4 |

