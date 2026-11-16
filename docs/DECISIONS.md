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
| D26 | 2026-11-15 | Etapa 4, lote 4 (Produção) implementado: ordens (em produção, planejadas, concluídas; para estoque ou para pedido), fichas técnicas com custo por unidade e margem, conferência de insumos (H-G17) e apontamento com consumo real, unidades boas, lote do acabado e custo real (H-G18) | Usuário (D18–D21) |
| D27 | 2026-11-15 | Etapa 4, lote 5 (Financeiro) implementado: saldo por conta (banco e caixa), contas que pedem ação hoje, previsão de 7 dias, contas a pagar e a receber, pagamento de conta (total ou em parte, com multa e juros, desfazível) e lançamentos. Contas de compra nascem no recebimento; despesas fixas se repetem todo mês | Usuário (D18–D21) |
| D28 | 2026-11-16 | Etapa 4, lote 6a implementado: Produtos (lista, filtros, busca), Produto (edição com custo, margem e publicação na loja), Categorias, Clientes e Cliente. O catálogo da loja passa a ser o que a gestão publica | Usuário (D18–D21) |
| D29 | 2026-11-16 | Etapa 4, lote 6b implementado — a Gestão está completa: Entregas e Atribuir entrega (próprio, reserva, parceiros), Relatórios e Relatório de vendas (hoje, 7 dias, mês), Configurações, A casa e Equipe e permissões. A loja passa a mostrar endereço, WhatsApp e horário preenchidos em A casa | Usuário (D18–D21) |
| D30 | 2026-11-16 | Etapa 5 (PDV) implementada: abrir caixa, vender (favoritos, categorias, busca, peso), sacola com desconto, pagamento (dinheiro com troco, Pix e cartão simulados), pagamento combinado, venda concluída com comprovante, vendas de hoje, detalhe com cancelamento por senha de gestor, caixa (sangria, suprimento, fechamento e reabertura). A venda baixa o estoque pelo lote que vence primeiro e lança no financeiro. Vendas sem conexão ficam guardadas no aparelho | Usuário (D18–D21) |
| D31 | 2026-11-16 | Etapa 6 (app de Entregas) implementada: entrar por celular e código, lista (disponíveis e minhas), detalhe e aceite, coleta, em rota, confirmação pelo código do cliente, problema com devolução, histórico e perfil; entregador da casa e parceiro. O painel da gestão acompanha cada etapa. Nenhuma mensagem é enviada (D21) | Usuário (D18–D21) |
| D32 | 2026-11-16 | Etapa 7 (acabamento): atualização ao vivo simulada entre abas (pedidos novos, status do pedido, entregas, caixa), PDV em tablet com sacola fixa, código da Gestão, do PDV e das Entregas carregado sob demanda. Frente de telas concluída; falta o Supabase (D19) | Usuário (D18–D21) |
| D33 | 2026-11-16 | D19 levantada: o dono conectou o Supabase e autorizou o SQL. Banco montado no projeto `afqcwqikkolyoowkozak` (migrations 1–9 em `supabase/migrations`): tabelas por estabelecimento, RLS por papel, escrita só por funções, Realtime. D21 continua valendo: nada de pagamento real nem mensagem real; mensagens ficam só em `outbox_messages` | Usuário |
| D34 | 2026-11-16 | Pedido online não baixa o estoque na compra: ele fica reservado até o entregador sair (ou a retirada). A devolução da entrega devolve ao mesmo lote. Venda de balcão baixa na hora. Cancelar venda do balcão estorna estoque e dinheiro por lançamentos contrários | Implementação (D19) |
| D35 | 2026-11-16 | Senha de gestor (cancelar venda) guardada só como hash, definida por cada gestor em `set_my_pin`; 5 erros em 10 minutos travam novas tentativas | Implementação (D19) |

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

