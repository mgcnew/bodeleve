# DECISIONS — Bodeleve

Registro único de decisões. Outros documentos referenciam os IDs daqui em vez de repetir a decisão.

## Confirmadas (vêm do briefing ou do usuário)

| ID | Data | Decisão | Origem |
|---|---|---|---|
| D1 | 2026-11-14 | Fase atual é design-first; nada operacional é implementado | Briefing |
| D2 | 2026-11-14 | Mobile-first, 360–430 px; tablet e desktop adaptam | Briefing |
| D3 | 2026-11-14 | Quatro ambientes: Gestão, PDV, Loja, Entregas | Briefing |
| D4 | 2026-11-14 | Implementação futura em Supabase; sem conexão agora | Briefing |
| D5 | 2026-11-14 | Catálogo visível sem conta | Briefing |
| D6 | 2026-11-14 | Nenhum logotipo conceitual vale como oficial sem aprovação | Briefing |
| D7 | 2026-11-14 | Dados organizados por estabelecimento | Briefing |
| D8 | 2026-11-14 | Trabalho em etapas com aprovação entre elas; agora só a Etapa 1 | Briefing |
| D9 | 2026-11-14 | Com o Mobbin indisponível (plano pago exigido), a Etapa 1 usa pesquisa pública na web, sem apresentar nada como Mobbin | Usuário |

| D10 | 2026-11-14 | Etapa 1 aprovada em bloco ("pode seguir"): valem as propostas P-A a P-I abaixo | Usuário |
| D11 | 2026-11-14 | Etapa 2 (design system) aprovada ("pode continuar para próxima fase"): valem P-J a P-P | Usuário |
| D12 | 2026-11-14 | Etapa 3 entregue em lotes; lote 1 = Início, Produto, Sacola, Pedido confirmado; lote 2 = checkout; lote 3 = catálogo, marca, pedidos e conta | Usuário |
| D13 | 2026-11-14 | Etapa 3 (loja) considerada aprovada ("continue"); Etapa 4 (gestão) iniciada em lotes; lote 1 = Entrar, Início, Pedidos, Pedido, Mais; lote 2 = Compras e Fornecedores; lote 3 = Estoque; lote 4 = Produção; lote 5 = Financeiro; lote 6 = Produtos, Clientes, Entregas, Relatórios, Configurações | Usuário |
| D15 | 2026-11-15 | Etapa 5 (PDV) entregue: 12 telas do mapa em 9 quadros (peso, desconto e sangria como folhas dentro de Vender, Sacola e Caixa) | — |
| D16 | 2026-11-15 | Etapa 6 (Entregas) entregue: 9 telas; próprio × parceiro mostrado pelo ajuste “perfil” nos quadros | — |
| D17 | 2026-11-15 | Etapa 7 (auditoria) concluída: alvo mínimo de toque passa a 44 px; referências de tablet e computador; pacote de passagem (CLAUDE.md, tokens.css, mapa tela → arquivo) | — |
| D18 | 2026-11-18 | Renovação visual total pedida pelo dono: paleta nova, celular colorido, computador sóbrio com transições leves, esqueletos e responsividade. Escolhido "o padrão da categoria" (referências Linear/Stripe, iFood/Rappi, Shopify) | Usuário |
| D19 | 2026-11-18 | Fase atual sem entrega: o cliente só retira na loja e fecha o pedido enviando-o por escrito ao WhatsApp da casa. O pedido é salvo no sistema antes (fila da gestão, estoque e relatórios seguem funcionando) e continua reservando estoque até o gestor aceitar ou cancelar. Entrega, quando pedida, é combinada na conversa. O checkout completo (entrega, Pix, cartão, código) fica guardado atrás de `hypotheses.checkoutMode` ('whatsapp' ou 'complete') | Usuário |
| D20 | 2026-11-18 | Configurações completas: seções "Minha conta" (Meu perfil, Aparência e teclado), visíveis a todos, e "A casa" (Dados da casa com WhatsApp, Horário de funcionamento, Loja online, Equipe e permissões), só do dono. Tema claro, escuro ou automático, escolhido por aparelho (padrão: claro) | Usuário |
| D14 | 2026-11-15 | Seguir até concluir todas as etapas sem parar; o que depender do usuário é documentado como pendência | Usuário |

## Propostas da Etapa 1 — aprovadas (D10)

