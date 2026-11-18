# DESIGN_SYSTEM — Bodeleve

Status: aprovado (D10, D11), auditado na Etapa 7 e renovado em 2026-11-18 (D18). Tokens em código: `design/tokens.css`. Os cinco quadros estão na página "Etapa 2 · Design system" do canvas Bodeleve.

## Direção

Atualizada em 2026-11-18 (D18): **o padrão da categoria, bem executado**, no nível de acabamento de Linear e Stripe (painel), iFood e Rappi, Shopify (loja). Verde-folha como ação, neutros frios, laranja e amarelo como destaque.

- **Celular**: cor viva. Faixa de topo em verde-floresta com título branco, cartões e atalhos em matizes (laranja, verde, amarelo, azul, rosa), fotos de produto com marcador tingido pela origem.
- **Computador (≥ 768 px)**: sóbrio e denso. Topo branco com linha fina, cartões brancos, a cor fica nos estados, nos botões e no número. Menu lateral agrupado, busca por comando e atalhos de teclado.
- Movimento curto e barato: 120 e 200 ms, ease-out, só cor, fundo, sombra, opacidade e transform. Desligado com `prefers-reduced-motion`.

Não existe logotipo oficial. A marca aparece só como a palavra "Bodeleve" em texto.

## Tokens de cor

Fonte: `design/tokens.css`. Razões de contraste medidas contra o fundo em que o par é usado.

| Token | Hex | Uso |
|---|---|---|
| `cor.primaria` | #0F7A43 | Ação principal, destino ativo, selo "Feito na casa" (5,41 : 1 com branco) |
| `cor.primaria.pressionado` | #0B6236 | Hover e toque (7,46 : 1 com branco) |
| `cor.primaria.suave` | #E4F4EA | Item ativo, foco, opção escolhida |
| `cor.floresta` | #0A3D2A | Faixa de topo no celular, destaques (12,25 : 1 com branco) |
| `cor.laranja` / `.texto` / `.suave` | #E8590C / #B4470A / #FFEDD5 | Destaque; só preenchimento no primeiro; selo "Marca Bodeleve" usa #C2410C |
| `cor.amarelo` | #F6C343 | Só preenchimento; texto floresta sobre ele (7,47 : 1) |
| `cor.tinta` | #141B17 | Texto e foco forte |
| `fundo.loja` / `fundo.operacao` | #F6F8F5 / #F4F6F4 | Fundos de página |
| `fundo.suave` | #EBEFEB | Campo desligado, esqueleto, marcador de foto |
| `superficie` | #FFFFFF | Cartões, folhas, barras |
| `linha` / `linha.forte` | #E1E6E1 / #C8D0C9 | Divisores / bordas de campo e botão secundário |
| `texto` / `texto.secundario` | #141B17 / #4E5A52 | 16,13 : 1 / 6,65 : 1 sobre o fundo da operação |

| Semântico | Texto | Fundo | Razão | Uso |
|---|---|---|---|---|
| sucesso | #0B6236 | #E1F3E8 | ≥ 6 | Em estoque, pago, pronto, entregue |
| atenção | #8A5A00 | #FFF1CC | 5,28 | Estoque baixo, vence em breve, em preparo |
| erro | #B3173A | #FDE6EA | 5,70 | Sem estoque, vencido, atrasado, cancelado |
| informação | #1D5FA8 | #E3EEFA | 5,49 | Novo, em produção, em rota |
| matiz rosa | #A3265B | #FCE7F0 | 5,97 | Categorias e atalhos |

Regras: amarelo e laranja de preenchimento nunca são texto; erro sempre vem com ícone ou texto; cor nunca é o único sinal (destino ativo = pílula + peso).

## Tipografia

Geist (títulos e interface, 400 a 700), via Google Fonts. Títulos com espaçamento -0.015em e `text-wrap: balance`.

| Token | Tamanho / linha · peso |
|---|---|
| `titulo.xl` | 32 / 38 · 700 (30 / 36 no computador) |
| `titulo.l` | 26 / 32 · 700 (24 / 30 no computador) |
| `titulo.m` | 21 / 28 · 650 |
| `titulo.s` | 18 / 26 · 600 |
| `corpo` | 16 / 24 · 400 |
| `apoio` | 14 / 20 · 400 |
| `legenda` | 12 / 16 · 600, caixa alta |
| `valor` | 22 / 28 · 600, números tabulares |

Todo preço, saldo e valor usa números tabulares.

## Forma e profundidade

- Espaçamento: 4 · 8 · 12 · 16 · 24 · 32 · 48.
- Raios: celular 10 (campos) · 16 (botões, cartões) · 24 (folhas); computador 8 · 12 · 16; pílulas totais.
- Sombras: `sombra-1` (botões e controle segmentado), `sombra-2` (hover de cartão, menus), `sombra-3` (folhas e janelas). Sem sombra dura.
- Toque: mínimo 44 px; botões comuns 48 px; ação principal de rodapé, PDV e entregas 56 px.
- Ícones: 24 no conjunto, traço 1,75 px, grade 24 px; sem emoji.

## Ações e listas (computador)

