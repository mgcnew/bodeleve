# Supabase · Bodeleve

Projeto: `afqcwqikkolyoowkozak` (organização Bodeleve, região `ca-central-1`). Endereço: `https://afqcwqikkolyoowkozak.supabase.co`.

## Migrações (`migrations/`)

Aplicadas na ordem do nome. Cada arquivo é o mesmo SQL já aplicado no projeto; um banco novo se monta rodando todos na ordem.

| Arquivo | O que faz |
|---|---|
| `…01_base` | tipos, estabelecimento, perfis, equipe, matriz de acesso por papel (H-G27), funções de permissão em `private`, numeração por casa |
| `…02_catalogo_estoque_producao` | categorias, produtos (item de estoque e produto de venda na mesma linha), lotes, movimentos, reservas, contagem, compras, recebimento, fichas e ordens de produção |
| `…03_vendas_caixa_entregas` | clientes, pedidos (loja e balcão na mesma tabela), itens, pagamentos, caixa, entregadores e entregas |
| `…04_financeiro_saldos_realtime` | contas, lançamentos, caixa de mensagens (D21), views de saldo e Realtime |
| `…05_funcoes_da_loja` | funções públicas da loja sem conta: catálogo, `place_order`, rastrear pedido |
| `…06_politicas_e_indices` | ajustes dos avisos de desempenho do Supabase |

## Regras de segurança (RLS)

- Toda tabela tem RLS ligada e `establishment_id`; o acesso sai da tabela `role_modules` (mesma matriz de `app/src/permissions`).
- O visitante da loja (`anon`) **não lê tabela nenhuma**: usa só as funções `store_*`, `place_order` e `track_order*`, que devolvem campos seguros e calculam preço e taxa no servidor.
- Entregador não vê pedidos nem o código de entrega; só as próprias entregas e o próprio cadastro.
- Tabelas de razão (movimentos, lotes, recebimentos, lançamentos financeiros, caixa) não têm política de escrita: só as funções escrevem.
- Convite de equipe: a pessoa que cria a conta com o e-mail convidado assume o papel sozinha (gatilho em `auth.users`).

## Para a aplicação

`app/src/services/supabase/database.types.ts` são os tipos gerados (`generate_typescript_types`); regerar depois de mudar o banco.
Variáveis do app (chave **pública**, segura no navegador): veja `app/.env.example`.
