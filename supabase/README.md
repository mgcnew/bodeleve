# supabase

O banco da Bodeleve é o projeto Supabase `afqcwqikkolyoowkozak` (organização Bodeleve, região `ca-central-1`). O esquema, as políticas de acesso (RLS) e as funções (`place_order`, `pos_checkout`, `receive_purchase` etc.) já existem lá, em 19 migrações aplicadas pelo painel do projeto.

- **A migração que havia aqui foi removida**: criava as mesmas tabelas em outra estrutura e, aplicada no projeto, daria conflito.
- **`seed_dev.sql`**: catálogo fictício (10 produtos e 4 categorias) para ver a loja funcionando num banco de desenvolvimento. **Aplicado em 2026-11-16** no projeto de desenvolvimento (10 produtos publicados, 4 categorias); é reaplicável sem duplicar.
- **Pendente**: trazer as 19 migrações para este diretório (`supabase db pull`, que pede a senha do banco) para o esquema ficar versionado junto do código.

- **Usuário de teste**: `teste.gestao@bodeleve.test` (papel gestor), criado só para desenvolvimento. A senha está em `app/.env.local`. Para remover: apagar a linha em `memberships` e o usuário em Authentication.
- **Pedido de teste**: nº 1001 ("TESTE Integração"), criado pelo teste de integração da loja.

- **`seed_dev_estoque.sql`**: 4 fornecedores fictícios e custo, estoque mínimo, validade e fornecedor dos 10 produtos. **Aplicado em 2026-11-16** (4 fornecedores; custo, mínimo, validade e fornecedor dos 10 produtos); é reaplicável.
- **Estoque de teste**: o teste de contagem deixou 5 un de Queijo coalho (lote `INV-261116`) no banco. Para desfazer, use `stock_count_undo` com o id da contagem em `inventory_counts`.
- **Compra de teste**: PC-0001 (Charqueada Norte, 10 kg de carne de sol, R$ 360,00), criada e deixada em aberto; o recebimento de teste foi desfeito.
- **Lote de teste**: o recebimento desfeito do PC-0001 deixou o lote `CS-1116` (saldo 0) na carne de sol; o banco não aceita repetir código de lote no mesmo produto, e a tela agora sugere `CS-1116-2`, `-3`...
- **`seed_dev_producao.sql`**: ficha de teste do doce de leite (nata e rapadura) e 20 un de cada insumo em lote `TESTE-PROD-1`. **Aplicado em 2026-11-17**; reaplicável sem duplicar. A produção de teste (OP-0001) foi criada, concluída, corrigida e excluída; o banco ficou sem ordens.
- **`seed_dev_entregas.sql`**: entregadores de teste Bruno e Carlos (próprios) e Diego (parceiro). **Aplicado em 2026-11-17**; reaplicável. A atribuição do pedido 1001 foi testada e desfeita; o banco ficou sem entregas.
- **PDV de teste (2026-11-17)**: caixa aberto, venda V-0001 (cancelada) e uma sangria testados; o caixa ficou fechado e os lançamentos da sangria foram removidos (saldos zerados). A venda V-0001 e a sessão de caixa ficam no histórico. A senha do gestor de teste está só em `app/.env.local`.
- **Entregador de teste (2026-11-17)**: usuário `teste.entregador@example.com` criado direto em `auth.users` (o cadastro pelo Auth recusou `.test` e `example.com`), com o celular `00900000300`, que `courier_link` vincula ao Bruno. A senha está só em `app/.env.local`. O teste pegou, aceitou, saiu, devolveu, desfez e entregou o pedido 1001, que ficou **entregue e pago**.
- **Migração `pos_checkout_client_ref` (2026-11-17)**: coluna `orders.client_ref`, índice único `orders_client_ref_key` e `pos_checkout` com chave de reenvio. Aplicada no projeto pelo MCP do Supabase; o SQL está em `supabase/patches/2026-11-17_pos_checkout_client_ref.sql`. Quando as migrações forem trazidas ao repositório (`supabase db pull`), este arquivo vira uma delas.
- **Migração `couriers_active` (2026-11-17)**: coluna `couriers.active`; `me_courier`, `courier_link` e `delivery_assign` só enxergam entregador ativo. SQL em `supabase/patches/2026-11-17_couriers_active.sql`.
- **Migração `set_my_name` (2026-11-17)**: função `set_my_name(p_name)` (só usuário logado) que atualiza o próprio nome em `profiles` e `memberships`. SQL em `supabase/patches/2026-11-17_set_my_name.sql`.
- **Auditoria de 2026-11-17**: os testes de saldo inicial e de ficha técnica rodaram em blocos que terminam em erro de propósito, para o banco desfazer tudo; nada ficou gravado. O cliente "TESTE Cliente Manual" criado no teste foi removido.

- `patches/2026-11-18_pay_on_pickup.sql`: valor `on_pickup` no tipo `payment_method` e `place_order` aceitando-o (pedido da loja por WhatsApp, D19). Testado com `raise exception 'ROLLBACK_TESTE'`.

- `patches/2026-11-18_customer_credit.sql`: prazo por cliente, pagamento `on_account`, venda a prazo no `pos_checkout`, `receive_entry`, cancelamento (D21). Testado com `raise exception 'ROLLBACK_TESTE'`.
- `patches/2026-11-18_online_order_on_account.sql`: pedido da loja a prazo (`place_order`, `order_accept`, `order_complete_pickup`, `order_set_payment`). Depende do `customer_credit`. Testado com reversão.
- `patches/2026-11-18_product_photos.sql`: `products.photo_url`, bucket `produtos` com regras e `store_catalog` com foto. Testado enviando uma foto de verdade e limpando depois.