| ID | Proposta | Detalhe em |
|---|---|---|
| P-A | Paleta do briefing mantida; terracota = ação principal; mostarda só como preenchimento | DESIGN_SYSTEM.md |
| P-B | Fontes: Bricolage Grotesque (títulos) + Inter (interface) | DESIGN_SYSTEM.md |
| P-C | Loja em fundo creme; Gestão, PDV e Entregas em fundo branco quente | DESIGN_SYSTEM.md |
| P-D | Navegação: Loja 4 abas + barra de sacola · Gestão 5 abas com "Mais" · PDV 3 · Entregas 3 | INFORMATION_ARCHITECTURE.md |
| P-E | Produto com duas dimensões separadas: tipo de item e origem/marca | INFORMATION_ARCHITECTURE.md |
| P-F | Mapa de 75 telas | SCREEN_MAP.md |
| P-G | Ordem dos fluxos: E-commerce, PDV, Compras, Produção, Financeiro, Entregas | USER_FLOWS.md |
| P-H | Checkout como convidado é a opção principal | USER_FLOWS.md |
| P-I | Entrega confirmada por código do cliente | BUSINESS_RULES.md (H6) |

## Propostas da Etapa 2 — aprovadas (D11)

| ID | Proposta | Detalhe em |
|---|---|---|
| P-J | Tokens finais de cor, tipo, espaço e raio | DESIGN_SYSTEM.md · quadro Fundamentos |
| P-K | Conjunto de 24 ícones de traço | quadro Fundamentos |
| P-L | Componentes base e seus estados | quadro Componentes base |
| P-M | Barras inferiores, abas, sheet, modal e menu lateral | quadro Navegação e sobreposições |
| P-N | Componentes de domínio (produto, PDV, estoque, financeiro, entrega) | quadro Componentes de domínio |
| P-O | Padrões de vazio, carregando e erro | quadro Estados |
| P-P | Foto de produto fica como marcador [FOTO DO PRODUTO] até haver material próprio | DESIGN_SYSTEM.md |

## Hipóteses usadas nas telas da Etapa 3 (lotes 1 a 3) — a confirmar

| ID | Hipótese | Depende de |
|---|---|---|
| H-L1 | Taxa de entrega fixa de exemplo (R$ 8,00), mostrada já na sacola como "estimada" | Q6 |
| H-L2 | Retirada na loja sem custo | Q7 |
| H-L3 | Início organizado em: Mais pedidos, Feitos na casa, Linha Bodeleve, Sobre a Bodeleve | Q1, Q16 |
| H-L4 | Código de entrega de 4 dígitos exibido na confirmação | H6 |
| H-L6 | Checkout em 4 etapas: identificação (nome e WhatsApp, sem senha), entrega ou retirada, pagamento, revisão | H5 |
| H-L7 | Janelas de entrega de exemplo: o quanto antes, hoje à tarde, amanhã cedo | Q7 |
| H-L8 | Pagamento: Pix agora; cartão ou dinheiro ao receber (com troco). Sem cartão online | Q8 |
| H-L9 | Endereço validado contra área de entrega ao preencher o CEP | Q6 |
| H-L10 | Login sem senha, por código de 4 dígitos enviado ao WhatsApp; a conta é criada no primeiro acesso | D4 (Supabase Auth) |
| H-L11 | Categorias de exemplo: Queijos e laticínios, Carnes e embutidos, Farinhas e grãos, Doces | Q1 |
| H-L12 | Quem compra sem conta vê os pedidos feitos naquele aparelho | H5 |
| H-L13 | "Pedir de novo" deixa de fora itens indisponíveis e avisa antes | Q9 |
| H-L5 | Textos de produto e da casa ficam como marcadores entre colchetes até haver conteúdo real | Q15 |

## Hipóteses usadas nas telas da Etapa 4 (gestão) — a confirmar