## Hipóteses de implementação da Produção — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I39 | Ficha técnica por fornada em unidades de estoque, com conversão para a medida que a pessoa conhece (0,4 un de coalho líquido = 20 ml; 40 un de leite = 40 L). Custo da fornada = insumos pelo custo atual + gás e energia (R$ 142,00 no coalho) | `domain/production.ts` |
| H-I40 | Criar a ordem reserva os insumos que há; o que falta e chega hoje só avisa; o que falta sem compra a caminho deixa a ordem planejada (nunca bloqueia a criação) | `createOrder` |
| H-I41 | Consumo só baixa do estoque ao concluir (apontamento), pelo lote que vence primeiro; se faltar insumo, nada é lançado e a tela diz qual falta. No exemplo é preciso receber o leite do PC-0057 antes de concluir a OP-0032 | `finishOrder` |
| H-I42 | Custo real por unidade = (consumo real × custo dos lotes + gás e energia de cada fornada) ÷ unidades boas (19 un → R$ 14,95; previsto R$ 14,20). O lote novo guarda esse custo | `finishOrder` |
| H-I43 | Rendimento e perda: perda na produção = previsto − boas. Lote sugerido = próximo número do prefixo da ficha (QC-1113); validade sugerida = hoje + validade da ficha | `suggestLotCode` |
| H-I44 | "Corrigir apontamento" devolve os insumos e tira o lote acabado, enquanto nada saiu dele. Ordens de exemplo já concluídas não têm esse botão (não têm lançamentos) | `undoFinish` |
| H-I45 | "Em produção" entra no projetado do estoque (queijo coalho 12 + 20 = 32) e no indicador do Início; planejada não entra | `domain/stock.ts` |
| H-I46 | "Começar em": hoje (agora), amanhã 08h ou depois de amanhã 08h (o quadro tem um campo de texto). "Para um pedido" escolhe entre os pedidos online abertos. A OP-0034 de exemplo aponta para o pedido #1041 (o quadro cita #1045, número que a loja ainda vai gerar) | `RecipePage.tsx` |
| H-I47 | Ordem planejada tem "Iniciar produção" (não desenhado). As fichas de queijo manteiga, doce de leite e manteiga de garrafa têm insumos de exemplo escolhidos para fechar o custo por unidade do quadro | `mocks/stockSeed.ts` |


## Hipóteses de implementação do Financeiro — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I48 | Saldo agora = conta no banco + caixa (gaveta). Cada saldo é a soma dos lançamentos da conta; transferência entre caixa e banco (sangria) não conta como entrada nem saída | `domain/finance.ts` |
| H-I49 | A conta a pagar de uma compra nasce no recebimento da mercadoria (PC-0057 recebido cria R$ 622,00 "Criada hoje"). Receber de novo ou parcial usa o valor realmente recebido | `receiving.ts` |
| H-I50 | Pagar sai do banco por padrão; o caixa só paga o que tem (R$ 412,00): se não cobre, o botão fica bloqueado e a tela diz o saldo do caixa. Pagamento parcial é permitido e deixa o restante em aberto | `payEntry` |
| H-I51 | Multa e juros saem da mesma conta junto com o valor e entram nos lançamentos como parte da saída; o saldo "depois do pagamento" já os considera | `PayPage.tsx` |
| H-I52 | Despesa fixa paga lança a do mês seguinte (mesmo dia, +1 mês). "Desfazer" estorna o pagamento e remove a próxima enquanto ela não foi mexida; o histórico nunca é apagado | `payEntry`, `undoPay` |
| H-I53 | Previsão de 7 dias: parte do saldo de hoje, soma o que vence e o que se espera receber por dia; o atrasado entra em "Hoje". Mostra o saldo final e a data | `forecast` |
| H-I54 | Contas a receber (cartão de débito, fiado) aparecem em Contas e na previsão, mas ainda não têm baixa: a tela avisa. Liquidação de cartão e recebimento de fiado entram quando o PDV existir | `PayPage.tsx` |
| H-I55 | O comprovante é escolhido e o nome fica no lançamento; o arquivo ainda não é guardado (depende do armazenamento do Supabase) | `PayPage.tsx` |
| H-I56 | As cifras do Início (aluguel atrasado, 2 contas hoje, a pagar hoje, a receber na semana) saem das mesmas contas do Financeiro | `dashboard` |
| H-I57 | Acesso: dono e gestor veem o Financeiro; atendente, produção e entregador não (matriz H-G27) | `permissions/` |

