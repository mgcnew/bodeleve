# MOBBIN_REFERENCES — Bodeleve

## Status: pesquisa no Mobbin NÃO realizada

Em 2026-11-14 o conector do Mobbin recusou as 14 buscas tentadas (screens, flows e sections) com a mensagem "Mobbin MCP requires a paid plan". **Nenhuma tela do Mobbin foi vista. Nenhuma referência do Mobbin consta neste documento.**

Por decisão do usuário, a Etapa 1 usou **pesquisa pública na web** como substituta. Limite importante: as fontes abaixo são pesquisa de usabilidade, documentação oficial dos produtos e matérias — descrevem comportamento; **não são análise de telas vistas**. Quando o plano do Mobbin estiver ativo, refazer a pesquisa visual e atualizar este arquivo (pendência P1 em DECISIONS.md).

Buscas previstas para quando o Mobbin estiver disponível: grocery home, product details, cart, checkout com entrega/retirada, order tracking, merchant dashboard, inventory list, order management, transactions list, POS checkout, POS payment, driver delivery details, flow de grocery checkout, hero de marca de alimentos.

---

## 1. E-commerce e catálogo

| Referência | Fonte | O que funciona | O que não serve ao Bodeleve | Padrão adotado |
|---|---|---|---|---|
| Baymard — benchmark de mercado online (10 sites e apps) | https://baymard.com/research-articles/grocery-ecommerce-benchmark | Mostra que carrinho e checkout são a área de pior desempenho do setor: é onde vale investir | Benchmark de grandes redes dos EUA e Europa; sortimento de milhares de itens | Checkout é o fluxo nº 1 do protótipo da loja |
| Baymard — estudo de mercado online (teste com usuários) | https://baymard.com/research-articles/grocery-site-ux-launch | Adicionar à sacola direto da página inicial (observado no Instacart); caminho para comprar sempre evidente | "Loja dentro da loja" confunde: site institucional separado do site de compra | Botão de adicionar no cartão do produto; institucional e loja no mesmo app |
| Baymard — checkout como convidado | https://baymard.com/blog/current-state-of-checkout-UX | Convidado como opção mais visível, em botão, acima do login | — | Tela "Identificação" com "Continuar sem conta" como ação principal |
| Baymard — abandono de carrinho | https://baymard.com/learn/reduce-cart-abandonment | Custos extras descobertos no fim são a principal causa de abandono | — | Taxa de entrega estimada já na sacola |
| Baymard — delivery e retirada | https://baymard.com/research-articles/food-delivery-takeout-launch | Seleção de data e horário em camadas (dia, depois horário), observada no Walmart; banner "instale o app" atrapalha no mobile | Cardápio de restaurante com montagem de prato | Entrega/retirada em dois passos curtos; sem banners sobre a navegação |
| iFood Mercado — listas de compras | https://canaltech.com.br/apps/como-criar-e-salvar-uma-lista-no-ifood/ | Lista salva reaproveitada em nova compra; aviso de item indisponível | Marketplace de vários mercados | "Recomprar" a partir de um pedido anterior, com aviso de indisponível |
| Rastreamento de pedido | https://baymard.com/research-articles/integrate-tracking-info | Acompanhar dentro da própria loja, sem mandar o cliente para site de terceiros | Rastreio por transportadora | Linha do tempo vertical própria, com previsão no topo |

**Não serve / evitar**: exigir cadastro para ver catálogo ou comprar; home de marketplace com dezenas de carrosséis; substituição automática de item (só faz sentido com sortimento grande — pendência Q9).

## 2. Gestão administrativa

| Referência | Fonte | O que funciona | O que não serve ao Bodeleve | Padrão adotado |
|---|---|---|---|---|
| Shopify — app mobile, tela inicial | https://help.shopify.com/en/manual/shopify-admin/shopify-home | Poucas métricas no topo, escolhidas pelo usuário; cartões de tarefa ligados a pedidos que pedem ação | Sessões e taxa de conversão como métricas padrão; cartões de recomendação e promoção | Início = indicadores do dia + lista "pede ação hoje" |
| Shopify — reclamações da comunidade | https://community.shopify.com/t/request-bring-back-one-click-access-to-sales-breakdowns/313717 | (contraexemplo) lojistas pedem de volta o acesso em um toque à quebra de vendas por canal | — | Vendas do dia abrem direto em balcão × internet |
| Shopify — gestão de pedidos no celular | https://www.shopify.co.uk/blog/mobile-order-management-fulfillment | Notificação de novo pedido e ação de preparo no próprio celular; leitura de código de barras para estoque | Compra de etiqueta de envio | Pedido novo → preparar → pronto, direto da lista |
| Shopify PDV — estoque | https://pt.shopify.com/pdv/recursos | Aviso de estoque baixo; pedido de compra com recebimento | Multi-local e transferência entre lojas | Estoque baixo no Início; recebimento como etapa do pedido de compra |