| ID | Hipótese | Depende de |
|---|---|---|
| H-G1 | Equipe entra com e-mail e senha; só dono ou gestor cadastra pessoas | H8, Q4 |
| H-G2 | Início mostra primeiro "Pede ação hoje"; faturamento do mês e gráficos ficam em Relatórios | Princípio do briefing |
| H-G3 | Vendas do dia abrem já separadas em balcão e internet, com comparação com ontem no mesmo horário | — |
| H-G4 | Pedido online passa por Novo → Separando (conferência item a item, com lote) → Pronto → Em rota | H2, H3 |
| H-G5 | Venda de balcão entra concluída e não aparece na fila de pedidos | H2 |
| H-G7 | Pedido de compra sugere quantidades pelo estoque mínimo e é enviado ao fornecedor pelo WhatsApp | Q14 |
| H-G8 | Recebimento confere item a item com lote e validade; aceita recebimento parcial (manter em aberto ou encerrar) | H3 |
| H-G9 | A conta a pagar nasce no recebimento, com o valor do que chegou, e vence conforme o prazo do fornecedor | H4 |
| H-G10 | Estoque mostra itens à venda e matérias-primas na mesma lista, diferenciados por selo (Feito na casa, Marca Bodeleve, Revenda, Matéria-prima) | P-E |
| H-G11 | Saída de estoque segue o lote que vence primeiro; o item indica o "próximo a sair" | H3 |
| H-G12 | Perda e consumo interno registram lote, motivo e custo; correção de contagem também pode somar | — |
| H-G13 | Inventário por área (ex.: Queijos e laticínios), com diferença em unidades e em custo antes de aplicar | Q1 |
| H-G14 | Leite e coalho são matérias-primas compradas; queijos e doce de leite são produzidos na casa | Q3 |
| H-G15 | Produção antecipada e sob demanda convivem: cada ordem diz se vai "para estoque" ou "para um pedido" | Q3 |
| H-G16 | Ficha técnica por fornada (ex.: 10 un de queijo coalho), com custo por unidade calculado e margem sobre o preço | Q3 |
| H-G17 | Criar ordem confere insumos; se falta e há compra chegando, avisa; se não, a ordem fica planejada | H1 |
| H-G18 | Ao concluir a ordem: consumo real e unidades boas são apontados, o lote do acabado entra no estoque e o custo real substitui o previsto | — |
| H-G19 | Gás e energia entram na ficha como custo indireto estimado por fornada | Q3 |
| H-G20 | Duas contas de dinheiro: conta no banco e caixa (gaveta); transferência entre elas não é entrada nem saída | Q14 |
| H-G21 | Financeiro mostra o saldo agora e o saldo previsto dia a dia (7 dias) a partir das contas a pagar e a receber | — |
| H-G22 | Despesas fixas (aluguel, energia, gás) se repetem todo mês; ao pagar, a próxima já fica lançada | — |
| H-G23 | Pagar conta registra valor, multa e juros, data, de onde saiu e forma; avisa se o saldo da origem não cobre | — |
| H-G24 | Cartão a liquidar e fiado aparecem como contas a receber | Q13, Q14 |
| H-G25 | Cadastro do produto separa tipo de item e origem; liga/desliga loja, favorito no PDV, venda por peso e controle de lote | P-E |
| H-G26 | Entregador próprio recebe por mês; parceiro recebe por entrega (valor de exemplo R$ 9,00); se ninguém aceitar em 10 min, volta para a loja | Q11 |
| H-G27 | Cinco papéis fixos (dono, gestor, atendente, produção, entregador) com acesso por módulo; sem permissão por pessoa nesta versão | H8 |
| H-G28 | Relatórios: vendas por período (hoje, 7 dias, mês), canal, pagamento e mais vendidos; um único gráfico de barras por dia | Princípio do briefing |
| H-G29 | Configurações de loja online, pagamentos e nota fiscal ficam visíveis mas dependem de respostas pendentes | Q6–Q8, Q12 |
| H-G6 | "A receber" inclui cartões a liquidar e fiado | Q13 |

## Hipóteses usadas nas telas da Etapa 5 (PDV) — a confirmar

| ID | Hipótese | Depende de |
|---|---|---|
| H-P1 | PDV no celular de 390 px, com alvos de 56 px; versão de tablet do balcão desenhada como referência na auditoria | Q4 |
| H-P2 | Peso digitado com atalhos (250 g, 500 g, 1 kg) e ajuste de 50 g; balança integrada fica para depois | Q2 |
| H-P3 | Formas no balcão: dinheiro (com troco), Pix por QR com confirmação manual, débito e crédito na maquininha à parte | Q8, Q14 |
| H-P4 | Pagamento combinado em quantas partes forem precisas, até zerar o total | — |
| H-P5 | Desconto por atalhos (5%, 10%, R$ 5, arredondar) com motivo obrigatório | — |
| H-P6 | Cancelar venda exige senha de gestor; itens voltam ao estoque | H8 |
| H-P7 | Um caixa por aparelho: abertura com fundo de troco, sangria e suprimento com motivo, fechamento com contado × esperado | H9, Q5 |
| H-P8 | Comprovante por WhatsApp é opcional; nota fiscal não entra nesta versão | Q12 |

## Hipóteses usadas nas telas da Etapa 6 (Entregas) — a confirmar

