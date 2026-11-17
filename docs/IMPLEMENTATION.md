# IMPLEMENTATION — estado da implementação

Os quatro ambientes estão implementados em `app/` (React + Vite + TypeScript). **A gestão, o PDV, o app do entregador e a loja já falam com o Supabase** (login, pedidos, estoque, compras, produção, financeiro, entregas, produtos, clientes e caixa); sem `app/.env.local` o app roda com dados de exemplo no aparelho. Faltam o convite por e-mail e as configurações de loja, pagamentos e nota fiscal. Este documento diz o que existe, o que é simulado e o que depende de você.

## Telas

| Ambiente | Rota | Telas | Situação |
|---|---|---|---|
| Loja online | `/` | 18 | Completa, com checkout sem conta |
| Gestão | `/gestao` | 36 | Completa |
| PDV | `/pdv` | 12 (em 9 quadros) | Completo |
| Entregas | `/entregas` | 9 | Completo |

## Como entrar para testar

- **Gestão e PDV com o Supabase ligado**: `/gestao/entrar` com o usuário de teste de desenvolvimento (papel gestor), cujo e-mail e senha ficam só no seu `app/.env.local` (`VITE_DEV_STAFF_EMAIL` e `VITE_DEV_STAFF_PASSWORD`) e preenchem o formulário no modo dev. Sem o Supabase, qualquer e-mail com `@` e senha de 4+ caracteres entra como dono.
- **Entregas**: com o Supabase, `/entregas/entrar` com o entregador de teste (e-mail e senha em `VITE_DEV_COURIER_EMAIL` e `VITE_DEV_COURIER_PASSWORD` no `app/.env.local`, vinculado ao Bruno pelo celular). Atenção: o login do entregador e o da gestão usam a mesma sessão do navegador, então entrar em um sai do outro (em celulares diferentes não acontece). Sem o Supabase: celular cadastrado — Bruno `(00) 90000-0300`, Carlos `(00) 90000-0310`, Diego `(00) 90000-0301` (parceiro) — e qualquer código de 4 números.
- **Cancelar venda no PDV**: com o Supabase, a senha numérica do gestor (a de teste está em `VITE_DEV_MANAGER_PIN` no `app/.env.local`); sem ele, qualquer senha numérica de 4 ou mais dígitos.

Para voltar aos dados de exemplo, apague as chaves `bodeleve.*` do `localStorage` do navegador.

## Como os dados estão organizados

`app/src/lib/store.ts` cria um estado compartilhado e persistido no aparelho. Cada `*Store` faz o papel de uma ou mais tabelas de `DATA_MODEL_DRAFT.md`:

| Store | Arquivo | Vira no Supabase |
|---|---|---|
| `itemsStore` | `services/gestao/backoffice.ts` | `products` (item de estoque e produto de venda ainda são o mesmo registro) |
| `stockStore` (lotes e movimentações) | idem | `product_lots`, `stock_movements`. O saldo **não é coluna**: deriva dos movimentos (`services/gestao/stock.ts`) |
| `suppliersStore`, `purchasesStore` | idem | `suppliers`, `purchase_orders` (+ itens e recebimentos) |
| `recipesStore`, `productionStore` | idem | `recipes`, `production_orders` (+ consumos) |
| `accountsStore`, `ledgerStore`, `entriesStore` | idem | `financial_accounts`, lançamentos, `financial_entries` |
| `staffOrdersStore` | `services/gestao/orders.ts` | `orders` + `order_items` (a loja, o balcão e a gestão leem o **mesmo** pedido) |
| `categoriesStore`, `customersStore`, `couriersStore`, `teamStore`, `establishmentStore` | `services/gestao/people.ts` | `categories`, `customers`, `couriers`, `memberships`, `establishments` |
| `salesStore`, `cashStore`, `cartStore` | `services/pdv.ts` | `orders` (channel pos), `payments`, `cash_sessions`, `cash_movements` |
| `courierSessionStore`, `deliveryLogStore` | `services/entregas.ts` | `deliveries` e sessão do entregador |
| pedidos e sacola da loja | `services/orders.ts`, `ui/loja/state/*` | `orders` (guest) e carrinho no aparelho |

As telas só falam com `services/` e `domain/`; para ligar o banco troca-se a implementação dos serviços, sem mexer nas telas.

## O que já se encadeia (testado)

Pedido feito na loja → aparece em Novos na gestão → aceite, conferência item a item e "pronto" → atribuição a entregador → app do entregador (aceite, coleta, rota, código de 4 números) → "entregue" → a tela de acompanhamento da loja acompanha cada passo. Venda no PDV baixa o estoque pelo lote que vence primeiro e lança o dinheiro; cancelar desfaz. Recebimento de compra entra no estoque e cria a conta a pagar. Produção consome insumos e cria o lote. Preço e publicação definidos no cadastro valem na loja.

