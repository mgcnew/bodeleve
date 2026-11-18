---
name: Bodeleve
description: Plataforma da Casa do Norte (loja, gestão, PDV, entregas) no padrão da categoria, feito com rigor. Celular em faixas de cor viva, computador sóbrio e denso.
colors:
  primary: "#0F7A43"
  primary-pressed: "#0B6236"
  primary-soft: "#E4F4EA"
  forest: "#0A3D2A"
  orange: "#E8590C"
  orange-text: "#B4470A"
  orange-soft: "#FFEDD5"
  orange-seal: "#C2410C"
  yellow: "#F6C343"
  ink: "#141B17"
  store-bg: "#F6F8F5"
  ops-bg: "#F4F6F4"
  soft-bg: "#EBEFEB"
  surface: "#FFFFFF"
  line: "#E1E6E1"
  line-strong: "#C8D0C9"
  text-secondary: "#4E5A52"
  bar-text-soft: "#BFE3CF"
  success: "#0B6236"
  success-bg: "#E1F3E8"
  warning: "#8A5A00"
  warning-bg: "#FFF1CC"
  error: "#B3173A"
  error-bg: "#FDE6EA"
  info: "#1D5FA8"
  info-bg: "#E3EEFA"
  hue-pink: "#A3265B"
  hue-pink-bg: "#FCE7F0"
typography:
  title-xl:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "38px"
    letterSpacing: "-0.015em"
  title-l:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.015em"
  title-m:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 650
    lineHeight: "28px"
    letterSpacing: "-0.015em"
  title-s:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "26px"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  support:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.06em"
  value:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
    fontFeature: "tnum"
rounded:
  field: "10px"
  card: "16px"
  sheet: "24px"
  pill: "999px"
  field-desktop: "8px"
  card-desktop: "12px"
  sheet-desktop: "16px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.card}"
    height: "48px"
    padding: "0 20px"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    height: "48px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.card}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
    rounded: "{rounded.card}"
  button-disabled:
    backgroundColor: "{colors.soft-bg}"
    textColor: "{colors.text-secondary}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "48px"
    padding: "0 14px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px"
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "16px"
  seal-house-made:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  seal-brand:
    backgroundColor: "{colors.orange-seal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  seal-third-party:
    backgroundColor: "{colors.text-secondary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  tag-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  tag-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.pill}"
  tag-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error}"
    rounded: "{rounded.pill}"
  tag-info:
    backgroundColor: "{colors.info-bg}"
    textColor: "{colors.info}"
    rounded: "{rounded.pill}"
  nav-item-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-pressed}"
    rounded: "{rounded.card}"
    height: "56px"
  top-bar-mobile:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    rounded: "0 0 24px 24px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
---

# Design System: Bodeleve

## Overview

**Creative North Star: "A Casa em Folha e Floresta"**

O sistema é o padrão da categoria executado com rigor: referências de acabamento Linear e Stripe no painel, iFood e Shopify na loja. No celular, uma faixa verde-floresta no topo diz em um olhar onde a pessoa está, com chips, atalhos e cartões coloridos abaixo. No computador a mesma interface fica sóbria, clara e densa: barra de topo branca, menu lateral, tabelas com hover, teclado em primeiro plano. Uma única fonte (Geist), números tabulares, cartões brancos com linha fina e sombras só quando algo flutua.

A ação principal é sempre verde-folha e fica no mesmo lugar. Laranja e amarelo são destaque e origem de produto; azul e rosa existem só como matiz de categoria e informação. O movimento é curto e some com `prefers-reduced-motion`. A direção recusa o painel cinza com um acento só e a loja de comida com textura regional decorativa. A marca aparece apenas como a palavra "Bodeleve"; não há logotipo.

**Key Characteristics:**
- Neutros frios com matiz de verde; verde-folha como única cor de ação.
- Faixa de topo que muda por breakpoint (floresta no celular, branca a partir de 768 px).
- Raios macios no celular (16 px), firmes no computador (12 px).
- Profundidade tonal e por linha; sombra só em menu, folha, modal e botões sólidos leves.
- Alvos de toque de 44, 48 e 56 px; cor nunca é o único sinal.

## Colors

Paleta fria com verde dominante, laranja como acento raro e semânticos separados da marca.

### Primary
- **Verde-folha** (`primary`): botão principal, chip selecionado, selo Feito na casa, foco, cursor de texto, controles nativos. Pressionado e hover: `primary-pressed`. Fundo suave de seleção e hover de botão discreto: `primary-soft`.
- **Verde-floresta** (`forest`): faixa de topo no celular e destaques escuros. Texto suave sobre ela: `bar-text-soft`.

### Secondary
- **Laranja** (`orange`): destaque, só como preenchimento. Texto laranja usa `orange-text`; fundo suave `orange-soft`. O selo Marca Bodeleve usa `orange-seal`, mais escuro, para o branco passar de 4,5:1.
- **Amarelo** (`yellow`): só preenchimento, nunca texto.

### Tertiary
- **Rosa de categoria** (`hue-pink` sobre `hue-pink-bg`): matiz de chip, atalho e ícone. O azul de `info` cumpre o mesmo papel de categoria.