| ID | Hipótese | Depende de |
|---|---|---|
| H-E1 | Entregador entra com celular e código pelo WhatsApp; só entra quem a casa cadastrou | Q11 |
| H-E2 | Entregador da casa recebe as entregas atribuídas e pode pegar as livres; parceiro vê só as publicadas e recebe por entrega | H7, Q11 |
| H-E3 | Coleta tem conferência (volumes, nota, se há algo a cobrar) antes de sair | — |
| H-E4 | Sem mapa nem rastreio em tempo real nesta versão: “Abrir no mapa” usa o app de mapas do celular | — |
| H-E5 | Entrega confirmada com o código de 4 números da cliente; sem código, vai para “Problema na entrega” | H6 |
| H-E6 | Devolução à loja paga metade ao parceiro (exemplo: R$ 4,50) | Q11 |
| H-E7 | Parceiro recebe por Pix semanal; entregador da casa, mensal | Q11 |

## Pendências

O que depende do dono para fechar o projeto. Nada disso bloqueou o design: cada item usou uma hipótese marcada (H-*) ou um marcador entre colchetes.

| ID | Pendência | Afeta | Onde ver |
|---|---|---|---|
| P1 | Pesquisa visual no Mobbin (exige plano pago); refazer e atualizar MOBBIN_REFERENCES.md | Acabamento visual | MOBBIN_REFERENCES.md |
| P2 | Responder Q1–Q16 | Regras de entrega, pagamento, produção, fiado, nota fiscal | BUSINESS_RULES.md |
| P3 | Logotipo oficial e fotos próprias (produtos e casa) | Loja, gestão | `[LOGO]`, `[FOTO DO PRODUTO]`, `[FOTO DA CASA]` |
| P4 | Conteúdo da casa: história, texto da Linha Bodeleve, compromisso da marca, endereço, horários, WhatsApp, CNPJ | Loja, configurações | Lista de marcadores abaixo |
| P5 | Conteúdo por produto: descrição, ingredientes, conservação, validade, modo de preparo | Loja, fichas | Lista de marcadores abaixo |
| P6 | Confirmar ou corrigir as hipóteses H-L*, H-G*, H-P*, H-E* | Todas as telas | Seções de hipóteses acima |
| P7 | Passada visual no canvas e teste com atendente, cliente e entregador | Ajustes finos | AUDIT.md (A1, A3) |
| P8 | Escolher provedor de pagamento (Pix/cartão) e de mensagens (WhatsApp) antes da implementação | Implementação | Q8, Q14 |

Marcadores de conteúdo nas telas:

| Marcador | Telas |
|---|---|
| [ENDEREÇO DA LOJA] | Ent-Detalhe, Gestao-Estabelecimento, Loja-Entrega, Loja-Sobre |
| [HORÁRIO DE FUNCIONAMENTO] / [HORÁRIO] | Loja-Entrega, Loja-Perfil, Loja-Sobre, Gestao-Estabelecimento |
| [WHATSAPP DA LOJA] | Gestao-Estabelecimento, Loja-Acompanhamento, Loja-Perfil |
| [CNPJ] | Gestao-Estabelecimento |
| [NOME DO DONO] | Gestao-Usuarios |
| [TEXTO DA CASA] / [HISTÓRIA DA CASA] | Loja-Inicio, Loja-Sobre |
| [TEXTO DA LINHA] / [COMPROMISSO DA MARCA] / [NA CASA OU POR PARCEIRO] / [PRÓXIMOS PRODUTOS DA LINHA] | Loja-Linha |
| [DESCRIÇÃO DO PRODUTO] / [INGREDIENTES] / [COMO CONSERVAR] / [PRAZO DE VALIDADE] | Loja-Produto, Gestao-Produto |
| [MODO DE PREPARO DA CASA] | Gestao-Ficha |
| [E-MAIL] / [CNPJ OU CPF] do fornecedor | Gestao-Fornecedor |
| [PLACA] / [CHAVE PIX] do entregador | Ent-Perfil |
| [LOGO], [FOTO DO PRODUTO], [FOTO DA CASA] | Várias (P3) |
| [MAPA DA ROTA], [QR CODE PIX] | Ent-Rota, PDV-Pagamento (gerados pelo sistema na implementação) |

## Alterações de decisões aprovadas

| Data | Decisão alterada | Mudança | Motivo |
|---|---|---|---|
| 2026-11-18 | P-A (paleta), P-B (fontes), P-C (fundos), P-J (tokens), P-L/P-M (estados e navegação) | Terracota, creme e Bricolage/Inter saem. Entram verde-folha (#0F7A43), verde-floresta, laranja e amarelo, neutros frios e Geist. Sombras e movimento curto passam a fazer parte do sistema. Tokens renomeados (`--cor-terracota` → `--cor-primaria`). PDV ganha coluna de navegação no computador; app de entregas vira coluna centralizada no computador | Pedido do dono (D18). `design/*.dc.html` mostram o visual antigo e deixam de ser referência de cor e fonte; seguem valendo para estrutura, textos e comportamento |