- **Gestão tem barra superior** (a partir de 768 px) só com a busca "Buscar ou ir para…" (Ctrl/⌘ K). **As ações da tela ficam na linha do título, à direita**, a partir de 1024 px (`Bar` e `PageHeader` aceitam `action`), alinhadas com a borda direita do conteúdo. No celular e no tablet continuam no corpo ou no rodapé fixo. Formulários mantêm o botão de salvar no rodapé. O título fica sobre o fundo, sem faixa, a partir de 1024 px.
- **Listas paginadas** em 20 por página (`components/Pagination`): "21–40 de 87", Anterior e Próxima; some quando cabe numa página; a busca ou o filtro voltam à página 1.
- Espaçamento do computador: conteúdo com 24 px de margem e 16 px entre blocos; cabeçalho de 72 px.

## Movimento

`--dur-1` 120 ms (cor, borda, escala do botão) · `--dur-2` 200 ms (entrada de tela, folha, cartão) · `--ease-saida` exponencial. Entrada de tela: opacidade e 6 px, uma vez por rota. Esqueleto: faixa de brilho só com `transform`. Hover só onde existe ponteiro (`@media (hover: hover)`).

## Carregamento

Com o Supabase, cada ambiente mostra um esqueleto no formato da tela (painel, lista ou detalhe) até a primeira busca terminar (`services/firstLoad.ts`); sem internet, libera após 8 s. Sem Supabase (dados de exemplo) a tela nasce pronta. A loja mantém esqueleto por tela.

## Teclado (computador)

- Gestão: `Ctrl/⌘ + K` ou `/` abre "Buscar ou ir para"; `G` e uma letra vai ao módulo (`I` início, `P` pedidos, `E` estoque, `F` financeiro, `C` compras, `O` produção, `U` produtos, `L` clientes, `D` entregas, `R` relatórios).
- PDV: `/` ou `F2` busca produto; `F4` vai cobrar.

## Componentes

| Grupo | Componentes | Estados cobertos |
|---|---|---|
| Base | Botão (principal, secundário, discreto, destrutivo, só ícone) · campo de texto · busca · seletor de quantidade · campo de peso com atalhos · controle segmentado · opção única · caixa de seleção · liga/desliga · etiqueta de status · selo de origem | Padrão, pressionado, foco, erro, desabilitado, carregando |
| Navegação | Barra inferior (4 ambientes) · barra de sacola · barra superior · abas · segmentos · bottom sheet · modal · aviso temporário · menu lateral (≥ 768 px) | Ativo / inativo |
| Loja | Cartão de produto · item na sacola · resumo de valores | — |
| PDV | Bloco de favorito · linha da venda · forma de pagamento · fechamento de caixa | Estoque baixo no bloco; selecionado |
| Gestão | Indicador · saldos de estoque (físico, reservado, disponível, projetado) · lote e validade · lançamento financeiro · linha do tempo do pedido | Atenção, erro, concluído / atual / futuro |
| Entregas | Cartão de entrega · etapa da entrega · código de confirmação | Próprio / parceiro |
| Estados | Vazio · esqueleto de carregamento · falha ao carregar · faixas de aviso · erro no campo | — |

## Regras de uso

- Uma ação principal (terracota) por tela.
- Rótulo de campo sempre visível acima; mensagem de erro diz como corrigir.
- Bottom sheet só para escolhas curtas ligadas à tela; confirmação crítica vai em modal ou tela cheia.
- Barra inferior some em checkout, pagamento e entrega em rota.
- Carregamento de tela usa esqueleto no formato do conteúdo; ação em andamento mostra indicador no próprio botão.
- Selos de origem: "Marca Bodeleve" (terracota) e "Feito na casa" (verde) aparecem na loja; "Revenda" só na gestão.

## Responsivo

| Faixa | Loja | Gestão | PDV | Entregas |
|---|---|---|---|---|
| < 768 px (celular) | Barra inferior de 4 abas, grade de 2 colunas | Barra inferior de 5 abas | Barra de 3 abas, grade de 2 colunas | Barra de 3 abas |
| 768–1023 px (tablet) | Grade de 3 colunas | Menu lateral recolhível | Grade de 4 colunas + sacola fixa à direita (referência `Resp-PDV-Tablet`) | Igual ao celular |
| ≥ 1024 px (computador) | Topo com seções, busca e sacola; grade de 4 colunas; checkout em coluna de até 560 px (`Resp-Loja-Desktop`) | Menu lateral fixo com os 12 módulos em 4 grupos, busca Ctrl+K; cartões em grade (`Resp-Gestao-Desktop`) | Navegação em coluna à esquerda + grade + sacola à direita | Coluna centralizada de até 560 px (a partir de 768 px) |

Folhas (bottom sheets) viram janelas centrais a partir de 768 px.

## Pendências

- Aprovação de P-J a P-P.
- Logotipo oficial.
- Fotografia própria: até lá, marcador `[FOTO DO PRODUTO]`.
- Tema escuro: não previsto; decidir na auditoria (Etapa 7) se faz sentido para Entregas à noite.
- Passada visual no canvas (A1 em AUDIT.md): os quadros não foram renderizados para conferência; alturas foram estimadas.
