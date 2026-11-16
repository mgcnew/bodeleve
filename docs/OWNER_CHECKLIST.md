# O que depende do dono

Resumo do que está pendente para sair da simulação. Cada item aponta para `DECISIONS.md` (hipóteses H-*, pendências P-*) e `BUSINESS_RULES.md` (perguntas Q*). Nenhum deles impede de ver e testar tudo que existe hoje (veja "Como ver rodando" no `README.md`).

## 0. Para usar o sistema de verdade (banco já pronto e testado)

O banco do Supabase está montado, com as regras de segurança testadas. Falta só você ligar o que depende da sua conta:

| # | O que fazer | Onde |
|---|---|---|
| 0.1 | Na Vercel (Settings → Environment Variables, ambiente Production) criar `VITE_DATA_SOURCE=supabase`, `VITE_SUPABASE_URL=https://afqcwqikkolyoowkozak.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY` (a chave pública está em `app/.env.example`) e `VITE_STORE_SLUG=bodeleve`; e **não** criar `VITE_PREVIEW`. Depois, "Redeploy". Sem isso o site continua em modo simulado | Vercel |
| 0.2 | No Supabase, Authentication → Sign In / Providers → Email: desligar "Allow new users to sign up". A equipe entra por convite: crie a pessoa em Authentication → Users → "Add user" (e-mail e senha) e convide o mesmo e-mail em Gestão → Configurações → Equipe, com o papel dela. A ordem não importa | Supabase |
| 0.3 | Entrar em `/gestao` com o e-mail do dono e definir a senha de gestor para cancelar venda: Configurações → "Senha para cancelar venda" | App |
| 0.4 | Primeiros passos na Gestão, nesta ordem: Financeiro (saldo inicial do banco e da gaveta); Produtos → Categorias → Novo produto (com o custo da última compra dos itens de revenda e insumos); Fornecedores; Fichas técnicas; Estoque → Contagem (estoque que já existe); Entregas → Novo entregador | App |
| 0.5 | Entrada do entregador por código no celular: escolher o provedor de SMS ou WhatsApp no Supabase (Authentication → Sign In / Providers → Phone), aprovar o envio (D21) e criar `VITE_COURIER_SMS=1` na Vercel. O código passa a ter 6 números. Enquanto isso o app de Entregas mostra "o envio do código ainda não está ligado" | Supabase, Vercel |

## 1. Para começar o banco (Etapa 1)

| O que | Por quê | Onde |
|---|---|---|
| Conectar o Supabase ao Claude e dizer em qual organização e região criar o projeto da Bodeleve (a conta só tem projetos de outro negócio, que não serão usados) | Tudo hoje é simulado no navegador; sem isso não há dado real, login real nem Realtime real | P11, D19 |
| Confirmar quem usa o sistema e em que aparelho | Define as políticas de acesso por papel | Q4, H-G27, P20, P42, P47 |
| Decidir fiado (existe?) e nota fiscal (emite?) | Muda tabelas e cadastro de produto, e é caro mudar depois | Q12, Q13, P48 |
| Aceitar login anônimo para compra sem conta | Checkout sem conta (D6) | IMPLEMENTATION_PLAN.md |

## 2. Para cobrar e avisar de verdade (D21)

| O que | Onde |
|---|---|
| Escolher o provedor de Pix e cartão e aprovar a cobrança real (loja, balcão e entregas) | P8, P14, P50, P51, Q8, Q14 |
| Escolher o provedor de WhatsApp e aprovar o envio (código de entrada, comprovante, pedido ao fornecedor, aviso de entrega) | P8, P16, P24, P44, P52, P55, P56 |
| Pagamento do parceiro de entregas (Pix toda segunda) e prestação de contas do dinheiro da porta | P58 |

## 3. Conteúdo para trocar os exemplos

| O que | Onde |
|---|---|
| Logotipo oficial, fotos dos produtos e da casa | P3, P38 |
| Texto da casa, história, texto da Linha Bodeleve, endereço, horários, WhatsApp, CNPJ (a tela "A casa" já grava e a loja já mostra) | P4, P46 |
| Descrição, ingredientes, conservação e validade de cada produto | P5 |
| Cadastro real de produtos (nome, medida, preço, origem, categoria, preço do kg) | P38, P39 |
| Fornecedores reais (contato, CNPJ, prazo, condição) e estoque mínimo de cada item; primeira contagem real | P26, P27, P28 |
| Fichas técnicas reais e custo de gás e energia por fornada | P30, P31 |
| Despesas fixas reais, regras de cartão (prazo e taxa) | P37 |
| Entregadores e parceiros reais (celular, veículo, placa, chave Pix) | P55, P57 |

## 4. Regras que escolhi como hipótese e preciso que confirme

As hipóteses estão marcadas `H-*` em `DECISIONS.md`. As que mais mudam o dia a dia:

- Área e taxa de entrega por bairro, janelas de horário, taxa fixa de R$ 8,00 (Q6, Q7, P15, P43).
- Reserva do estoque: ao aceitar o pedido ou só ao pagar o Pix, e quando expira (P29).
- Sugestão de compra, produção que pode passar do estoque, perda com motivo (P23, P32).
- Pagamento parcial e multa e juros nas contas, categorias financeiras (P36).
- Desconto no balcão: limite e quem pode dar; senha do gestor no cancelamento (P49).
- Entrega: valor e prazo do parceiro, devolução paga pela metade (P43, P59).
- Relatórios que você quer de verdade e a exportação em planilha e PDF (P45).

## 5. Desenhos que faltam

Estados que o design não mostra e eu decidi no código (precisam do seu olho): Pix pendente (P14), login com erros (P16), pedido aguardando Pix (P22), ordem de produção planejada e cancelamento (P33), baixa de contas a receber e lançamento manual (P34), criar produto e renomear categoria (P40), apagar dados de cliente (P41), cancelamento parcial e troca no balcão (P54), mapa e foto de prova nas entregas (P57).

## 6. Validação com gente de verdade

- Passada visual completa em celular, tablet e computador (P12, P13, P18).
- Teste com atendente, entregador e cliente em aparelho real, e com leitor de tela (P7, P62).
- Pesquisa visual de referência no Mobbin, que exige plano pago (P1).

## 7. Depois que o Supabase existir

Já feito: Realtime ligado (pedidos, entregas, estoque e caixa), entrada por e-mail e senha, políticas RLS revisadas e testadas. Falta importar o histórico real, se houver (`DATA_MODEL_DRAFT.md`, "Ajustes ao modelo"), e limitar as tentativas erradas do código de entrega antes de abrir ao público (D36).
