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
| `…07_funcoes_estoque_compras_producao` | baixa por lote que vence primeiro (FEFO), ajuste e estorno, inventário, recebimento de compra (lote, conta a pagar), produção com custo real; tudo com desfazer |
| `…08_funcoes_pedidos_pdv_financeiro_entregas` | fila do pedido online, balcão (abrir/fechar/reabrir caixa, venda, sangria, cancelamento com senha de gestor), pagar conta e desfazer, atribuição de entrega e todo o fluxo do entregador |
| `…09_corrige_nome_do_aprovador` | corrige o nome de quem aprova um cancelamento |

## Regras de segurança (RLS)

- Toda tabela tem RLS ligada e `establishment_id`; o acesso sai da tabela `role_modules` (mesma matriz de `app/src/permissions`).
- O visitante da loja (`anon`) **não lê tabela nenhuma**: usa só as funções `store_*`, `place_order` e `track_order*`, que devolvem campos seguros e calculam preço e taxa no servidor.
- Entregador não vê pedidos nem o código de entrega; só as próprias entregas e o próprio cadastro.
- Tabelas de razão (movimentos, lotes, recebimentos, lançamentos financeiros, caixa) não têm política de escrita: só as funções escrevem.
- Convite de equipe: a pessoa que cria a conta com o e-mail convidado assume o papel sozinha (gatilho em `auth.users`).

## Funções que o app chama (RPC)

Toda escrita de estoque, caixa e dinheiro é por função (`security definer`, confere o papel da pessoa na casa). Erros esperados voltam como exceção com o código na mensagem (`insufficient_stock`, `forbidden`, `wrong_code`…).
Exceção: `pos_cancel_sale` devolve `{ "error": "invalid_pin" | "pin_locked" }` em vez de lançar, para a tentativa errada ficar registrada (5 erros em 10 min travam por 10 min).

- Estoque/compras/produção: `stock_adjust`, `stock_reverse`, `stock_count_apply`, `stock_count_undo`, `receive_purchase`, `undo_receipt`, `finish_production`, `undo_finish_production`
- Pedidos online: `order_accept`, `order_mark_ready`, `order_undo_ready`, `order_complete_pickup`
- Balcão: `pos_open_session`, `pos_checkout`, `pos_cancel_sale`, `pos_cash_movement`, `pos_close_session`, `pos_reopen_session`, `pos_send_receipt` (só guarda na caixa de saída, D21), `pos_sync_pending`, `set_my_pin`
- Financeiro: `pay_entry`, `undo_payment`
- Entregas (equipe): `delivery_assign`, `delivery_unassign`, `delivery_expire_published`
- Entregas (entregador): `courier_link`, `courier_list`, `courier_detail`, `courier_take`, `courier_accept`, `courier_depart`, `courier_confirm`, `courier_problem`, `courier_undo_problem`, `courier_history`, `courier_set_available`, `courier_save_pix`

Regras que o banco impõe (iguais às do app simulado): o preço e o estoque vêm sempre do cadastro, nunca do aparelho; o estoque de pedido online só sai da casa quando o entregador sai (ou na retirada) e volta se a entrega é devolvida; cancelar venda estorna estoque e dinheiro com lançamentos contrários; o código de entrega nunca vai para o entregador.

## Hipóteses de entrega em `establishments.settings`

`delivery_fee_cents`, `partner_fee_cents`, `partner_return_fee_cents`, `minutes_per_km`, `partner_timeout_minutes`, `district_km`. Trocam no banco sem refazer tela (H-I69 em diante).

## Para a aplicação

`app/src/services/supabase/database.types.ts` são os tipos gerados (`generate_typescript_types`); regerar depois de mudar o banco.
Variáveis do app (chave **pública**, segura no navegador): veja `app/.env.example`.