### Neutral
- **Tinta** (`ink`): texto, foco de seleção. **Texto secundário** (`text-secondary`): apoio, placeholder, rótulos em caixa alta.
- **Fundos**: `store-bg` na loja, `ops-bg` na gestão, PDV e entregas (também o fundo do body), `soft-bg` em campos desligados e marcadores de foto, `surface` nos cartões.
- **Linhas**: `line` em cartões e divisores, `line-strong` em campos, chips e botões secundários.
- **Semânticos**: `success`, `warning`, `error`, `info`, cada um com seu `-bg`, sempre em par texto/fundo.

### Named Rules
**The One Action Rule.** Verde-folha é a única cor de ação. Laranja e amarelo destacam, mas nunca recebem clique primário.

**The Fill-Only Rule.** `orange` e `yellow` não são cor de texto; texto laranja usa `orange-text`.

**The Pair Rule.** Estado semântico é sempre texto escuro sobre o fundo suave do mesmo matiz, com palavra ou ícone junto.

## Typography

**Display, Body e Label:** Geist (fallback `system-ui, sans-serif`), pesos 400 a 700.

**Character:** uma só família com contraste por peso e tamanho. Títulos com tracking de -0.015em e `text-wrap: balance`; números de dinheiro, quantidade e peso em tabular.

### Hierarchy
- **Title XL** (700, 32/38; 30/36 a partir de 1024 px): título de tela.
- **Title L** (700, 26/32; 24/30 no computador): título de seção grande.
- **Title M** (650, 21/28): título de folha e modal.
- **Title S** (600, 18/26): título de cartão, total.
- **Body** (400, 16/24): texto e campos.
- **Support** (400, 14/20; 13/18 em ajuda e erro de campo): apoio.
- **Label** (600, 12/16, caixa alta, 0.06em): legenda de grupo. Apenas legenda funcional de seção.
- **Value** (600, 22/28, tabular): KPI e totais.

### Named Rules
**The Tabular Rule.** Todo número que se compara ou soma usa `tabular-nums`.

## Layout

Mobile-first, 360 a 430 px. Espaço em base 4 (4, 8, 12, 16, 24, 32, 48); página com 16 px de margem no celular e 32 px no computador, conteúdo até 1200 px. KPIs em 2 colunas no celular e 4 a partir de 1024 px. Alvos mínimos: 44 px (qualquer controle), 48 px (botão e campo), 56 px (ação principal de rodapé, PDV, entregas, linhas de lista).

Pontos de quebra: 768 px (tablet) e 1024 px (computador); há ajustes pontuais em 900 e 1100 px. A faixa de topo é guiada por `--barra-*`: até 767 px ela é `forest`, com texto branco, texto suave `bar-text-soft`, sem linha e cantos inferiores arredondados (raio de folha); de 768 px vira `surface` com texto `ink`, `text-secondary` e linha `line`, sem arredondar. A tela de carregamento já nasce com essa cor para não piscar.

Navegação: barra inferior no celular e tablet; a partir de 1024 px vira coluna lateral de 88 px (gestão com menu lateral e barra superior de busca e conta; PDV ganha coluna; entregas vira coluna centralizada).

## Elevation & Depth

Híbrido: cartões são planos, brancos, com linha de 1 px; a sombra aparece só no que flutua ou responde.

### Shadow Vocabulary
- **Sombra 1** (`0 1px 2px rgb(20 27 23 / .06), 0 1px 1px rgb(20 27 23 / .04)`): botão primário e secundário, segmento ativo.
- **Sombra 2** (`0 6px 16px rgb(20 27 23 / .1), 0 2px 4px rgb(20 27 23 / .06)`): menus e hover de cartão.
- **Sombra 3** (`0 18px 48px rgb(20 27 23 / .18), 0 4px 12px rgb(20 27 23 / .08)`): folha, modal, paleta de comandos.
- **Véu** (`rgb(10 30 22 / .45 a .5)`): fundo atrás de diálogo.
- **Anel de foco de campo** (`0 0 0 3px primary-soft` com borda `primary`).

### Named Rules
**The Float-Only Rule.** Sombra marca o que flutua (menu, folha, modal) ou responde ao ponteiro. Cartão em repouso não tem sombra.

## Shapes

Quatro raios: campo 10 px (8 no computador), cartão e botão 16 px (12), folha e modal 24 px (16), pílula 999 px para chips, selos, etiquetas e barra de rolagem. Cartões levam linha de 1 px; erro de campo usa 2 px. Folhas no celular sobem de baixo com cantos superiores arredondados e uma alça de 40 x 4 px; a partir de 768 px viram janela central de 440 px.

## Components

### Buttons
- **Shape:** 16 px de raio (12 no computador), 48 px de altura (56 px no tamanho principal), peso 600, texto 16 px.
- **Primary:** fundo `primary`, texto branco, sombra 1; pressionado e hover (só com ponteiro fino) `primary-pressed`.
- **Secondary:** branco com borda `line-strong`; hover vai a `ops-bg`. **Quiet:** transparente, texto verde, hover `primary-soft`. **Danger:** branco, texto e borda `error`, hover `error-bg`.
- **Disabled e carregando:** `soft-bg` com texto secundário, sem sombra; carregando mostra um giro de 18 px. `:active` reduz a escala a 0.98.
- **Ícone:** 44 x 44 px, sempre com nome acessível; variantes primária, muda e contornada.

