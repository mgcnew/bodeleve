# Formulário do dono

Responda direto neste arquivo, na conversa ou em uma planilha, na ordem que preferir. **Não precisa responder tudo de uma vez**: o bloco 1 destrava o banco; o bloco 2 destrava cobrança e mensagens; os blocos 3 e 4 trocam os exemplos pelos dados reais. Onde não souber, escreva "não sei": eu mantenho a hipótese marcada e sigo. A lista completa e o motivo de cada item estão em `OWNER_CHECKLIST.md` e `DECISIONS.md`.

## 1. Banco de dados (destrava a Etapa 1)

| # | Pergunta | Resposta |
|---|---|---|
| 1.1 | Conectar o Supabase ao Claude (e dizer **em qual organização** criar o projeto da Bodeleve; os projetos que existem hoje são de outro negócio e não serão usados) | |
| 1.2 | Região do projeto (sugestão: São Paulo, `sa-east-1`) e se quer dois projetos, um de teste e um de produção | |
| 1.3 | Q4: quem usa o sistema no dia a dia, e em que aparelho? Nome, função (dono, gestor, atendente, produção, entregador) e se usa celular, tablet no balcão ou computador | |
| 1.4 | Q5: há um caixa só ou mais? Mais de um atendente ao mesmo tempo? | |
| 1.5 | Q13: existe venda fiado (conta de cliente)? Se sim, como funciona o limite e o acerto | |
| 1.6 | Q12: a casa vai emitir nota ou cupom fiscal pelo sistema? Sim, não ou ainda não sei | |
| 1.7 | A compra na loja sem conta pode usar o login anônimo do Supabase (não pede cadastro)? | |

## 2. Cobrança e mensagens (hoje tudo é simulado)

| # | Pergunta | Resposta |
|---|---|---|
| 2.1 | Q8: quais formas de pagamento online quer (Pix, cartão, pagar na entrega)? | |
| 2.2 | Q14: quais contas bancárias e maquininhas a casa usa hoje (banco, taxa de débito e crédito, prazo para receber)? | |
| 2.3 | Provedor de Pix e cartão: já tem algum (banco, Mercado Pago, outro)? Quer que eu sugira opções? | |
| 2.4 | WhatsApp: qual número oficial da casa? Já usa a API oficial ou um provedor? **Autoriza eu ligar o envio real de mensagens?** (código de entrada, aviso de entrega, comprovante, pedido ao fornecedor) | |
| 2.5 | **Autoriza eu ligar a cobrança real** quando o provedor estiver escolhido? | |

## 3. Regras de funcionamento

| # | Pergunta | Resposta | Hoje uso |
|---|---|---|---|
| 3.1 | Q6: entrega em quais bairros ou raio? Taxa fixa, por bairro ou por distância? Qual valor? | | Taxa fixa de R$ 8,00, três bairros de exemplo |
| 3.2 | Q7: pedido mínimo? Agendamento de entrega e retirada, ou só "o quanto antes"? | | Sem mínimo; três janelas |
| 3.3 | Q9: se faltar um item depois do pedido, o que fazer (ligar, substituir, estornar parte)? | | Não tratado |
| 3.4 | Q10: entrega fora da cidade (Correios, transportadora) ou só local? | | Só local |
| 3.5 | Q11: parceiros de entrega são motoboys avulsos ou aplicativos? Como são pagos? | | R$ 9,00 por entrega, R$ 4,50 se devolver, Pix toda segunda |
| 3.6 | Reserva do estoque: segurar o item ao aceitar o pedido ou só depois do Pix pago? Por quanto tempo? | | Ao aceitar o pedido |
| 3.7 | Q2: quais produtos são vendidos por peso e qual o preço do quilo de cada um? A balança é ligada ao sistema ou o peso é digitado? | | Carne de sol, charque e feijão de corda; peso digitado |
| 3.8 | Desconto no balcão: qual o máximo, e quem pode dar sem senha do gestor? | | Sem limite |
| 3.9 | Q3: a produção é para estoque, sob demanda ou as duas? A produção pode passar do estoque de insumos? | | As duas; bloqueia |
| 3.10 | Quais relatórios você quer olhar toda semana? Quer exportar em planilha ou PDF? | | Cinco relatórios, sem exportar |
| 3.11 | Pode pagar conta só em parte? Existe multa e juros nas contas atrasadas? | | Sim, aceito |

## 4. Conteúdo real (troca os exemplos)

| # | O que | Como me passar | Pronto? |
|---|---|---|---|
| 4.1 | **Casa**: nome, CNPJ, endereço, WhatsApp, horários (segunda a sexta, sábado, domingo) | Texto, ou preencha a tela Configurações → A casa | |
| 4.2 | **Logotipo** oficial (e quem aprova a identidade, Q15) | Arquivo SVG ou PNG | |
| 4.3 | **Textos da loja**: história da casa, texto de abertura, texto e compromisso da Linha Bodeleve | Texto | |
| 4.4 | **Produtos** (Q1, Q16): nome, medida da embalagem, preço, origem (feito na casa, marca Bodeleve ou revenda), categoria, estoque mínimo, e preço do quilo quando for por peso | Planilha, uma linha por produto | |
| 4.5 | **Descrição de cada produto**: como é feito, ingredientes, como conservar, validade | Planilha, junto com o item acima | |
| 4.6 | **Fotos** dos produtos e da casa | Uma foto por produto, com o nome no arquivo | |
| 4.7 | **Fornecedores**: nome, contato, e-mail, CNPJ ou CPF, prazo de entrega, condição de pagamento | Planilha | |
| 4.8 | **Fichas técnicas**: insumos, quantidades por fornada, rendimento, validade, modo de preparo; e o custo de gás e energia por fornada | Planilha ou texto por produto | |
| 4.9 | **Primeira contagem de estoque**: item, lote, validade, quantidade | Planilha | |
| 4.10 | **Despesas fixas**: aluguel, energia, gás, internet, folha, com valor e dia do vencimento | Planilha | |
| 4.11 | **Entregadores e parceiros**: nome, celular, veículo e placa, chave Pix do parceiro | Planilha | |
| 4.12 | **Equipe**: nome, e-mail e papel de cada pessoa | Planilha | |

## 5. Olhar e testar

| # | O que | Como |
|---|---|---|
| 5.1 | Abrir a demonstração e dizer o que está errado ou estranho, em cada tela (celular, tablet e computador) | A página `/atalhos` do endereço da Vercel lista cada ambiente com as contas de teste |
| 5.2 | Conferir os textos que mudei em relação ao desenho (tabela em "Alterações de decisões aprovadas", `DECISIONS.md`) | Aprovar ou pedir para voltar ao texto original |
| 5.3 | Testar com a pessoa do balcão, com um entregador e com um cliente, e com leitor de tela se possível | Observar e anotar |
| 5.4 | Decidir os estados que o desenho não mostra: Pix pendente, erros do login, ordem de produção planejada, baixa de conta a receber, cancelamento parcial no balcão | Pedir para desenhar ou aprovar o que eu fiz |
