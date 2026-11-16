# ROADMAP — Bodeleve

Cada etapa termina com revisão e aprovação antes da seguinte. A documentação é atualizada ao fim de cada uma.

| Etapa | Entrega | Depende de | Situação |
|---|---|---|---|
| 1 — Discovery e referências | Visão, pesquisa, arquitetura, mapa de telas, navegação, fluxos, direção visual, pendências | — | Aprovada em 2026-11-14 |
| 2 — Design system | Tokens finais, tipografia, componentes e estados, padrões de navegação dos 4 ambientes | Aprovação de P-A a P-D | Aprovada em 2026-11-14 |
| 3 — Loja online | Início, catálogo, produto, sacola, checkout, confirmação, acompanhamento, institucional — protótipo navegável do Fluxo 4 | Etapa 2 · Q6–Q10 | Entregue (18 de 18 telas) |
| 4 — Gestão | Dashboard, compras, estoque, produção, financeiro — Fluxos 1, 2 e 6 | Etapa 2 · Q1, Q3 | Entregue (36 de 36 telas) |
| 5 — PDV | Venda, peso, pagamento combinado, caixa — Fluxo 3 | Etapa 2 · Q2, Q5 | Entregue (12 telas em 9 quadros) |
| 6 — Entregas | App do entregador e painel de atribuição — Fluxo 5 | Etapas 3 e 4 · Q11 | Entregue (9 telas) |
| 7 — Auditoria | Consistência, acessibilidade, responsividade, cobertura dos fluxos | Etapas 2–6 | Entregue (AUDIT.md) |

## Etapa 4 em detalhe (em andamento)

Lote 1 (entregue): Entrar · Início · Pedidos · Pedido · Mais.
Lote 2 (entregue): Compras · Novo pedido de compra · Pedido de compra · Recebimento · Fornecedores · Fornecedor — Fluxo 1.
Lote 3 (entregue): Estoque · Item (saldos e lotes) · Movimentações · Ajuste ou perda · Inventário.
Lote 4 (entregue): Produção · Fichas técnicas · Ficha técnica e nova ordem · Ordem (apontamento) — Fluxo 2.
Lote 5 (entregue): Financeiro · Contas a pagar e a receber · Pagar conta · Lançamentos — Fluxo 6.
Lote 6 (entregue): Produtos · Produto · Categorias · Clientes · Cliente · Entregas · Atribuir entrega · Relatórios · Relatório de vendas · Configurações · A casa · Equipe e permissões.

Gestão administrativa, em lotes: (1) Início e Mais; (2) Compras e recebimento — Fluxo 1; (3) Estoque; (4) Produção — Fluxo 2; (5) Financeiro — Fluxo 6; (6) Pedidos, Clientes, Entregas, Relatórios, Configurações.
Ajudam antes: Q1 (tamanho do catálogo), Q3 (produção antecipada ou sob demanda), Q4 (quem usa e em que aparelho).

## Etapa 3 em detalhe (entregue)

Lote 1 (entregue): Início · Produto · Sacola · Pedido confirmado.
Lote 2 (entregue): Identificação · Entrega ou retirada · Endereços · Pagamento · Revisão.
Lote 3 (entregue): Categoria · Buscar · Acompanhamento · Meus pedidos · Detalhe e recompra · Perfil · Entrar · Linha Bodeleve · Sobre a Bodeleve.

Plano original:

1. Início, categoria, busca e produto.
2. Sacola e checkout como convidado (identificação, entrega ou retirada, endereço, pagamento, revisão).
3. Pedido confirmado e acompanhamento.
4. Linha Bodeleve e Sobre a Bodeleve.
5. Protótipo navegável do Fluxo 4 com dados fictícios.

Antes de começar ajudam as respostas a Q6–Q10 (área e taxa de entrega, pedido mínimo, pagamento, falta de item, envio para fora). Sem elas, as telas saem com hipóteses marcadas.

## Etapa 2 — o que foi feito

1. Fechar tokens de cor, tipo, espaço e raio.
2. Componentes base: botão, campo, etiqueta, selo de origem, cartão.
3. Componentes de domínio: cartão de produto, linha de PDV, linha de estoque, lançamento financeiro, linha do tempo de pedido.
4. Navegação: barra inferior dos 4 ambientes, abas, sheet, modal.
5. Estados: vazio, carregando, erro.
6. Um quadro por grupo no canvas; revisão; aprovação.

## Depois do design (fora desta fase)

Implementação com Supabase (Auth, PostgreSQL com RLS, Storage, Realtime onde fizer sentido), partindo de DATA_MODEL_DRAFT.md.

## Implementação (em andamento)

Plano e stack em `IMPLEMENTATION_PLAN.md` (aprovado em D18). O banco de dados está congelado até o dono conectar o Supabase (D19).

| Fase | O quê | Situação |
|---|---|---|
| I-1 | Supabase: projeto, Auth, tabelas, RLS | Banco pronto e testado (migrations 1–9, D33). Ligação do app, por fatias, com `VITE_DATA_SOURCE=supabase`: **feitas** loja pública (catálogo, pedido sem conta, acompanhamento, A casa), entrada da equipe e, na Gestão, pedidos, produtos (com cadastro de produto novo) e categorias, clientes, A casa e equipe; **faltam** estoque, compras, produção, financeiro, início, entregas, relatórios, PDV, app de Entregas e Realtime |
| I-2 | Design system em componentes | Entregue em `app/`; aguarda a passada visual do dono (P12, P13) |
| I-3 | Loja online | Entregue em `app/` (18 telas, serviços simulados); aguarda a passada visual (P18) e as pendências P14–P17 |
| I-4 | Gestão | Em andamento: lotes 1 (Entrar, Início, Pedidos, Pedido, Mais), 2 (Compras e Fornecedores), 3 (Estoque), 4 (Produção), 5 (Financeiro) e 6 (Produtos, Clientes, Entregas, Relatórios, Configurações, Equipe) entregues: a Gestão está completa. Próximas: PDV (Etapa 5) e app de entregas (Etapa 6) |
| I-5 | PDV | Entregue (9 quadros): abertura, venda com peso, sacola e desconto, pagamento e combinado, vendas, cancelamento e caixa. Pix, cartão e comprovante simulados (D21) |
| I-6 | Entregas | Entregue (9 quadros): entrar, lista, aceite, coleta, em rota, confirmação por código, problema, histórico e perfil, ligados ao painel da gestão. Mensagens, mapa e pagamento do parceiro seguem fora (D21) |
| I-7 | Realtime e acabamento | Entregue na simulação: atualização ao vivo entre abas, PDV em tablet, código por ambiente. O Realtime real, as políticas RLS e a revisão de desempenho dependem do Supabase (D19) |

## Próxima fase: implementação (histórico)

O design está completo. O pacote de passagem para o Claude Code está no repositório: `CLAUDE.md` (regras e ordem de implementação), `design/tokens.css`, `docs/SCREEN_MAP.md` (tela → arquivo) e `docs/AUDIT.md`. Antes de pagamentos reais, área de entrega e nota fiscal, resolver as pendências P2 e P8 de DECISIONS.md.
