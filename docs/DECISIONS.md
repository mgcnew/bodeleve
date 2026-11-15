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
| D14 | 2026-11-15 | Seguir até concluir todas as etapas sem parar; o que depender do usuário é documentado como pendência | Usuário |
| D18 | 2026-11-15 | Fase de implementação aprovada em `docs/IMPLEMENTATION_PLAN.md` (Vite + React + TypeScript; Supabase por trás de `services/`). Começa pela Etapa 2 (design system em componentes) | Usuário |
| D19 | 2026-11-15 | Banco de dados congelado até o dono conectar o Supabase ao Claude: nenhum projeto, migration, tabela, política, função ou seed é criado antes. A Etapa 1 do `CLAUDE.md` (Supabase) fica para depois; as telas leem `mocks/` por trás de `services/` | Usuário |
| D20 | 2026-11-15 | Implementação segue de fase em fase sem parar; o que depender do dono vai para as pendências abaixo e é revisto no fim | Usuário |
| D21 | 2026-11-15 | Pagamentos reais (Pix, cartão) e envio real de mensagens (WhatsApp) continuam fora até aprovação expressa; entram só como interfaces com versão simulada | Usuário |
| D22 | 2026-11-15 | Etapa 3 (loja) implementada em `app/`: 18 telas, checkout como convidado em 4 etapas, pedidos do aparelho e login por código de teste, tudo sobre serviços simulados (`app/src/mocks`). Sem pagamento real, sem mensagem real, sem banco | Usuário (D18–D21) |
| D23 | 2026-11-15 | Etapa 4 (Gestão) iniciada em `app/` pelo lote 1 de D13 — Entrar, Início, Pedidos, Pedido e Mais — sobre o mesmo banco simulado da loja: pedido feito na loja entra como novo na fila da gestão e o status volta para o cliente | Usuário (D18–D21) |
| D24 | 2026-11-15 | Etapa 4, lote 2 (Compras e Fornecedores) implementado: pedido de compra com sugestão pelo estoque mínimo, recebimento item a item com lote e validade, recebimento parcial, conta a pagar criada no recebimento, e modelo de estoque por movimentações (saldo nunca editável). Envio ao fornecedor só simulado | Usuário (D18–D21) |
| D25 | 2026-11-15 | Etapa 4, lote 3 (Estoque) implementado: visão geral, item (disponível = físico − reservado, projetado, lotes pelo que vence primeiro), movimentações com saldo, perda/consumo/correção e inventário por área. Início passa a calcular "estoque baixo" e "lotes vencendo" dos dados | Usuário (D18–D21) |

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

## Hipóteses de implementação — a confirmar

| ID | Hipótese | Depende de |
|---|---|---|
| H-I1 | App em `app/`, um único SPA com rotas por ambiente (`/`, `/gestao`, `/pdv`, `/entregas`). Vite em vez de Next.js: simples e bom para o PDV offline, mas a loja não tem renderização no servidor (pior para Google e pré-visualização de link no WhatsApp) | P9 |
| H-I2 | Fontes hospedadas junto do app (`@fontsource`), não carregadas do Google Fonts: funciona sem internet no PDV e não faz pedido a terceiros. Mesmas famílias e pesos do design | — |
| H-I3 | Trabalho em branches `claude/*`; nenhum PR aberto até o dono pedir | P10 |

## Comportamentos que o desenho não mostra — decididos no código (Etapa 3), a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I4 | Pix simulado: depois de confirmar, a tela mostra o marcador `[QR CODE PIX]` e o aviso "ainda não está ligado nesta versão. Nada foi cobrado". Some quando `storefront.pixProviderConnected` for ligado | ConfirmedPage · `config/storefront.ts` |
| H-I5 | CEP fora da área: aviso "Ainda não entregamos neste CEP. Você pode escolher retirar na loja." e o endereço não é aceito. No exemplo, CEPs começando com 99 ficam fora | AddressPage · `mocks/services.ts` |
| H-I6 | Login: código errado mostra "Código incorreto…". Em desenvolvimento vale o código de teste `1234` e um aviso diz que nada foi enviado | LoginPage |
| H-I7 | Campo de troco só liga quando a forma é "Dinheiro" e o valor precisa cobrir o total | PaymentPage |
| H-I8 | "Pedir de novo" soma os itens disponíveis ao que já está na sacola (não substitui) e deixa de fora os indisponíveis, avisando antes (H-L13) | OrderPage |
| H-I9 | Logo após confirmar, "Pedido recebido" já aparece concluído e "Em preparo" como etapa atual, como no quadro Pedido confirmado | `domain/orders.ts` |
| H-I10 | Acrescentar ao carrinho nos cartões mostra aviso temporário com "Desfazer" (componente do design system, ainda sem uso nos quadros da loja) | ProductGrid |
| H-I11 | Compra sem conta guarda sacola, contato e endereço neste aparelho (localStorage). Depois de confirmar, a sacola esvazia e contato e endereço ficam para a próxima compra | `store/bag.ts` |
| H-I12 | Computador (≥ 1024 px): topo com seções, busca e sacola; foto da casa aparece na faixa de abertura; grade de 4 colunas; checkout em coluna de até 560 px. "Produtos" no topo leva a Buscar (não há tela "todos os produtos") | LojaLayout |
| H-I13 | Pedidos de exemplo (1042, 1017, 0988) aparecem só em desenvolvimento; numeração de novos pedidos segue de 1043 | `main.tsx` · `mocks/services.ts` |

