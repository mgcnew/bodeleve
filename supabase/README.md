# supabase

O banco da Bodeleve é o projeto Supabase `afqcwqikkolyoowkozak` (organização Bodeleve, região `ca-central-1`). O esquema, as políticas de acesso (RLS) e as funções (`place_order`, `pos_checkout`, `receive_purchase` etc.) já existem lá, em 19 migrações aplicadas pelo painel do projeto.

- **A migração que havia aqui foi removida**: criava as mesmas tabelas em outra estrutura e, aplicada no projeto, daria conflito.
- **`seed_dev.sql`**: catálogo fictício (10 produtos e 4 categorias) para ver a loja funcionando num banco de desenvolvimento. **Aplicado em 2026-11-16** no projeto de desenvolvimento (10 produtos publicados, 4 categorias); é reaplicável sem duplicar.
- **Pendente**: trazer as 19 migrações para este diretório (`supabase db pull`, que pede a senha do banco) para o esquema ficar versionado junto do código.

- **Usuário de teste**: `teste.gestao@bodeleve.test` (papel gestor), criado só para desenvolvimento. A senha está em `app/.env.local`. Para remover: apagar a linha em `memberships` e o usuário em Authentication.
- **Pedido de teste**: nº 1001 ("TESTE Integração"), criado pelo teste de integração da loja.

- **`seed_dev_estoque.sql`**: 4 fornecedores fictícios e custo, estoque mínimo, validade e fornecedor dos 10 produtos. **Ainda não foi aplicado** (altera linhas existentes de `products`); é opcional e reaplicável.
- **Estoque de teste**: o teste de contagem deixou 5 un de Queijo coalho (lote `INV-261116`) no banco. Para desfazer, use `stock_count_undo` com o id da contagem em `inventory_counts`.