## Simulado ou dependente de decisão

| O quê | Situação | Depende de |
|---|---|---|
| Login da equipe, do entregador e do cliente (código por WhatsApp) | Simulado; aceita qualquer senha ou código válido no formato | Supabase Auth, P8 (provedor de mensagens) |
| Senha do gestor ao cancelar venda | Só exige 4+ dígitos | Conferência no servidor |
| Pix: QR e confirmação | Espaço reservado; confirmação manual | P8 (provedor de pagamento), Q8 |
| Taxa e área de entrega | Taxa fixa R$ 8,00; todo CEP completo é aceito | Q6, Q7 |
| Relatório de vendas e "resultado do mês" | Números de exemplo | Vendas gravadas no banco |
| Anexos (comprovante de pagamento, foto de problema na entrega) | Campo desativado | Supabase Storage |
| Fotos de produto e da casa, logotipo, textos da casa | Marcadores entre colchetes | P3, P4, P5 |
| Convite de equipe por e-mail | Registra o convite; não envia | Supabase Auth |
| Mapa e rastreio | Só "Abrir no mapa" do celular (H-E4) | — |
| PDV em conexão ruim | **Ligado**: fila local de vendas (veja a linha do PDV acima). Sem internet não dá para abrir nem fechar caixa, movimentar dinheiro nem cancelar venda | Decisões sobre venda duplicada e estoque (veja "Depende de você") |
| Realtime | **Ligado** na gestão (pedidos, entregas, estoque) e no PDV (caixa, vendas, estoque), testado: mudança feita fora do app aparece em ~2 s. Fica sem Realtime o acompanhamento do pedido na loja (cliente sem login) e o app do entregador (atualiza a cada 10 s) | Decisão sobre acesso anônimo ao Realtime |

## Backend (Supabase)

O app usa o projeto Supabase **já existente** (`afqcwqikkolyoowkozak`), que tem esquema, RLS e funções prontos. A configuração fica em `app/.env.local` (não vai ao Git; modelo em `app/.env.example`). Sem ela, o app roda só com dados de exemplo.