## Hipóteses de implementação da Gestão — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I14 | O quadro de permissões não cita Produtos nem Clientes: Produtos e categorias seguem o acesso de "Estoque"; Clientes seguem o de "Pedidos" | `permissions/index.ts` |
| H-I15 | Entregador não usa a Gestão: se entrar, vê "Entregadores usam o app de Entregas" (o app chega na Etapa 6) | `ui/gestao/GestaoLayout.tsx` |
| H-I16 | Quem entra cai na primeira tela que seu papel acessa (atendente cai em Pedidos) | `ui/gestao/modules.ts` |
| H-I17 | "Pedidos em aberto" do Início conta só o que pede ação da casa (novos + em preparo), como no quadro; prontos e em rota ficam nos filtros da lista | `mocks/adminServices.ts` |
| H-I18 | Vendas da internet no Início são a soma dos pedidos do dia (R$ 454,50 nos 6 pedidos de exemplo); o quadro mostra R$ 392,50, que não bate com a lista de pedidos do próprio quadro. Balcão, ontem, contas e alertas de estoque ainda são valores de exemplo até os módulos respectivos existirem | `mocks/adminSeed.ts` |
| H-I19 | Pedido da loja nasce "não pago" em qualquer forma de pagamento: sem provedor (D21) nada é cobrado nem confirmado | `mocks/services.ts` |
| H-I20 | Pedido pronto pode ser desfeito (volta para "Separando"); "Em rota" e "Entregue" virão da entrega (Etapa 6) | `domain/orderFlow.ts` |
| H-I21 | A lista de pedidos mostra só os abertos; concluídos ficam para o histórico/relatórios | `OrdersPage.tsx` |
| H-I22 | Em desenvolvimento, a entrada mostra as contas de exemplo e a senha `bodeleve`; nada disso aparece em produção | `pages/gestao/LoginPage.tsx` |

## Hipóteses de implementação de Compras e Estoque — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I23 | Sugestão de compra: item no estoque mínimo ou abaixo repõe até o dobro do mínimo (rapadura 4/12 → 20 un; melaço 6/6 → 6 un; açúcar acima do mínimo → 0). O quadro mostra 24 un para a rapadura; a regra de cálculo não está escrita | `domain/purchasing.ts` |
| H-I24 | Estoque baixo = no mínimo ou abaixo ("Estoque 6 un · mínimo 6" é baixo no quadro) | `domain/inventory.ts` |
| H-I25 | Pedido de compra criado no sistema é salvo como "Enviado" e a mensagem ao fornecedor é montada e guardada, mas não enviada (D21). A tela diz isso; pedidos de exemplo dizem "pelo WhatsApp" | `PurchasePage.tsx` · `mocks/adminServices.ts` |
| H-I26 | Recebimento: lote obrigatório; validade obrigatória só para item que vence; quantidade zero = item não chegou. A decisão "manter em aberto / encerrar" vale ao sair da tela | `domain/receiving.ts` · `ReceivingPage.tsx` |
| H-I27 | A conta a pagar nasce por recebimento (um recebimento parcial gera uma conta e o complemento, outra), com o valor do que chegou e vencimento pelo prazo do pedido | `domain/receiving.ts` |
| H-I28 | "Corrigir conferência" desfaz o recebimento (entrada, lotes e conta) enquanto nada saiu do lote e a conta não foi paga; depois disso a correção é por ajuste de estoque | `reverseLastReceipt` |
| H-I29 | A lista de compras põe em "Recebidos" todos os recebidos (4 nos dados de exemplo: os 2 do quadro Compras e os 2 do histórico do quadro Fornecedor) | `purchasing.tsx` |
| H-I30 | Itens de exemplo de PC-0053 e PC-0049 foram escolhidos para fechar os totais dos quadros (R$ 420,00 recebido e R$ 236,40) | `mocks/stockSeed.ts` |

