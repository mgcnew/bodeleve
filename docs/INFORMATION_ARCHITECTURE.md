# INFORMATION_ARCHITECTURE — Bodeleve

Status: proposta da Etapa 1 · aguardando aprovação

## Estrutura geral

Quatro ambientes sobre uma base comum (produtos, estoque, pedidos, clientes), todos pertencentes a um **estabelecimento**.

```
Bodeleve
├── A  Gestão administrativa   (dono, gestor, equipe)
├── B  PDV                      (atendente de balcão)
├── C  Loja online              (cliente, com ou sem conta)
└── D  Entregas                 (entregador próprio ou parceiro)
```

A, B e D exigem login. C é pública; conta só é necessária para histórico e recompra.

## Navegação mobile por ambiente

Regra: barra inferior com 3 a 5 destinos de mesmo peso, rótulos curtos, sempre visível — exceto dentro de uma tarefa focada (pagamento, checkout, entrega em rota), quando some.

### C — Loja online · 4 destinos
`Início` · `Buscar` · `Pedidos` · `Perfil`
- **Sacola** não é aba: é uma barra fixa acima da navegação ("Ver sacola · 3 itens · R$ 00,00") que aparece quando há itens.
- Categorias vivem em Início (atalhos) e Buscar (lista completa).
- "Sobre a Bodeleve" e "Linha Bodeleve" entram por Início e por Perfil.
- No checkout a barra inferior some; fica só o botão de avançar.

### A — Gestão · 5 destinos
`Início` · `Pedidos` · `Estoque` · `Financeiro` · `Mais`
- `Mais` é um hub agrupado: **Abastecer** (Compras, Fornecedores, Produção) · **Catálogo** (Produtos e categorias) · **Relacionamento** (Clientes, Entregas) · **Análise** (Relatórios) · **Sistema** (Configurações).
- Em tablet/desktop a barra vira menu lateral com os 12 módulos visíveis.
- Hipótese a validar: se produção for diária, `Produção` troca de lugar com `Financeiro` na barra (ver pendência Q3).

### B — PDV · 3 destinos
`Vender` · `Vendas` · `Caixa`
- Dentro de `Vender`: abas superiores `Favoritos` · `Categorias` · `Buscar`.
- Sacola como barra fixa inferior; pagamento em tela cheia sem navegação.
- Sem caixa aberto, `Vender` leva à abertura de caixa.

### D — Entregas · 3 destinos
`Entregas` · `Histórico` · `Perfil`
- `Entregas` tem dois segmentos: `Disponíveis` e `Minhas`.
- Entrega em andamento ocupa a tela inteira, com uma ação principal por etapa.

## Módulos da Gestão (12)

| # | Módulo | Onde mora (mobile) | Objetos principais |
|---|---|---|---|
| 1 | Dashboard | Início | Indicadores do dia, pendências |
| 2 | Compras | Mais › Abastecer | Pedido de compra, recebimento |
| 3 | Fornecedores | Mais › Abastecer | Fornecedor |
| 4 | Produtos e categorias | Mais › Catálogo | Produto, categoria, origem |
| 5 | Estoque | Barra | Saldos, lotes, validades, movimentações, inventário |
| 6 | Produção | Mais › Abastecer | Ficha técnica, ordem de produção |
| 7 | Vendas e pedidos | Barra (Pedidos) | Pedido online, venda de balcão |
| 8 | Financeiro | Barra | Lançamentos, contas, fluxo de caixa |
| 9 | Clientes | Mais › Relacionamento | Cliente, histórico |
| 10 | Entregas | Mais › Relacionamento | Entrega, entregador |
| 11 | Relatórios | Mais › Análise | Relatórios |
| 12 | Configurações | Mais › Sistema | Estabelecimento, usuários, permissões |

## Taxonomia de produto

Duas dimensões independentes — não misturar em um campo só:

- **Tipo de item**: `revenda` · `matéria-prima` · `produto acabado`
- **Origem / marca** (só para itens vendáveis): `terceiros` · `feito na casa` · `marca Bodeleve` (produzido internamente ou por terceiro)

Na loja, a origem aparece como selo no cartão e na página do produto, e como filtro no catálogo.

## Padrões de interface transversais

- **Bottom sheet**: escolhas curtas ligadas à tela atual (quantidade/peso, desconto, filtro, troca de endereço). Nunca para confirmação crítica nem fluxo de vários passos.
- **Tela cheia**: pagamento, recebimento de compra, apontamento de produção, confirmação de entrega.
- **Estados**: toda lista tem vazio, carregando e erro definidos no design system.
