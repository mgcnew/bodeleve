# DESIGN_SYSTEM — Bodeleve

Status: direção aprovada na Etapa 1 (D10). Sistema construído na **Etapa 2**, aguardando aprovação (P-J a P-P em DECISIONS.md). Os cinco quadros estão na página "Etapa 2 · Design system" do canvas Bodeleve.

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
- Toque: mínimo 48 px; ações do PDV e da entrega 56 px.
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

## Pendências

- Aprovação de P-J a P-P.
- Logotipo oficial.
- Fotografia própria: até lá, marcador `[FOTO DO PRODUTO]`.
- Tema escuro: não previsto; decidir na auditoria (Etapa 7) se faz sentido para Entregas à noite.
- Os quadros não foram renderizados para conferência visual por mim; alturas foram estimadas.
