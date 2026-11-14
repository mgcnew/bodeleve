# BUSINESS_RULES — Bodeleve

Status: Etapa 1. Três blocos separados de propósito: o que o briefing confirma, o que é hipótese de design, e o que ainda precisa de resposta.

## 1. Confirmado pelo briefing

- R1. O Bodeleve é uma Casa do Norte que vende alimentos e produtos regionais.
- R2. Três modalidades de produto: revenda de fornecedores; produzidos internamente; futuros produtos com marca própria (produzidos internamente ou por terceiros).
- R3. A operação inclui compras, estoque, produção, venda no balcão, venda online, financeiro, entregas próprias e por parceiros, relacionamento com clientes.
- R4. O cliente vê o catálogo sem criar conta.
- R5. Estoque distingue físico, reservado, disponível e projetado; controla lotes, validades, perdas, inventários e movimentações.
- R6. Produção usa ficha técnica (ingredientes, custos, rendimento) e ordem de produção (consumo de insumos, entrada de acabado).
- R7. PDV: quantidade e peso, descontos, pagamentos combinados, abertura e fechamento de caixa.
- R8. Entregadores próprios e parceiros são diferenciados.
- R9. Dados organizados por estabelecimento, sem obrigar um SaaS agora.
- R10. Nesta fase nada é real: sem Supabase, sem pagamento, sem baixa de estoque.

## 2. Hipóteses de design (valem até serem contrariadas)

- H1. Disponível = físico − reservado. Projetado = disponível + compras a receber + produção em andamento.
- H2. Pedido online confirmado reserva estoque; venda de balcão baixa direto.
- H3. Saída de estoque sugere o lote que vence primeiro.
- H4. Compra recebida gera conta a pagar; venda gera recebimento conforme forma de pagamento.
- H5. Comprar online não exige conta; conta serve para histórico e recompra.
- H6. Entrega é confirmada por código informado pelo cliente.
- H7. Entregador parceiro vê só as entregas publicadas para parceiros; próprio vê as atribuídas a ele.
- H8. Perfis de acesso: dono, gestor, atendente, produção, entregador.
- H9. Um caixa aberto por aparelho/atendente por vez.

## 3. Questões de negócio em aberto

Operação
- Q1. Quantos produtos ativos há hoje, aproximadamente, e em quantas categorias?
- Q2. Quais produtos são vendidos por peso? A balança é integrada ou o peso é digitado?
- Q3. A produção hoje é antecipada (para estoque), sob demanda (por pedido) ou as duas?
- Q4. Quem usa o sistema no dia a dia e em que aparelho (celular próprio, tablet no balcão, computador)?
- Q5. Existe um ou mais caixas? Mais de um atendente ao mesmo tempo?

Loja online
- Q6. Entrega em que área (raio, bairros, cidade)? A taxa é fixa, por bairro ou por distância?
- Q7. Há pedido mínimo? Agendamento de entrega/retirada ou só "o quanto antes"?
- Q8. Quais formas de pagamento online são desejadas (Pix, cartão, pagar na entrega)?
- Q9. Se um item faltar depois do pedido, o que acontece: contato com o cliente, substituição, estorno parcial?
- Q10. A loja envia para fora da cidade (transportadora/Correios) ou só entrega local?

Entregas
- Q11. Parceiros são motoboys avulsos conhecidos da casa ou plataformas (ex.: apps de entrega)? Como são pagos?

Financeiro e fiscal
- Q12. Haverá emissão de nota/cupom fiscal pelo sistema no futuro? (Muda o cadastro de produto.)
- Q13. Vendas fiado / conta de cliente existem?
- Q14. Contas bancárias e maquininhas usadas hoje (para conciliação futura)?

Marca
- Q15. Existe logotipo, embalagem ou material fotográfico próprio? Quem aprova identidade?
- Q16. A linha "marca Bodeleve" já tem produtos definidos ou é só plano?