| Área | Situação |
|---|---|
| Loja: catálogo, categorias, dados da casa (taxa, janelas) | **Ligado** (`store_catalog`, `store_categories`, `store_info`) |
| Loja: fazer pedido e acompanhar | **Ligado e testado**: um pedido de teste (nº 1001, "TESTE Integração") foi criado e aparece no acompanhamento |
| Gestão: login da equipe | **Ligado** (Supabase Auth + papel em `memberships`) |
| Gestão: pedidos (fila, aceitar, conferir, pronto, desfazer, retirada) | **Ligado e testado** (`order_accept`, `order_mark_ready`, `order_undo_ready`, `order_complete_pickup`), com Realtime e atualização a cada 15 s |
| Gestão: estoque (saldos, lotes, movimentos, ajuste/perda, contagem e desfazer) | **Ligado e testado** (`stock_adjust`, `stock_count_apply`, `stock_count_undo`, `stock_reverse`; saldo reservado pelos pedidos reais) |
| Gestão: compras e fornecedores (criar pedido, receber, encerrar, desfazer) | **Ligado e testado** (`create_purchase_order`, `receive_purchase`, `undo_receipt`): pedido PC-0001, recebimento com lote e validade, conta a pagar criada e desfeita; encerramento por falta (`close_purchase_short`) testado com o PC-0003: recebimento parcial de 4 de 10, encerrar, repetir é recusado e desfazer o recebimento volta o pedido a "enviado" |
| Gestão: financeiro (contas, saldos, lançamentos, pagar e desfazer) | **Ligado e testado** (`pay_entry`, `undo_payment`, visão `account_balances`), pela tela: com R$ 1.000 de saldo de teste, pagar R$ 360 deixou R$ 640 e desfazer devolveu os R$ 1.000 (o saldo de teste foi removido depois). Pagar sem saldo é recusado pelo banco. Receber contas a receber não tem função no banco (a tela avisa) |
| Gestão: produção (fichas, criar ordem, iniciar, concluir, corrigir apontamento, excluir) | **Ligado e testado** (`create_production_order`, `start_production`, `finish_production`, `undo_finish_production`, `delete_production_order`): ordem OP-0001 com reserva dos insumos, conclusão com lote, consumo pelo lote que vence primeiro e custo real; corrigir devolveu os saldos e excluir liberou as reservas. A tela não edita ficha (`save_recipe` existe no banco, sem tela); a ficha de teste vem de `supabase/seed_dev_producao.sql` |
| Gestão: entregas (atribuir, publicar para parceiros, desfazer envio) | **Ligado e testado** (`delivery_assign`, `delivery_unassign`; entregadores de `couriers`, estado "em rota" e "na loja" derivado de `deliveries`, Realtime em `deliveries`): pedido 1001 enviado com o Carlos, recarregado (mostra "Enviado") e desfeito; publicar para parceiros gerou entrega de R$ 9,00 (configuração `partner_fee_cents` do banco) e repetir foi recusado |
| Gestão: produtos (edição), categorias e clientes | **Ligado e testado**: editar produto grava em `products` (preço, estoque mínimo, favorito no PDV, publicar, peso, lote, tipo, origem, descrição e nome); nova categoria grava em `categories`; clientes vêm de `customers` e dos pedidos (nº de pedidos, total, itens que mais compra, canal), e a observação interna grava ao sair do campo. Rapadura editada pela tela (preço R$ 15,00, mínimo 7, favorito) e restaurada; categoria de teste criada e removida. Não existe venda fiada no banco (o campo mostra zero) |
| PDV (abrir caixa, vender, cancelar, sangria e suprimento, fechar e reabrir) | **Ligado e testado** (`pos_open_session`, `pos_checkout`, `pos_cancel_sale`, `pos_cash_movement`, `pos_close_session`, `pos_reopen_session`): venda V-0001 de 1 queijo coalho com desconto de 10% em dinheiro (troco R$ 0,39, saiu do lote que vence primeiro, R$ 29,61 no caixa); senha errada recusada com a mensagem certa e senha certa cancelou, devolveu o estoque e estornou o dinheiro; sangria de R$ 100 ao banco, fechar sem diferença e reabrir. Itens, estoque, caixa e vendas se atualizam ao abrir e a cada 20 s. **Fila sem internet** (testada): se a venda falha por falta de rede, ela fica guardada no aparelho, aparece no histórico como "A enviar", entra no caixa esperado e é enviada sozinha, em ordem, a cada 20 s ou quando a conexão volta (`pos_checkout` com `offline: true`, que não barra por falta de estoque). Se o servidor recusar (ex.: caixa fechado), a venda fica "Não enviada" com o motivo, e dá para tentar de novo ou descartar. Fechar o caixa é bloqueado enquanto houver venda na fila. Testado cortando as chamadas ao Supabase no navegador: venda guardada, fechar bloqueado, envio ao voltar (V-0002 gravada com o lote certo) e recusa com descarte. **Sem venda duplicada**: cada venda leva uma chave única (`client_ref`, `orders_client_ref_key`) e `pos_checkout` devolve a venda já gravada se a mesma chave chegar de novo (migração `pos_checkout_client_ref`, aplicada em 2026-11-17 com o seu OK e guardada em `supabase/patches/`). Testado: reenvio devolveu o mesmo pedido (`duplicate: true`) e outra chave gerou outra venda. **Falta** o envio do comprovante por WhatsApp |
| App do entregador (`/entregas`) | **Ligado e testado** (`courier_link`, `courier_list`, `courier_take`, `courier_accept`, `courier_depart`, `courier_problem`, `courier_undo_problem`, `courier_confirm`, `courier_history`, `courier_set_available`): entrada com o usuário de teste do entregador, pegar a entrega livre, aceitar, conferir a coleta e sair (pedido vira "saiu para entrega" e o estoque baixa), devolver à loja e desfazer, código de entrega errado recusado e o certo concluiu (pedido entregue e pago), histórico do dia e interruptor "Disponível". Com o banco ligado a entrada é por **e-mail e senha** até o código por celular (P8) existir. A lista atualiza a cada 10 s. Distância e endereço da loja ainda não vêm do banco (a tela mostra "—") |
| Gestão: equipe e dados da casa | **Ligado e testado** (`memberships`, `establishments`): a tela lê nome, CNPJ, endereço, WhatsApp e horários da casa e a equipe (convites ficam como "invited"). Só quem tem o módulo `team` (o dono) grava; o gestor de teste lê e, ao tentar gravar, recebe "Só o dono pode alterar a casa e a equipe" e o banco fica intacto (o Postgres atualiza 0 linhas sem erro, então a tela confere isso). Com o papel do dono (impersonado por SQL, com RLS) atualizar a casa e criar convite funcionaram; os dados de teste foram desfeitos. O gestor só vê a própria linha na equipe. **Trocar papel, tirar o acesso e cancelar convite** foram ligados (botão "Alterar" em cada pessoa, exceto o dono e você mesmo); testado no banco com o papel do dono (trocou o papel e cancelou o convite de teste) e com o do gestor (barrado nos dois). A tela não foi testada com o dono logado, porque eu não tenho a senha da sua conta. **Falta**: o e-mail do convite (P8) e o cadastro de loja online, pagamentos e nota fiscal em Configurações (dependem de Q6 a Q8 e Q12) |

O catálogo fictício de `supabase/seed_dev.sql` já está aplicado no banco de desenvolvimento.

## Próximos passos

