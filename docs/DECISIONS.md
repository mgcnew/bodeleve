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
| D13 | 2026-11-14 | Etapa 3 (loja) considerada aprovada ("continue"); Etapa 4 (gestão) iniciada em lotes; lote 1 = Entrar, Início, Pedidos, Pedido, Mais; lote 2 = Compras e Fornecedores; lote 3 = Estoque; lote 4 = Produção | Usuário |

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
| H-G6 | "A receber" inclui cartões a liquidar e fiado | Q13 |

## Pendências

| ID | Pendência | Bloqueia |
|---|---|---|
| P1 | Refazer a pesquisa visual no Mobbin quando o plano estiver ativo e atualizar MOBBIN_REFERENCES.md | Refinamento visual da Etapa 2 |
| P2 | Respostas às questões Q1–Q16 | Ver BUSINESS_RULES.md; Q2, Q3, Q6–Q8 pesam nas Etapas 3–5 |
| P3 | Logotipo e material fotográfico próprios | Etapa 3 (loja) |

## Alterações de decisões aprovadas

Nenhuma até o momento.