### Inputs / Fields
- Altura 48 px, borda 1 px `line-strong`, fundo branco, raio de campo; hover escurece a borda para `text-secondary`.
- **Foco:** borda `primary` e anel de 3 px `primary-soft`. **Erro:** borda de 2 px `error`, com mensagem e ícone abaixo (nunca só cor). **Desligado:** `soft-bg`.
- Opção única em linhas de 56 px, que ficam `primary-soft` com borda verde quando marcadas. Controle segmentado sobre `soft-bg`, com segmento ativo branco e sombra 1.

### Chips
- Pílula de 44 px, borda `line-strong`, texto 14 px peso 600. Selecionado: fundo e borda `primary`, texto branco. Hover com ponteiro: borda verde.
- Filtros rolam na horizontal no celular, com a borda direita esmaecida; quebram linha a partir de 768 px.

### Cards / Containers
- Cartão e painel: fundo branco, borda `line`, raio de cartão, 16 px de padding, sem sombra. Linhas de lista de 56 px com divisor `line`. Resumos com total em 18 px 600 tabular.

### Seals and Tags
- **Selos de origem** (pílula, branco 12 px 600): Feito na casa em `primary`, Marca Bodeleve em `orange-seal`, Revenda em `text-secondary`.
- **Etiquetas de estado** (pílula, 13 px 600): par texto/fundo semântico.

### Navigation (bottom bar in a pill)
- Barra branca com linha superior, itens de 56 px com ícone e legenda de 12 px. O destino ativo vira pílula `primary-soft` com texto `primary-pressed` e peso 700 (cor e peso juntos). Hover só em ponteiro fino. Respeita a área segura do aparelho. Com 1024 px ou mais, vira coluna lateral de 88 px com itens de 68 px.

### Skeleton
- Blocos `fundo-suave` com um brilho que cruza (faixa branca a 65%, 1.4 s, `ease-saida`, só `transform`). Sobre a faixa de topo do celular usam cinza translúcido. A tela de carregamento reproduz cabeçalho, KPIs e linhas.

### Sheet and Modal
- `<dialog>` nativo. Celular: folha de baixo, sobe 24 px com fade em 200 ms. A partir de 768 px, janela central que abre com escala 0.97. Sombra 3, véu escuro esverdeado, padding de 16 px mais área segura.

### Command Palette (signature)
- Diálogo de 560 px a 12vh do topo, campo de 56 px, itens de 44 px, item ativo em `primary-soft`. Cada item mostra suas teclas em `kbd` (altura 20 px, borda inferior de 2 px). Rodapé em `ops-bg` com dicas.
- **Teclado:** Ctrl/⌘ + K abre; `/` também; `g` seguido de uma letra vai ao módulo (gi início, gp pedidos, ge estoque, gf financeiro, gc compras, go produção, gu produtos, gl clientes, gd entregas, gr relatórios). Setas navegam, Enter abre. Atalhos de uma tecla não disparam ao digitar, com diálogo aberto ou desligados em Meu perfil.

### Motion
- Duração 120 ms (cor, fundo, sombra, transform de controles) e 200 ms (entrada de tela, navegação, folhas); easing `cubic-bezier(0.22, 1, 0.36, 1)`. Entrada de tela: fade com 6 px de deslocamento. Com `prefers-reduced-motion` tudo cai a 0.01 ms.

## Do's and Don'ts

### Do:
- **Do** usar os tokens de `design/tokens.css` por nome; nunca redigitar cor, raio ou espaço.
- **Do** usar `primary` para a ação principal e manter a faixa de topo em `--barra-*` para a cor mudar por breakpoint.
- **Do** manter alvos de 44 px no mínimo, 48 px em botão e campo, 56 px na ação principal.
- **Do** combinar cor com texto, ícone ou peso em todo estado (aba ativa, erro, etiqueta).
- **Do** limitar transições a 120 ou 200 ms com `--ease-saida`, em cor, fundo, sombra e transform; hover só dentro de `@media (hover: hover)`.
- **Do** usar `tabular-nums` em números e dinheiro (em centavos no domínio).
- **Do** usar `:focus-visible` com contorno de 2 px na cor de ação e deslocamento de 2 px.
- **Do** manter `[textos entre colchetes]` como conteúdo editável.

### Don't:
- **Don't** usar laranja ou amarelo como texto; texto laranja é `orange-text`.
- **Don't** pôr sombra em cartão em repouso nem animar layout (largura, altura, posição).
- **Don't** usar azul ou rosa como cor de ação; são só matizes de categoria e informação.
- **Don't** usar textura regional decorativa, ilustração de folha, nem painel cinza de um acento só.
- **Don't** escrever hex solto em componente quando existe token.
- **Don't** usar a cor como único sinal nem botão de ícone sem nome acessível.