## Hipóteses de implementação de Produtos e Clientes — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I58 | O cadastro do item (nome, medida, tipo, origem, categoria, mínimo, validade) é o do estoque; a gestão de produtos só acrescenta a venda: preço, publicar na loja, favorito no PDV, vendido por peso, descrição. Editar o produto edita o item do estoque | `domain/catalog.ts` |
| H-I59 | O campo Nome mostra "Queijo coalho 500 g". Ao salvar, a medida no fim volta para o campo próprio; sem ela, tudo vira nome | `splitLabel` |
| H-I60 | Custo do produto: da ficha técnica (feito na casa) pelo custo atual dos insumos; para revenda, o último recebimento. A margem do quadro Produto arredonda ao mais próximo (57%); a das fichas arredonda para baixo | `mocks/catalogView.ts` |
| H-I61 | Matéria-prima não tem origem, preço, loja nem favorito: a tela esconde esses campos e o salvar os zera | `applyProduct` |
| H-I62 | A loja mostra o que a gestão publicou, na ordem dos quadros, com a descrição escrita (ou o marcador entre colchetes). Categoria sem produto publicado não aparece na loja. Despublicar tira o produto também das seções do início | `mocks/services.ts` |
| H-I63 | Charque, flocão, fubá e melaço são vendidos só no balcão (preços de exemplo). Carne de sol fica na loja a R$ 34,90 por 500 g como no quadro da loja; o quadro Produtos a mostra "só balcão, por peso, R$ 59,90 / kg" | `mocks/catalogSeed.ts` |
| H-I64 | Categorias: só criar (nome vazio ou repetido é recusado). A etiqueta é "Nova" sem produtos e "Na loja" com produtos. Renomear, ocultar e reordenar não estão desenhados. "Insumos" é área interna do estoque e não aparece | `CategoriesPage` |
| H-I65 | Cliente = cadastro + pedidos pelo celular. Quem compra com um celular novo entra como cliente novo. Total comprado = soma dos pedidos não cancelados (com a taxa de entrega) + histórico anterior ao sistema. Os totais de exemplo foram ajustados para fechar com o quadro | `domain/customers.ts` |
| H-I66 | Etiqueta "Novo" = um pedido só. "Fiado R$ …" = contas a receber em aberto marcadas Fiado com o nome do cliente | `fiadoCents` |
| H-I67 | A observação interna é salva ao sair do campo. O texto de privacidade do quadro foi escrito sem flexão de gênero ("Quem comprou pode pedir para apagar a conta") | `customers.tsx` |
| H-I68 | O histórico da Maria Lima ganhou dois pedidos de exemplo (#1021 e #0997) para a lista do quadro; o contador do pedido na fila continua 5 | `mocks/seedOrders.ts` |

## Hipóteses de implementação de Entregas, Relatórios e Configurações — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I69 | Entregas: "Para sair" = pedidos de entrega ainda na casa (novo, em preparo, pronto) mais os já atribuídos que não saíram; "Em rota" e "Entregues" vêm das entregas registradas. Só o pedido pronto abre o Atribuir; retirada não entra | `domain/deliveries.ts` |
| H-I70 | Atribuir: entregador próprio livre recebe na hora; o que está em rota fica com a entrega reservada, para a próxima saída; parceiros avulsos recebem uma publicação por R$ 9,00 que volta para a casa se ninguém aceitar em 10 min. Desfazer vale até a entrega sair. O aviso a quem comprou e o aceite do parceiro dependem do app de entregas (Etapa 6) e não são enviados (D21) | `assign`, `config/delivery.ts` |
| H-I71 | Distância por bairro (Centro 1,8 km, Bairro Alto 4,1 km, Jardim das Flores 3,2 km) e "2 parceiros online" são exemplos; vêm da área de entrega (Q6) e do app de entregas | `config/delivery.ts` |
| H-I72 | Os pedidos 1038 e 1036 do quadro (entregues hoje) são registros de exemplo de entrega, sem pedido correspondente na base, para não mexer nas vendas do dia | `mocks/deliverySeed.ts` |
| H-I73 | Entregador não usa a Gestão (já era H-G27): tem o app próprio, na Etapa 6 | `GestaoLayout` |
| H-I74 | Relatórios: dias anteriores à base vêm de um histórico de exemplo por dia (valor por dia da semana, canal, pagamento, produtos); os dias seguintes vêm dos pedidos online e, no balcão de hoje, do exemplo do Início até o PDV existir. Pedido de dia coberto pelo histórico não é contado em dobro. Os números do quadro (R$ 14.326,80 etc.) são fictícios e não são reproduzidos | `domain/reports.ts`, `mocks/reportsSeed.ts` |
| H-I75 | Resumo do mês: perdas = movimentações de perda ainda valendo (desfeitas não contam) × custo do lote; produção = ordens concluídas no mês, rendimento = unidades boas ÷ planejadas; resultado = vendas do mês − todas as saídas de banco e caixa no mês (transferência é neutra) | `buildHub` |
| H-I76 | Exportar em planilha ou PDF não existe: as telas dizem isso em vez de prometer. A frase "Sexta e sábado vendem mais" do quadro foi retirada por ser um achado que depende dos dados | `reports.tsx` |
| H-I77 | A casa: nome, CNPJ, endereço, WhatsApp e três horários. Só o nome é obrigatório; CNPJ (14 números) e WhatsApp (DDD + número) são conferidos se preenchidos. O que está vazio continua como marcador entre colchetes na loja | `domain/settings.ts` |
| H-I78 | Equipe: 6 pessoas e 5 papéis de exemplo (Bruno entrou como entregador). Os papéis usam os nomes da matriz H-G27 ("Gestor"), sem flexão de gênero. Convidar só registra o convite como pendente: nenhum e-mail sai (D21) e a pessoa ainda não consegue entrar | `settings` |
| H-I79 | Só o dono acessa Configurações (módulo "Equipe e configurações"). A matriz "O que cada papel vê" é lida da mesma regra de acesso da interface | `permissions/` |

## Hipóteses de implementação do PDV — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I80 | Preço por kg separado do preço da embalagem: o produto "vendido por peso" tem um preço do kg só para o balcão. Carne de sol: R$ 34,90 a embalagem de 500 g na loja online e R$ 59,90 / kg no balcão (resolve a divergência P39). O peso vira unidades de estoque pela embalagem (0,75 kg de um item de 500 g = 1,5 un). Entrou o feijão de corda (só balcão, por peso) porque aparece nos quadros | `domain/units.ts`, `weightPriceCents` |
| H-I81 | Estoque da venda: sai do lote que vence primeiro e passa para o próximo se acabar. Não vende acima do disponível (físico menos o reservado a pedidos online): o toque avisa "Só há 12 un…" e o pagamento recusa se o saldo mudou no meio | `pickLots`, `checkout` |
| H-I82 | Dinheiro: atalhos Exato, a próxima dezena, mais dez e o próximo múltiplo de 50, mais um campo "Outro valor" (não desenhado). Pix mostra só o marcador [QR CODE PIX] e o cartão manda passar na maquininha: nada é cobrado nem conferido (D21); quem opera confirma à mão | `PaymentPage` |
| H-I83 | Desconto: 5%, 10%, R$ 5,00 ou arredondar (tira os centavos), com motivo da lista do quadro. Não há limite nem aprovação (não desenhado). É recalculado se a sacola mudar | `discountCents` |
| H-I84 | Cancelar venda: senha de gestor de TESTE (Ana 2468, dono 1357) no lugar da conferência da conta de um gestor; devolve os itens ao lote de onde saíram, tira o dinheiro do caixa e o Pix do banco e diz por onde devolver. O estorno ao cliente é manual. Só cancela a venda inteira | `MOCK_MANAGER_PINS`, `cancelSale` |
| H-I85 | Caixa: totais = base do dia (20 vendas anteriores ao sistema registrar uma a uma, exemplo) + vendas registradas. Esperado na gaveta = troco de abertura + vendas em dinheiro + suprimentos − sangrias. "Levar ao banco" é transferência caixa → banco; as outras sangrias saem do caixa. Fechar lança a diferença no caixa do financeiro (o saldo passa a ser o contado); reabrir desfaz | `domain/pos.ts` |
| H-I86 | O Pix de balcão entra na conta do banco na hora da venda (confirmação manual, sem conciliação). Venda em dinheiro entra no caixa pelo valor sem o troco. Cartão ainda não gera conta a receber | `checkout` |
| H-I87 | O comprovante por WhatsApp é só registrado (D21); a tela diz que o envio não está ligado | `sendReceipt` |
| H-I88 | O Início e os Relatórios somam as vendas de balcão registradas ao exemplo do dia (26 vendas, R$ 892,00); pagamentos por forma seguem o quadro do Caixa (dinheiro R$ 312,00, Pix R$ 197,60, cartão R$ 382,40) | `todayCounter` |
| H-I89 | Conexão ruim: a sacola fica no aparelho; as consultas do balcão rodam sem rede; venda feita sem conexão fica marcada "Não enviada" e é enviada quando a conexão volta. Com o Supabase isso vira fila de envio real, com tratamento de conflito de estoque entre aparelhos | `useOnline`, `syncPending` |
| H-I90 | Abertura: o valor do troco é editável além dos atalhos R$ 100, 150 e 200. Fechar o caixa pede confirmação (modal). Cancelar a venda também | `OpeningPage`, `CashPage` |
| H-I91 | Favoritos = os 8 do quadro, na ordem do estoque (a do quadro não é ordenável ainda). Produto sem estoque aparece "sem estoque" e avisa ao tocar. Todo usuário com acesso ao PDV (dono, gestor, atendente) abre e fecha o caixa | `SellPage` |

## Hipóteses de implementação do app de Entregas — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I92 | Só entra quem a casa cadastrou (entregadores próprios e parceiros), pelo celular e um código de 4 números. O código é de teste (1234) e não é enviado por WhatsApp (D21); em desenvolvimento a tela mostra qual usar. Os entregadores e celulares de exemplo estão em `config/delivery.ts` e passam a vir do cadastro de equipe (P47) | `CourierLoginPage`, `config/delivery.ts` |
| H-I93 | Dois passos para ficar com uma entrega: na lista, "Pegar esta entrega" (da casa) ou "Aceitar por R$ 9,00" (parceiro) torna a entrega dela ou dele; no detalhe, "Aceitar" confirma (a gestão vê "Aceita"). A atribuição feita pelo balcão cai direto no segundo passo. O quadro mostra um botão só em cada lugar | `take`, `accept` |
| H-I94 | Entregador da casa vê os pedidos prontos sem entregador; parceiro só os publicados pela casa. Quem está em rota e pega outra fica com ela reservada. Fora do turno não vê nem pega e some das opções do balcão | `visibleTo` |
| H-I95 | "Saí da loja" leva a entrega para Em rota e o pedido para "saiu para entrega" (quem comprou vê no acompanhamento). Previsão = km × 3 min e volta 10 min depois (exemplos). O quadro diz "cliente avisada às 15h44": como nada é enviado, a tela diz que o pedido está a caminho no acompanhamento da loja | `depart` |
| H-I96 | Entrega: o código de 4 números é o do pedido, e o app nunca o recebe: só informa o que ouviu e o serviço confere. Pedido a pagar na porta (dinheiro ou cartão) passa a pago ao entregar; o repasse desse dinheiro à loja não é registrado | `confirm` |
| H-I97 | Problema: cinco motivos do quadro; "Devolver à loja" volta o pedido a pronto e a gestão atribui de novo; "Desfazer" vale enquanto ninguém atribuiu outra vez. "Quem comprou não tem o código" abre o problema com esse motivo. A foto do local ainda não é guardada | `reportProblem`, `undoProblem` |
| H-I98 | Histórico do dia: entregas, devoluções e km rodados (por bairro, tabela de exemplo). Parceiro vê R$ 9,00 por entrega e R$ 4,50 por devolução e o total a receber; entregador da casa vê só a conferência | `historyOf` |
| H-I99 | Perfil: "Disponível para entregas" liga e desliga; parceiro guarda a chave Pix (só guardada, sem pagamento) | `ProfilePage` |
| H-I100 | Mapa e rastreio: marcador [MAPA DA ROTA]; "Abrir no mapa" usa o app de mapas do celular e "Ligar" usa o telefone. Sem rastreio em tempo real | `RoutePage` |

## Hipóteses de implementação do acabamento — a confirmar

| ID | O que foi feito | Onde |
|---|---|---|
| H-I101 | Atualização ao vivo simulada: o banco simulado fica no navegador e o evento `storage` avisa as outras abas; as telas abertas se atualizam sozinhas (pedido novo na fila da gestão, status do pedido para quem comprou, entrega publicada para o parceiro). Cada aviso diz o assunto (pedidos, entregas, estoque, caixa), mas hoje a raiz atualiza tudo. Com o Supabase vira canal Realtime por tabela, sem mudar as telas | `RealtimeService`, `mocks/realtime.ts`, `AppRoot` |
| H-I102 | PDV em tablet (a partir de 768 px): grade de 4 colunas e sacola fixa à direita, com "Cobrar" e "Limpar sacola"; no celular a sacola é a barra de baixo. O peso abre em janela central (já era o comportamento da folha) | `ui/pdv/pdv.module.css` |
| H-I103 | Gestão, PDV, Entregas e o catálogo do design system carregam sob demanda, então quem entra na loja baixa só o pacote principal (de 786 kB para 520 kB; 159 kB comprimido). A loja ainda não é dividida por página | `app/routes.tsx` |
| H-I104 | Telas e consultas do balcão e das entregas rodam sem esperar a rede (o armazenamento é local); a revisão de políticas RLS e a de desempenho com `get_advisors` ficam para quando o Supabase existir | `networkMode: 'always'` |
| H-I105 | Modo demonstração (`config/preview.ts`): dados de exemplo, avisos com as contas e códigos de teste e a página `/atalhos` ligam em desenvolvimento e em quem montar com `VITE_PREVIEW=1`; nunca em produção. `VITE_ROUTER=memory` navega só por dentro do app, para hospedar a demonstração onde não há endereço próprio | `config/preview.ts`, `app/routes.tsx`, `pages/Launcher.tsx` |

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
| P19 | Status do pedido ao vivo para o cliente (e quem o muda na Gestão). Na simulação já atualiza entre abas (H-I101); falta o Realtime real | Loja · Acompanhamento | H-I101, P60 |
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
| P30 | Passar as fichas técnicas reais (insumos, quantidades, rendimento, validade, modo de preparo) para trocar as de exemplo | Gestão · Produção | Q3, P5 |
| P31 | Definir o custo de gás e energia por fornada (hoje R$ 3,00 de exemplo) e se entra no custo do produto | Gestão · Produção | H-G19 |
| P32 | Confirmar se produção deve poder ser concluída com consumo acima do estoque (hoje bloqueia) e se perda tem motivo | Gestão · Produção | H-I41 |
| P33 | Desenhar o estado "ordem planejada" (iniciar produção) e o cancelamento de ordem | Gestão · Produção | H-I47 |
| P34 | Desenhar a baixa de contas a receber (liquidação de cartão, recebimento de fiado) e o lançamento manual de despesa ou receita | Gestão · Financeiro | H-I54 |
| P35 | Decidir onde guardar o comprovante (armazenamento) e por quanto tempo | Gestão · Financeiro | H-I55 |
| P36 | Confirmar se pagamento parcial e multa/juros devem existir, e a categoria financeira de cada despesa (hoje só Compras e Insumos de exemplo) | Gestão · Financeiro | H-I50, H-I51 |
| P37 | Passar as despesas fixas reais (aluguel, energia, gás, internet, folha) com dia de vencimento e valor, e as regras de cartão (prazo, taxa) | Gestão · Financeiro | Q6, H-I53 |
| P38 | Passar o cadastro real de produtos (nome, medida, preço, origem, categoria, foto) e a descrição de cada um; hoje as fotos são o marcador [FOTO DO PRODUTO] e o envio de imagem depende do armazenamento do Supabase | Gestão · Produtos | H-I58, P5 |
| P39 | Resolver a divergência da carne de sol: loja a R$ 34,90 por 500 g × Produtos "só balcão por peso R$ 59,90 / kg". Definir também como o PDV vende por peso | Gestão · Produtos · PDV | H-I63 |
| P40 | Desenhar criação de produto novo, renomear, ocultar e reordenar categorias, e a edição do cadastro do cliente | Gestão · Produtos · Clientes | H-I64 |
| P41 | Definir o apagamento de dados do cliente (pedido do titular) e o que fica nos pedidos antigos | Gestão · Clientes | H-I67 |
| P42 | Confirmar quem acessa Produtos e Clientes (hoje Produtos = Estoque e Clientes = Pedidos) | Gestão · Permissões | H-I14 |
| P43 | Confirmar a área de entrega por bairro (distância e taxa) e o valor e as regras do parceiro avulso (R$ 9,00, prazo de 10 min, como aceita e como é pago) | Entregas | Q6, H-I70, H-I71 |
| P44 | Decidir como o entregador próprio é avisado e como a pessoa que comprou é avisada quando o pedido sai (WhatsApp ou app), já que nada é enviado ainda | Entregas · Mensagens | D21, H-I70 |
| P45 | Definir quais relatórios o dono quer de verdade (vendas, produtos, estoque e perdas, produção, resultado) com as perguntas que cada um responde, e o formato de exportação (planilha e PDF) | Relatórios | H-I74, H-I76 |
| P46 | Passar os dados reais da casa: nome, CNPJ, endereço, WhatsApp, horários e o logotipo aprovado | Configurações · A casa | H-I77, P5 |
| P47 | Definir o convite de equipe: e-mail de convite, criação de senha, remover ou trocar o papel de alguém, e permissão por pessoa (hoje papéis fixos) | Equipe | H-I78, H-G27 |
| P48 | Decidir a nota fiscal (se emite, qual sistema) e quando a configuração entra | Configurações | Q12 |
| P49 | Trocar a senha de teste do gestor pela conferência de uma conta de gestor, e definir limite de desconto e quem pode dar | PDV | H-I83, H-I84 |
| P50 | Cartão no balcão: maquininha, taxas, prazo de liquidação e como vira conta a receber no financeiro | PDV · Financeiro | Q6, H-I86 |
| P51 | Pix de balcão: provedor, QR de verdade e conferência automática do recebimento (hoje só marcador e confirmação manual) | PDV | D21, P8 |
| P52 | Comprovante e nota fiscal: impressão, WhatsApp e nota ao consumidor | PDV | Q12, H-I87 |
| P53 | Funcionamento sem conexão de verdade (vários aparelhos, conflito de estoque, fila de envio) e leitura de balança | PDV | H-I89 |
| P54 | Cancelamento parcial, troca e devolução; vários caixas ao mesmo tempo; quem pode abrir e fechar o caixa | PDV | H-I84, H-I91 |
| P55 | Login real do entregador (envio do código por WhatsApp) e cadastro de entregadores e parceiros pela gestão, com aprovação e documentos do parceiro | Entregas | H-I92, P8, P47 |
| P56 | Avisar quem comprou quando o pedido sai e quando é entregue (WhatsApp ou push), e avisar entregadores quando há entrega nova | Entregas · Mensagens | D21, H-I95 |
| P57 | Mapa da rota, rastreio em tempo real e foto como prova de entrega ou de problema | Entregas | H-I97, H-I100 |
| P58 | Pagamento do parceiro (Pix toda segunda) e prestação de contas do dinheiro cobrado na porta | Entregas · Financeiro | H-I96, H-I98 |
| P59 | Publicação para parceiros com prazo de verdade (10 min) e como o parceiro é notificado | Entregas | H-I70, H-I94 |
| P60 | Ligar o Realtime de verdade (Supabase) nos pontos H-I101 e decidir o que deve avisar com som ou vibração no balcão e no app de Entregas | Etapa 1 · Todas | H-I101 |
| P61 | Revisar as políticas RLS por papel e o desempenho (`get_advisors`) depois de criar as tabelas; trocar as senhas e códigos de teste por autenticação real | Etapa 1 | D19, H-G27 |
| P62 | Passada com leitor de tela (A2) e teste de uso real com atendente, entregador e cliente em aparelho de verdade | Todas | AUDIT.md, P7 |

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

Nenhuma decisão D* foi mudada. Na implementação troquei **textos dos quadros** que prometiam algo que o sistema ainda não faz (D21) ou que presumiam dado que não existe; cada um segue o motivo abaixo e pode voltar ao texto do quadro quando a funcionalidade existir. Os papéis e o que cada um acessa (H-G27) não mudaram.

| Quadro | Texto do quadro | Texto no app | Motivo |
|---|---|---|---|
| Equipe e permissões | "Convite enviado. A pessoa cria a senha pelo link do e-mail." | "Convite registrado para … O envio do e-mail ainda não está ligado nesta versão." | Nada é enviado (D21) |
| Equipe e permissões | Papel "Gestora" | "Gestor" (o nome do papel em H-G27) | Os papéis são fixos; o gênero não vem do cadastro |
| Venda concluída (PDV) e Em rota (Entregas) | "Comprovante enviado." e "Cliente avisada às 15h44" | "Comprovante registrado. O envio por WhatsApp ainda não está ligado nesta versão." e "Pedido a caminho desde 15h44 no acompanhamento da loja." | Nada é enviado (D21) |
| Relatórios e Relatório de vendas | "Todos os relatórios exportam em planilha (.xlsx) e PDF." e "Exportar … fica no menu de compartilhar do aparelho." | "A exportação em planilha (.xlsx) e PDF ainda não está disponível nesta versão." | A exportação não existe (P45) |
| Relatório de vendas | "Sexta e sábado vendem mais." | Retirado | É um achado que depende dos dados reais (H-I76) |
| Cliente | "A cliente pode pedir para apagar a conta." | "Quem comprou pode pedir para apagar a conta." | Texto sem gênero, para qualquer cliente |
| Confirmar entrega, Problema na entrega | "Peça o código à cliente", "A cliente não tem o código", "a loja e a cliente foram avisadas", "Código não confere. Confira com a cliente." | Mesmas frases com "quem comprou" | Mesmo motivo, e nada é enviado (D21) |
| Entrar (Entregas) | "Código enviado para …" | Igual, com aviso em desenvolvimento de que nada foi enviado e qual código usar | D21 |
| Produto (Gestão) | Um campo de preço | Preço da embalagem e, para produto por peso, o preço do kg (H-I80) | A loja e o balcão precificam diferente (P39) |

## Pendências do banco (novas)

- **Dono entrar no sistema:** falta o e-mail de login do dono para criar o convite de `owner` na casa. Depois, em Supabase → Authentication, desligar o cadastro público (sign-ups) para só quem foi convidado entrar.
- **Login do entregador por celular:** o código por SMS/WhatsApp é mensagem real (D21). `courier_link` já liga o celular ao cadastro; falta aprovar o envio e escolher o provedor.
- **Código de entrega (H-E5):** `courier_confirm` ainda não limita tentativas erradas; limitar antes de abrir ao público.
- **Dinheiro cobrado na porta:** a entrega confirmada marca o pedido como pago, mas ainda não lança o dinheiro no financeiro (acerto com o entregador depende de Q-pagamento).
- **Senhas de gestor:** cada gestor define a sua pelo app (`set_my_pin`); não há senha padrão.
- **Seed:** nenhum dado de exemplo foi colocado no banco real. Só a casa `bodeleve` e as duas contas (banco e caixa) existem.