**Limitação**: não foi encontrada referência pública boa de **produção com ficha técnica** em app mobile. As telas de Produção serão fundamentadas em princípios (uma decisão por tela, quantidades grandes, confirmação explícita de consumo) e validadas em protótipo.

## 3. Frente de caixa

| Referência | Fonte | O que funciona | O que não serve ao Bodeleve | Padrão adotado |
|---|---|---|---|---|
| Square POS — grade de itens | https://squareup.com/help/us/en/article/8334-set-up-item-grid | Página de Favoritos montada pela loja; um toque adiciona o item; bloco mostra o estoque | Edição da grade só em outro aparelho (no iPhone) | Aba Favoritos como tela inicial do PDV |
| Square POS — redesenho | https://squareup.com/us/en/the-bottom-line/inside-square/square-pos-redesign | Alternância rápida entre teclado, biblioteca e favoritos | Teclado de valor avulso como aba principal | Abas Favoritos · Categorias · Buscar |
| Square POS — venda em retrato | https://api.squareup.com/help/ie/en/article/7232-reintroducing-square-point-of-sale | No celular em pé, a venda atual fica atrás de um botão "revisar venda" | — | Barra de sacola fixa com total; toque abre a sacola |
| Loyverse POS — turno | https://mwm.ai/apps/loyverse-pos-point-of-sale/1070865387 | Resumo do turno com entradas, saídas e valor esperado em dinheiro | Programa de pontos | Fechamento de caixa: esperado × contado × diferença |

**Limitação**: nenhuma das fontes documenta bem **venda por peso** nem **pagamento combinado** em celular. Serão desenhados por princípio e testados no protótipo.

## 4. Entregas

| Referência | Fonte | O que funciona | O que não serve ao Bodeleve | Padrão adotado |
|---|---|---|---|---|
| iFood para Entregadores | https://reportei.com/portal-do-entregador-no-ifood/ | Distância e ganho visíveis antes de aceitar; etapas da rota acompanhadas uma a uma | Convites em tempo real para uma frota aberta | Cartão de entrega com bairro, distância e valor antes do aceite |
| iFood — aceitar e entregar | https://saipos.com/ifood/ifood-para-entregadores | Aceite por deslizar; sequência aceitar → coletar → iniciar → entregar | — | Uma ação principal por etapa; aceite por deslizar |
| iFood — códigos de coleta e entrega | https://saipos.com/integracoes/entrega-facil | Código na coleta e código de 4 dígitos na entrega; rota de devolução | — | Confirmação por código do cliente; fluxo "Problema na entrega" com devolução |
| iFood — código de entrega do cliente | https://canaltech.com.br/apps/como-trocar-o-codigo-de-entrega-do-ifood/ | Código mostrado ao cliente na tela de acompanhamento | Código fixo derivado do telefone (o próprio iFood passou a permitir trocar) | Código gerado por pedido, exibido no acompanhamento |

## 5. Identidade e padrões de navegação

| Referência | Fonte | O que funciona | O que não serve ao Bodeleve | Padrão adotado |
|---|---|---|---|---|
| Material Design — barra inferior | https://material.io/components/bottom-navigation | 3 a 5 destinos de mesmo peso; rótulos curtos; sem rolagem | — | Loja 4 · Gestão 5 · PDV 3 · Entregas 3 |
| NN/g — bottom sheet | https://www.nngroup.com/articles/bottom-sheet/ | Para informação temporária e dispensável; "voltar" fecha a sheet | Usar sheet "porque fica perto do polegar" | Sheets só para escolhas curtas |
| Yle Design System — bottom sheet | https://design-system.test.yle.fi/docs/components/BottomSheet/ | Não usar para confirmação crítica nem fluxo de vários passos | — | Pagamento e confirmação de entrega em tela cheia |

**Limitação**: a pesquisa de **marca de alimentos / mercearia premium** não foi feita — é essencialmente visual e dependia do Mobbin. A direção visual em DESIGN_SYSTEM.md parte das cores do briefing e de contraste medido, não de referências de marca.
