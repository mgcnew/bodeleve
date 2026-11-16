# supabase

O banco da Bodeleve é o projeto Supabase `afqcwqikkolyoowkozak` (organização Bodeleve, região `ca-central-1`). O esquema, as políticas de acesso (RLS) e as funções (`place_order`, `pos_checkout`, `receive_purchase` etc.) já existem lá, em 19 migrações aplicadas pelo painel do projeto.

- **A migração que havia aqui foi removida**: criava as mesmas tabelas em outra estrutura e, aplicada no projeto, daria conflito.
- **`seed_dev.sql`**: catálogo fictício (10 produtos e 4 categorias) para ver a loja funcionando num banco de desenvolvimento. **Aplicado em 2026-11-16** no projeto de desenvolvimento (10 produtos publicados, 4 categorias); é reaplicável sem duplicar.
- **Pendente**: trazer as 19 migrações para este diretório (`supabase db pull`, que pede a senha do banco) para o esquema ficar versionado junto do código.
