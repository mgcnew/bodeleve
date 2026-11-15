# DESIGN_SYSTEM — Bodeleve

Status: aprovado (D10, D11) e auditado na Etapa 7. Tokens em código: `design/tokens.css`. Os cinco quadros estão na página "Etapa 2 · Design system" do canvas Bodeleve.

## Direção

Regional contemporânea: quente e reconhecível na loja, sóbria e legível na operação. A região entra pela cor, pelo tom de voz e pelos selos de origem — não por textura ou ornamento.

Não existe logotipo oficial. A marca aparece só como a palavra "Bodeleve" em texto.

## Tokens de cor

| Token | Hex | Uso |
|---|---|---|
| `cor.terracota` | #A9482C | Ação principal, destino ativo, marca |
| `cor.terracota.pressionado` | #8A3920 | Toque / pressionado |
| `cor.terracota.suave` | #F4E1D8 | Fundo de destaque, item ativo do menu lateral |
| `cor.verde` | #315C46 | Positivo, selo "Feito na casa", liga/desliga ativo |
| `cor.mostarda` | #D9A441 | Destaque — só como preenchimento, nunca texto |
| `cor.creme` | #F7F2E8 | Fundo da loja |
| `cor.grafite` | #292621 | Texto, foco, seleção |
| `fundo.loja` | #F7F2E8 | Ambiente C |
| `fundo.operacao` | #FBFAF6 | Ambientes A, B, D |
| `superficie` | #FFFFFF | Cartões, sheets, barras |
| `linha` | #E4DCCB | Bordas, divisores, esqueleto, desabilitado |
| `texto` | #292621 | 13,51 : 1 sobre creme |
| `texto.secundario` | #5E584E | 6,31 : 1 sobre creme |

| Semântico | Texto | Fundo | Razão | Uso |
|---|---|---|---|---|
| sucesso | #315C46 | #E3EDE6 | 6,37 | Em estoque, pago, pronto, entregue |
| atenção | #7A5A12 | #F8EBC9 | 5,37 | Estoque baixo, vence em breve, em preparo |
| erro | #8C1D18 | #F6E0DC | 7,21 | Sem estoque, vencido, atrasado, cancelado |
| informação | #2F5D7C | #DDE8EF | 5,66 | Novo, em produção, em rota |

Regras: mostarda sobre creme mede 2,02 : 1 e não pode ser texto; erro nunca é terracota e sempre vem com ícone ou texto; cor nunca é o único sinal (destino ativo = cor + peso).

## Tipografia

Bricolage Grotesque (títulos, 700) + Inter (interface).

| Token | Tamanho / linha · peso | Fonte |
|---|---|---|
| `titulo.xl` | 34 / 40 · 700 | Bricolage |
| `titulo.l` | 28 / 34 · 700 | Bricolage |
| `titulo.m` | 22 / 28 · 700 | Bricolage |
| `titulo.s` | 18 / 26 · 600 | Inter |
| `corpo` | 16 / 24 · 400 | Inter |
| `apoio` | 14 / 20 · 400 | Inter |
| `legenda` | 12 / 16 · 600, caixa alta | Inter |
| `valor` | 22 / 28 · 600, números tabulares | Inter |

Todo preço, saldo e valor usa números tabulares.

## Forma

- Espaçamento: 4 · 8 · 12 · 16 · 24 · 32 · 48.
- Raios: 8 (campos, etiquetas) · 12 (botões, cartões) · 20 (sheets, modais) · total (pílulas, selos).
- Toque: mínimo 44 px em qualquer controle (chips, segmentados, botões de quantidade, liga/desliga com área de 60 × 44 px); botões comuns 48 px; ação principal de rodapé, PDV e entregas 56 px. (Ajustado na auditoria: antes 48 px no texto, 40 px em alguns controles.)
- Ícones: 24 no conjunto, traço 1,75 px, grade 24 px; sem emoji.

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
| ≥ 1024 px (computador) | Topo com seções, busca e sacola; grade de 4 colunas; checkout em coluna de até 560 px (`Resp-Loja-Desktop`) | Menu lateral fixo com os 12 módulos; cartões em grade (`Resp-Gestao-Desktop`) | Igual ao tablet | Não previsto |

Folhas (bottom sheets) viram janelas centrais a partir de 768 px.

## Implementação em código (Etapa 2)

Os componentes estão em `app/src/components/` (grupos `base`, `navigation`, `domain`, `states`) e usam só as variáveis de `design/tokens.css`. O catálogo `app/src/gallery/` reproduz os cinco quadros `DS-*`: `cd app && npm install && npm run dev`. Testes: `npm test` (formatação, domínio, contraste dos tokens, comportamento e acessibilidade com axe). Também `npm run lint` e `npm run build`.

Valores que as telas usam e `tokens.css` ainda não nomeia ficam em `app/src/styles/extras.css` (fundo escuro de folha e modal, sombra do segmento, borda de 1,5 px, raio de 10 px, fontes de rótulo, apoio pequeno e etiqueta, anel de foco). Candidatos a entrar em `tokens.css` na próxima revisão do design.

### Desvios em relação aos quadros (a aprovar — P13)

| Onde | O quadro | O código | Motivo |
|---|---|---|---|
| Ação do aviso temporário ("Desfazer") | altura mínima de 32 px | 44 px | Regra de alvo mínimo da auditoria (D17) |
| Peso Inter | 400, 500 e 600 | também 700 | Aba ativa, destino ativo e valores em negrito usam 700; sem o arquivo o navegador fabrica um negrito falso |
| Botão de adicionar no cartão de produto | nome "Adicionar à sacola" | "Adicionar {produto} à sacola" | Leitor de tela precisa saber qual produto |
| Linha do tempo do pedido | só marca visual | texto oculto "concluída / etapa atual / próxima etapa" e `aria-current="step"` | Cor e forma não bastam como único sinal |
| Estoque baixo no bloco de favorito | cor e peso | igual, com "(estoque baixo)" lido por leitor de tela | Mesma razão |
| Controle de quantidade | caixa única de 48 px | variante `joined` (quadro) e `compact` (dois botões de 44 px, como nas telas da sacola) | As telas da loja usam a forma compacta |

### Estados que o desenho não mostra (decididos no código; a confirmar — P13)

- Liga/desliga desligado: trilho em `texto-secundario` com bolinha branca (contraste de 6,3 : 1 no trilho).
- Foco por teclado em botões e links: anel de 2 px grafite com 2 px de distância (campos mantêm a borda de 2 px do quadro).
- Pressionado dos botões secundário, discreto e destrutivo: fundo creme, terracota suave e erro suave.
- Diferença de caixa positiva: sinal "+" no texto, sem cor de erro.

### Ainda não feito

- Folha e abas: fechar a folha com o botão voltar do aparelho depende do roteador (Etapa 3).
- Foto de produto real (P3): o marcador `[FOTO DO PRODUTO]` continua.
- Revisão com leitor de tela (A2) e teste com usuários (A3).

## Pendências

- Aprovação de P-J a P-P.
- Logotipo oficial.
- Fotografia própria: até lá, marcador `[FOTO DO PRODUTO]`.
- Tema escuro: não previsto; decidir na auditoria (Etapa 7) se faz sentido para Entregas à noite.
- Passada visual no canvas (A1 em AUDIT.md): os quadros não foram renderizados para conferência; alturas foram estimadas.