## Hipóteses de implementação do Estoque — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I31 | Reservado = unidades dos pedidos online ainda na casa (novo, em preparo, pronto) + reservas feitas à mão; ao sair para entrega ou ser retirado, o pedido deixa de reservar e vira saída de venda (Etapas 5 e 6) | `domain/stock.ts` |
| H-I32 | O nível de estoque (baixo/sem) olha o disponível, não o físico: "Estoque baixo" = disponível no mínimo ou abaixo | `domain/stock.ts` |
| H-I33 | Há uma reserva manual de exemplo (3 un de queijo coalho, "Encomenda de sábado") para o reservado do quadro (6 un) fechar: os pedidos de exemplo reservam só 3 | `mocks/stockSeed.ts` |
| H-I34 | Os saldos de exemplo seguem o quadro Estoque pelo "disponível"; o físico inclui o reservado pelos pedidos abertos. Por isso o inventário mostra, em alguns itens, um "sistema" 1 un acima do quadro. Carne de sol é controlada por pacote de 500 g, não por kg | `mocks/stockSeed.ts` |
| H-I35 | Ajuste, perda e contagem nunca apagam histórico: "Desfazer" e "Corrigir contagem" lançam o movimento contrário. Perda/saída não passa do saldo do lote | `domain/stock.ts` |
| H-I36 | Inventário: a falta sai do lote que vence primeiro (pode atravessar lotes); a sobra entra no lote mais recente | `applyCount` |
| H-I37 | O valor do estoque é a soma de saldo × custo de cada lote ("R$ 2,0 mil" nos dados de exemplo; o quadro mostra R$ 8,4 mil com outros itens) | `stockValueCents` |
| H-I38 | "Registrar perda" na visão geral, sem item escolhido, abre o ajuste pedindo o item primeiro | `StockAdjustPage.tsx` |

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
| P9 | Decidir Vite × Next.js para a loja (H-I1): importa aparecer no Google e na pré-visualização de links? | Loja (Etapa 3) | IMPLEMENTATION_PLAN.md §1 |
| P10 | Aprovar o formato de entrega do código: branches `claude/*` e PR quando o dono pedir (H-I3) | Todas | — |
| P11 | Conectar o Supabase ao Claude e dizer em qual organização/região criar o projeto da Bodeleve (a conta só tem projetos de outro negócio, que não serão usados) | Etapa 1 do CLAUDE.md, tudo que for dado real | D19 |
| P12 | Passada visual no catálogo de componentes (`cd app && npm run dev`, ou `npm run build` e abrir `dist/`) comparando com os quadros `DS-*`; ver "Desvios" em DESIGN_SYSTEM.md | Etapa 2 | DESIGN_SYSTEM.md |
| P13 | Aprovar ou recusar os desvios de implementação listados em DESIGN_SYSTEM.md (alvo de 44 px no aviso, Inter 700, estados que o desenho não mostra) | Etapa 2 | DESIGN_SYSTEM.md |
| P14 | Desenhar e decidir o estado de Pix pendente (QR, copia e cola, validade, pago/expirado) e escolher o provedor | Loja · Pedido confirmado | H-I4, P8, Q8 |
| P15 | Confirmar a área de entrega e o texto de "CEP fora da área" (e se oferecer retirada na própria tela) | Loja · Endereço | H-I5, Q6 |
| P16 | Desenhar erros do login: código expirado, reenviar código, limite de tentativas, número inexistente | Loja · Entrar | H-I6, P8 |
| P17 | Decidir se "Produtos" no topo do computador deve levar a uma página com todos os produtos (hoje leva a Buscar) | Loja no computador | H-I12 |
| P18 | Passada visual da loja em celular, tablet e computador, inclusive checkout no tablet e a barra de sacola sobre as abas | Loja | AUDIT.md A1 |
| P19 | Status do pedido ao vivo para o cliente (e quem o muda na Gestão) | Loja · Acompanhamento | Etapa 7 |
| P20 | Confirmar o acesso de Produtos e Clientes por papel (H-I14) e se entregador deve ter qualquer tela na Gestão (H-I15) | Gestão | `permissions/` |
| P21 | Quadro "Pedidos" mostra internet R$ 392,50 e seis pedidos que somam R$ 454,50: dizer qual valor vale, ou corrigir o desenho | Gestão · Início | H-I18 |
| P22 | Desenhar o estado de pedido "aguardando pagamento do Pix" na fila da gestão e a regra de quando segue sem pagar | Gestão · Pedidos | H-I19, P14 |
| P23 | Confirmar a regra de sugestão de compra (H-I23): repor até o dobro do mínimo? usar média de vendas? | Gestão · Compras | H-I23 |
| P24 | Escolher o provedor de WhatsApp para enviar o pedido ao fornecedor (hoje só é guardado) | Gestão · Compras | P8, D21 |
| P25 | Os quadros Compras (2 recebidos) e Fornecedor (dois pedidos anteriores) não combinam: dizer se a lista de recebidos deve mostrar todo o histórico | Gestão · Compras | H-I29 |
| P26 | Informar, por fornecedor: contato, e-mail, CNPJ/CPF, prazo de entrega, condição de pagamento (hoje `[marcadores]` e valores de exemplo) | Gestão · Fornecedores | P4 |
| P27 | Informar o estoque mínimo de cada item (hoje valores de exemplo) e se Carne de sol e outros por peso serão controlados em kg | Gestão · Estoque | Q1, Q2, H-I34 |
| P28 | Fazer a primeira contagem real de estoque (lote e validade de cada item) para trocar o inventário de exemplo | Gestão · Estoque | Q1 |
| P29 | Confirmar a regra de reserva: ao aceitar o pedido, ou só ao pagar o Pix? E quando a reserva expira | Loja · Gestão | H-I31, Q8 |

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

Nenhuma até o momento.
