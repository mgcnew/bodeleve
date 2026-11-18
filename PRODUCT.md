# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Dono(a) e gestor(a) da casa (gestão): precisam saber o que pede ação hoje (pedidos, estoque que vence, contas a pagar e receber). Usam no celular durante o dia e no computador para compras, financeiro e relatórios.
- Atendente de balcão (PDV): vende rápido, inclusive por peso, e fecha o caixa. Trabalha o dia todo no mesmo aparelho, em tablet ou computador, às vezes com internet ruim.
- Cliente (loja online): acha o produto, confia na origem, paga e recebe ou retira. Compra como convidado, sem conta, quase sempre pelo celular.
- Entregador próprio ou parceiro (app de entregas): sabe o que coletar, para onde ir e comprova a entrega com uma mão, na rua, no celular.

## Product Purpose

Plataforma da Bodeleve, uma Casa do Norte que vende alimentos e produtos regionais. Reúne em um lugar a compra, a produção, o estoque, a venda no balcão e pela internet, a entrega e o financeiro, e serve de vitrine da marca para quem compra. Sucesso: venda de 3 itens no PDV em menos de 30 s; pedido online como convidado; gestor vê o que pede ação sem rolar; entregador confirma a entrega com uma mão.

## Positioning

Três origens de produto tratadas como cidadãs de primeira classe (revenda, feito na casa, marca Bodeleve), produção ligada ao estoque e um estoque só para balcão e internet. Um ERP genérico não mostra a origem do produto até a vitrine.

## Operating Context

Quatro ambientes por rota no mesmo app React: Loja em `/`, Gestão em `/gestao`, PDV em `/pdv`, Entregas em `/entregas`. 75 telas já implementadas, ligadas ao Supabase na gestão, no PDV (com fila de vendas sem internet) e na loja. Mobile-first (360–430 px); tablet e computador seguem `docs/DESIGN_SYSTEM.md`, seção Responsivo.

## Capabilities and Constraints

- Tokens em `design/tokens.css`, importados por `app/src/styles/global.css`; componentes em `app/src/components/` com CSS Modules.
- Regras de acessibilidade em `docs/AUDIT.md`: contraste AA, rótulos, nomes em botões de ícone, alvo mínimo 44 px, cor nunca como único sinal.
- Textos entre [colchetes] são conteúdo que o dono ainda vai fornecer.
- Não há logotipo oficial; a marca aparece só como a palavra "Bodeleve". Foto de produto fica como marcador até haver material próprio.
- Decisões aprovadas só mudam com registro em `docs/DECISIONS.md`.

## Brand Commitments

Nome "Bodeleve" e a ideia de Casa do Norte. As cores e fontes atuais (terracota, verde, mostarda, creme; Bricolage Grotesque e Inter) não são compromisso: o dono pediu paleta nova (2026-11-18).

## Evidence on Hand

Dados de produtos, pedidos e clientes são fictícios (seed de desenvolvimento). Não há fotografia própria, depoimentos nem logotipo.

## Product Principles

- Mobile-first: tarefa frequente em poucos toques; tarefa rara pode morar em "Mais".
- Mostrar o que pede ação hoje antes de gráfico.
- Mesma identidade, experiências diferentes: a loja é calorosa; a operação é sóbria e legível.
- Nada fictício apresentado como real; nada decorativo sem comportamento.

## Accessibility & Inclusion

Contraste AA, alvo de toque mínimo de 44 px, cor nunca como único sinal. Funcionar em celulares simples e conexão ruim; movimento leve e respeitando `prefers-reduced-motion`.