1. Telas de trocar papel e desativar pessoa da equipe, e o e-mail do convite.
2. Resolver P2 e P8 de `DECISIONS.md` antes de pagamentos reais, nota fiscal e área de entrega.

## Depende de você (resolvemos no final)

Itens que o código não resolve sozinho, por tipo.

### Decisões

- **Dinheiro do caixa**: abrir o caixa com troco (ex.: R$ 150) não lança nada na conta "Caixa (gaveta)"; só vendas, sangria e suprimento mexem nela. Por isso uma sangria pode deixar a conta com saldo negativo. Decidir se o fundo de troco entra como saldo inicial do caixa.
- **Produto vendido por peso**: o PDV cobra o preço do item como preço do quilo e o banco cobra `weight_price_cents`. Ao salvar um produto "por peso" a tela grava os dois iguais; confirme se o preço por quilo e o da embalagem podem ser diferentes (então o cadastro precisa de dois campos). Nenhum produto de teste é vendido por peso, então esse caminho ficou sem teste de venda.
- **Fiado e contas a receber**: o banco não tem venda fiada, saldo de cliente nem função para receber (`pay_entry` só paga). A tela de cliente mostra zero. Decidir se entra antes de abrir o balcão.
- **Clientes**: a loja cria o cliente pelo celular informado no pedido. Falta decidir como juntar dois cadastros do mesmo cliente e como atender o pedido de apagar a conta (LGPD).
- **Telas que o banco já permite e o app ainda não tem**: editar ficha técnica (`save_recipe`), lançar saldo inicial das contas (`set_opening_balance`) e cada gestor definir a própria senha de cancelamento (`set_my_pin`). Diga quais você quer agora.

- **Estoque na venda sem internet**: a venda guardada baixa o estoque só quando chega ao servidor e, como o produto já saiu, o servidor não barra por falta de saldo (baixa o que houver). A tela do balcão não desconta do estoque mostrado enquanto está sem internet. Decidir se isso basta.
- **Fila só neste aparelho**: se os dados do navegador forem apagados antes de enviar, as vendas guardadas se perdem. Decidir se há aviso ou cópia de segurança.

### Cadastros reais da casa

- **Saldo inicial das contas**: banco e caixa estão com R$ 0,00 e pagar recusa sem saldo. Informe os valores reais.
- **Insumos e fichas**: o banco só tem a ficha de teste do doce de leite (nata e rapadura como insumos fictícios). Faltam cadastrar leite, coalho, sal, embalagens etc. como itens e preencher as fichas reais (rendimento, validade, consumo, gás e energia).
- **Entregadores e telefones reais**, no lugar de Bruno, Carlos e Diego de teste.
- **Senha do gestor**: o usuário de teste usa uma senha de desenvolvimento (`VITE_DEV_MANAGER_PIN`). O dono e cada gerente precisam definir a sua.

### Acessos e provedores

- **Conferir a tela da equipe como dono**: o botão "Alterar" só aparece para o dono (o gestor de teste não tem permissão). Entre com a sua conta e experimente trocar o papel de um convite de teste e tirar o acesso.
- **Quem edita a casa e a equipe**: só o dono. A conta do dono é a sua (`bodeleve@gmail.com`); o usuário de teste é gestor e não grava. Entre como dono para preencher nome, CNPJ, endereço, WhatsApp e horários reais da casa.

- **Login do entregador por celular**: o vínculo usa o celular da conta do Supabase Auth (`courier_link`) e hoje o app entra por e-mail e senha. O código por mensagem (P8) precisa de provedor de SMS ou WhatsApp configurado no Auth; até lá cada entregador real precisaria de uma conta com e-mail, senha e celular criada por você.
- **Mensagens** (P8): comprovante da venda por WhatsApp (o banco grava em `outbox_messages`), código de login e aviso de entrega dependem do provedor.
- **Pix e cartão reais, nota fiscal e área de entrega**: Q6–Q8, Q12 e Q14, como no `CLAUDE.md`.

### Limpeza dos dados de teste (antes de usar o banco de verdade)

Usuário `teste.entregador@example.com` (criado direto no Auth porque o cadastro recusou o domínio; apagar a linha em `auth.users`); pedido 1001, que o teste do entregador deixou entregue e pago; compras PC-0001 e PC-0002 (recebidas, R$ 360 a pagar cada) e PC-0003 (enviado); lotes `TESTE-PROD-1` e a ficha de teste do doce de leite (`seed_dev_producao.sql`); entregadores de teste (`seed_dev_entregas.sql`); pedido 1001 e cliente "TESTE Integração"; vendas V-0001, V-0003 e V-0004 (canceladas) e V-0002 (R$ 32,90, vinda da fila) e as sessões de caixa de teste; fornecedores e catálogo fictícios (`seed_dev*.sql`); usuário `teste.gestao@bodeleve.test`.
