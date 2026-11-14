# USER_FLOWS — Bodeleve

Status: proposta da Etapa 1 · fluxos em nível de passos; telas ainda não desenhadas. Todos usarão dados fictícios e estados simulados.

## Prioridade recomendada

| Ordem | Fluxo | Por quê |
|---|---|---|
| 1 | F4 — E-commerce | Vitrine da marca; checkout é onde o setor mais falha |
| 2 | F3 — PDV | Maior frequência de uso diário |
| 3 | F1 — Compras | Alimenta estoque e financeiro |
| 4 | F2 — Produção | Diferencial do negócio; maior incerteza de regra |
| 5 | F6 — Financeiro | Consolida os anteriores |
| 6 | F5 — Entregas | Depende de pedido pronto (F4) |

## F1 — Compras (Gestão)

Fornecedor → Pedido de compra → Recebimento → Estoque → Financeiro

1. Escolher fornecedor (ou criar).
2. Montar pedido: itens, quantidades, custo, previsão de chegada.
3. Enviar / marcar como enviado → status "Aguardando".
4. Recebimento: conferir item a item, informar quantidade recebida, lote e validade.
5. Confirmar → entrada no estoque (simulada) e conta a pagar criada (simulada).

Exceções a desenhar: recebimento parcial · item divergente · custo diferente do pedido.

## F2 — Produção (Gestão)

Ficha técnica → Ordem de produção → Consumo de ingredientes → Rendimento → Produto acabado

1. Abrir ficha técnica (ingredientes, quantidades, rendimento esperado, custo).
2. Criar ordem: quantidade a produzir → sistema mostra insumos necessários e faltas.
3. Iniciar → insumos reservados.
4. Apontar: consumo real e rendimento real.
5. Concluir → baixa de insumos, entrada do acabado com lote, validade e custo (simulados).

Exceções: insumo insuficiente · rendimento abaixo do esperado (perda) · cancelar ordem iniciada.
Hipótese aberta: produção antecipada × sob demanda (Q3).

## F3 — PDV

Produto → Carrinho → Pagamento → Venda concluída

1. (Caixa aberto.) Tocar no produto em Favoritos, Categorias ou Buscar.
2. Item por unidade entra direto; item por peso abre sheet de peso.
3. Barra de sacola mostra total → abrir sacola para ajustar ou dar desconto.
4. Pagamento: dinheiro (com troco), Pix, débito, crédito; ou combinado.
5. Venda concluída → nova venda.

Exceções: pagamento combinado · cancelar item · cancelar venda · sem caixa aberto.

## F4 — E-commerce (Loja)

Catálogo → Produto → Carrinho → Endereço → Entrega → Pagamento → Pedido confirmado

1. Início ou categoria → produto (ou adicionar direto do cartão).
2. Sacola com subtotal e taxa estimada.
3. Identificação: continuar sem conta (principal) ou entrar.
4. Entrega ou retirada; se entrega, endereço.
5. Pagamento.
6. Revisão → confirmar.
7. Pedido confirmado → acompanhamento.

Exceções: item indisponível na sacola · endereço fora da área · pedido mínimo não atingido.

## F5 — Entregas (Gestão + Entregador)

Pedido pronto → Atribuição → Coleta → Em rota → Entrega confirmada

1. Gestão: pedido marcado "Pronto".
2. Atribuição: gestor escolhe entregador próprio, ou publica para parceiros.
3. Entregador: vê detalhe, aceita.
4. Coleta no balcão: confere pedido, confirma coleta.
5. Em rota: destino, contato, observações.
6. Confirmação: código do cliente → entregue.

Exceções: cliente ausente · endereço errado · devolução à loja.

## F6 — Financeiro (Gestão)

Lançamentos → Contas → Pagamentos / recebimentos → Fluxo de caixa → Relatórios

1. Lançamentos entram por venda, compra ou manualmente.
2. Contas a pagar e a receber por vencimento.
3. Dar baixa: data, valor pago, forma.
4. Fluxo de caixa: realizado e previsto.
5. Relatório do período.

Exceções: pagamento parcial · conta vencida · estorno.
