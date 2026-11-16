# AUDIT — Bodeleve (Etapa 7)

Data: 2026-11-15 · escopo: as 75 telas do mapa (80 quadros de tela no canvas), o design system e as 3 referências de tablet e computador.

A auditoria foi feita por scripts sobre os arquivos de `design/` e por conferência dos números entre telas. **Não foi feita revisão visual das telas renderizadas**: alturas de quadro, quebras de linha e sobreposições precisam de uma passada a olho no canvas (pendência A1).

## 1. Cobertura

| Ambiente | Telas no mapa | Quadros | Situação |
|---|---|---|---|
| C — Loja online | 18 | 18 | Completo · Fluxo 4 navegável de ponta a ponta |
| A — Gestão | 36 | 36 | Completo · Fluxos 1, 2 e 6 navegáveis |
| B — PDV | 12 | 9 | Completo · peso, desconto e sangria são folhas dentro de Vender, Sacola e Caixa · Fluxo 3 navegável |
| D — Entregas | 9 | 9 | Completo · Fluxo 5 navegável; próprio × parceiro pelo ajuste "perfil" |
| Referências responsivas | — | 3 | Gestão no computador, PDV no tablet, loja no computador |

Os seis fluxos do briefing têm protótipo navegável: Compras (F1), Produção (F2), PDV (F3), E-commerce (F4), Entregas (F5) e Financeiro (F6).

## 2. Checagens automáticas

| Checagem | Resultado |
|---|---|
| Marcação bem formada (tags fechadas, sem `id` repetido) | 83 de 83 quadros ok |
| Links entre telas apontam para quadros existentes | ok |
| Nenhum botão ou campo dentro de link | ok |
| Toda variável usada na tela tem valor na lógica | ok |
| Todos os botões e filtros executam sem erro (simulação) | ok |
| Cores fora dos tokens | nenhuma |
| Campos sem rótulo (`label for` ou `aria-label`) | nenhum |
| Botões sem nome acessível | nenhum |
| Texto menor que 12 px | **corrigido** (3 casos de 10–11 px → 12 px) |
| Alvos de toque menores que 44 px | **corrigido** (chips e controles segmentados de 40 → 44 px; botões de quantidade de 40 → 44 px; liga/desliga com área de 60 × 44 px em volta do trilho de 52 × 32) |

## 3. Contraste (WCAG 2.1, razão calculada)

Todos os pares de texto e fundo usados passam AA (≥ 4,5 : 1):

| Par | Razão |
|---|---|
| Grafite sobre creme | 13,51 |
| Secundário sobre creme / branco / fundo da operação | 6,31 / 7,04 / 6,74 |
| Terracota sobre creme / branco | 5,16 / 5,75 |
| Branco sobre terracota / verde / erro | 5,75 / 7,64 / 9,11 |
| Terracota escuro sobre terracota suave | 6,18 |
| Atenção, sucesso, erro, informação sobre o próprio fundo | 5,37 / 6,37 / 7,21 / 5,66 |
| Grafite sobre mostarda | 6,70 |

Regra mantida: mostarda nunca é texto (2,02 : 1 sobre creme).

## 4. Consistência entre telas

Números conferidos entre ambientes: vendas do dia (início, relatório, caixa do PDV), contas a pagar (início, financeiro, contas), saldos e lotes do Queijo coalho (estoque, item, movimentações, produção, inventário), compra PC-0057 (compras, recebimento, conta criada), pedido #1041 (gestão, atribuição, app de entregas) e caixa do dia (financeiro, PDV).

Correções feitas durante o projeto: o pedido à Laticínios Serra Verde passou de queijo (que é feito na casa) para matérias-primas; data da compra PC-0053 ajustada para a conta vencer hoje; total da venda V-0212 alinhado entre lista e detalhe.

## 5. Limites conhecidos do protótipo

- Cada quadro guarda o próprio estado: a sacola, o pedido e o estoque não "andam" entre telas. No app implementado o estado é compartilhado (banco simulado único).
- Nas listas, só o primeiro item de exemplo abre detalhe.
- Fotos, logotipo, mapa e QR do Pix são marcadores.
- Nenhum dado, pagamento, estoque ou envio é real.

## 6. O código implementado (Etapas 3 a 7, 2026-11-16)

Conferido em `app/`, com os dados simulados:

| Checagem | Resultado |
|---|---|
| Acessibilidade (axe, WCAG 2.1 A e AA) em teste automatizado, em cada tela e em cada estado principal | Sem violações. No teste (jsdom) a regra de contraste fica desligada, porque o jsdom não calcula cor |
| Acessibilidade (axe) **em navegador real, com contraste**, em 37 telas de loja, gestão, PDV (celular e tablet), entregas e gestão no computador | Sem violações |
| Alvo mínimo de 44 px, medido nos elementos de toque de 29 telas em celular | Dois achados corrigidos: o campo de busca (agora o contêiner inteiro é o rótulo e foca ao toque) e o campo de comprovante do pagamento de conta (altura mínima de 44 px). Nenhum restante |
| Números entre telas (saldo, contas, estoque, caixa, vendas) | Conferidos por teste contra os quadros; onde o desenho não fecha, a divergência está em `DECISIONS.md` (P21, P25, P39) |
| Cor como único sinal | Mantido: etiquetas com texto, estados em `aria-pressed`, aviso com ícone |

Não foi feito: leitor de tela (A2), aparelho real (A3), nem uma revisão a olho de todas as telas nos três tamanhos (A1); as capturas feitas na implementação foram de celular e do PDV em tablet.

## 7. Pendências da auditoria

| ID | Pendência | Quem |
|---|---|---|
| A1 | Passada visual no canvas (alturas, quebras, sobreposições) em celular, tablet e computador | Dono ou equipe, olhando o canvas |
| A2 | Teste com leitor de tela (VoiceOver / TalkBack) no app implementado | Implementação |
| A3 | Teste com usuários reais: atendente no PDV, cliente na loja, entregador na rua | Dono |
| A4 | Pesquisa visual no Mobbin (P1) — pode trazer ajustes de acabamento | Dono (plano pago) |
