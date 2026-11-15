# IMPLEMENTATION_PLAN — Bodeleve

Status: **proposta, aguardando aprovação**. Nenhum código foi escrito, nenhum projeto Supabase foi criado e nada foi enviado ao GitHub. Pagamentos reais (Pix/cartão) e envio de mensagens (WhatsApp) **não serão implementados** até aprovação explícita; até lá ficam atrás de interfaces com implementação simulada.

**Restrição do dono (2026-11-15): não mexer em banco de dados por enquanto.** Ele ainda vai conectar o Supabase ao Claude. Até lá não se cria projeto, migration, tabela, política, função nem seed, e não se roda SQL em nenhum projeto. As únicas chamadas ao Supabase feitas nesta sessão foram de leitura (listar organizações e projetos).

Fontes lidas: `CLAUDE.md`, `docs/DECISIONS.md`, `docs/SCREEN_MAP.md`, `docs/DATA_MODEL_DRAFT.md`, `docs/BUSINESS_RULES.md`, `docs/DESIGN_SYSTEM.md`, `docs/AUDIT.md`, `docs/ROADMAP.md`, `design/tokens.css` e a tela `Loja-Sacola.dc.html` como amostra do formato dos quadros.

---

## 1. Stack proposta

### Front-end

| Camada | Escolha | Por quê |
|---|---|---|
| Build / framework | **Vite + React 18 + TypeScript** | Os quatro ambientes são aplicativos de uso (gestão, PDV, entregas) e uma loja; tudo cabe em um SPA com rotas por ambiente (`/`, `/gestao`, `/pdv`, `/entregas`) e carregamento sob demanda por ambiente, para a loja não baixar código da gestão. |
| Rotas | **React Router** | Os quadros já têm links entre telas (`href="Loja-Identificacao.dc.html"`); mapeiam direto para rotas. |
| Dados do servidor | **TanStack Query + `@supabase/supabase-js`** | Cache, estados de carregando/erro (já desenhados em `DS-Estados`) e fila de tentativas para conexão ruim no PDV. |
| Estado local | **Zustand** (sacola, caixa aberto, rascunhos) | A sacola e o checkout atravessam telas; ficam persistidos no aparelho (H-L12). |
| Estilo | **CSS puro com `design/tokens.css`** (CSS Modules por componente) | `CLAUDE.md` manda usar o `tokens.css`; evita um segundo sistema de tokens (Tailwind exigiria espelhar tudo). |
| Ícones | Os 24 ícones de traço do quadro `DS-Fundamentos` como componentes SVG próprios | Sem biblioteca externa, sem emoji. |
| PWA | **vite-plugin-pwa** (instalável por ambiente) | O PDV e o app de entregas rodam em celular; PDV precisa de resiliência a conexão ruim (passo 5). |
| Testes | **Vitest** (domínio), **Testing Library** (componentes), **Playwright** (fluxos 1–6) e **axe** (acessibilidade, para manter o `AUDIT.md`) | Domínio (saldos, custos, totais) é onde erro custa dinheiro. |
| Pastas | As camadas do `DATA_MODEL_DRAFT.md`: `ui/`, `components/`, `mocks/`, `services/`, `domain/`, `permissions/` | `services/` expõe interfaces; primeiro lê `mocks/`, depois Supabase, sem refazer telas. |

**Decisão que precisa de você (D-IMP-1):** SPA (Vite) ou Next.js. Recomendo Vite pela simplicidade e pelo PDV offline. O custo: a **loja pública não terá renderização no servidor**, então o catálogo aparece pior em buscadores e em pré-visualização de links no WhatsApp. Se o catálogo orgânico no Google importa, a loja deve ser a única parte em Next.js (ou o SPA ganha pré-renderização das páginas de produto). Ver seção 4.

### Supabase

| Recurso | Uso |
|---|---|
| **Postgres + RLS** | Todas as tabelas do `DATA_MODEL_DRAFT.md`, todas com `establishment_id`. Política por papel via `memberships` (owner, manager, clerk, production, courier — H-G27) numa função `has_role(establishment_id, roles[])`. |
| **Migrations versionadas** (`supabase/migrations`) | Nada de alterar o banco pelo painel. Tipos TypeScript gerados a partir do banco. |
| **Auth** | Equipe: e-mail e senha (H-G1). Cliente e entregador: código de 4 dígitos pelo WhatsApp (H-L10, H-E1) — depende de provedor (P8), então em desenvolvimento entra com **código de teste fixo** e uma interface `OtpSender`. Compra como convidado: **login anônimo** do Supabase, que amarra "pedidos feitos neste aparelho" (H-L12) e permite RLS sem conta. |
| **Funções SQL (RPC)** | Operações que precisam ser atômicas: finalizar venda do PDV (baixa por lote que vence primeiro — H-G11), criar pedido online (reserva), receber compra (lote + conta a pagar — H-G9), concluir ordem de produção (H-G18), confirmar entrega pelo código (H-E5). O cliente não faz `INSERT` direto em `stock_movements`. |
| **Saldos** | Views `physical`, `reserved`, `available`, `projected` sobre `stock_movements` e `stock_reservations` (princípio do modelo: saldo nunca é coluna editável). |
| **Realtime** | Só onde o modelo indica: pedidos novos na gestão, status do pedido para o cliente, entregas disponíveis, saldo no PDV. |
| **Storage** | `product_images`. Até haver fotos, o marcador `[FOTO DO PRODUTO]`. |
| **Edge Functions** | Reservadas para pagamento (webhook Pix) e envio de WhatsApp. **Não serão criadas agora**; o código só terá a interface e uma versão simulada. |

**Ajustes ao `DATA_MODEL_DRAFT.md` que identifiquei** (serão registrados em `DECISIONS.md` antes de aplicar, conforme `CLAUDE.md`):

- Falta onde guardar **área e taxa de entrega** (Q6) e **configurações** do estabelecimento (horário, WhatsApp, CNPJ, formas de pagamento ativas). Proposta: `delivery_zones` e `establishment_settings`, ambas com valores de exemplo marcados como H-L1/H-L9.
- Falta **transferência entre contas** (H-G20, "não é entrada nem saída"): `financial_transfers`.
- Falta **trilha de auditoria** (cancelamento exige senha de gestor, H-P6; ajustes de estoque): `audit_log`.
- Falta **fila de mensagens** (`message_outbox`), para o sistema registrar "enviar comprovante/código" sem enviar nada real enquanto o provedor não for escolhido.
- `deliveries.delivery_code` precisa ser guardado de modo que o entregador não o leia (o código é do cliente, H-E5): só o cliente e a função de confirmação enxergam.
- Hipóteses H-* vão para **tabelas de configuração ou constantes** (taxa de R$ 8,00, R$ 9,00 do parceiro, 10 minutos de aceite, metade na devolução), nunca espalhadas pelas telas.

---

## 2. Plano em etapas (ordem do `CLAUDE.md`)

Cada etapa termina com revisão sua antes da seguinte (D8). Em todas: dados de exemplo só como *seed* de desenvolvimento; textos `[entre colchetes]` ficam como conteúdo editável (tabela de conteúdo, não código).

### Etapa 1 — Fundação e Supabase
- Repositório do app (Vite, TS, lint, testes, CI).
- Projeto Supabase **novo e exclusivo da Bodeleve**; migrations com todas as tabelas, enums, índices e `establishment_id`.
- RLS por papel + testes automatizados de RLS (cada papel enxerga só o que deve; anônimo só lê catálogo publicado).
- Views de saldo e funções RPC essenciais, com testes de domínio.
- *Seed* com os dados fictícios das telas (pedido #1041, queijo coalho com lotes, PC-0057 etc.), que a auditoria já conferiu entre telas.
- **Pronto quando:** `supabase db reset` sobe tudo do zero e a suíte de RLS passa.

### Etapa 2 — Design system em componentes
- `tokens.css` importado como está; fontes Bricolage Grotesque + Inter.
- Base: botão (5 variantes), campo, busca, seletor de quantidade, campo de peso, segmentado, opção única, caixa de seleção, liga/desliga (60×44), etiqueta de status, selo de origem.
- Navegação: barra inferior (4 ambientes), abas, bottom sheet (vira janela central ≥ 768 px), modal, aviso temporário, menu lateral.
- Domínio: cartão de produto, linha do PDV, saldos de estoque, lote e validade, lançamento financeiro, linha do tempo, cartão de entrega, código de confirmação.
- Estados: vazio, esqueleto, falha.
- Uma página interna de catálogo de componentes (só em desenvolvimento) para comparar com os quadros `DS-*`.
- **Pronto quando:** componentes batem com `DS-Componentes/Navegacao/Dominio/Estados` e passam em axe (alvo ≥ 44 px, nomes em botões de ícone).

### Etapa 3 — Loja online (Fluxo 4, 18 telas)
- Início, categoria, busca, produto, Linha Bodeleve, Sobre → leitura pública do catálogo, sem login (D5).
- Sacola → checkout como convidado (identificação, entrega/retirada, endereço, pagamento, revisão) → pedido confirmado → acompanhamento.
- Meus pedidos, recompra (H-L13), perfil, entrar (código por WhatsApp, simulado).
- **Pagamento: só a interface.** Pix gera um QR de exemplo e a confirmação é simulada; cartão/dinheiro "na entrega" apenas registra a forma. Nenhuma cobrança real.
- Referência de computador: `Resp-Loja-Desktop`.

### Etapa 4 — Gestão (36 telas), na ordem de D13/CLAUDE.md
Pedidos → Estoque → Compras/Recebimento → Produção → Financeiro → Produtos, Clientes, Entregas (painel), Relatórios, Configurações, Equipe. Início e Mais entram junto com Pedidos. Entrar (e-mail/senha) vem antes de tudo.
Referência de computador: `Resp-Gestao-Desktop`.

### Etapa 5 — PDV (Fluxo 3)
Abertura de caixa → Vender (favoritos/categorias/busca, folha de peso) → Sacola (desconto com motivo) → Pagamento e combinado → Concluída → Vendas/Detalhe/Cancelamento (senha de gestor) → Caixa (sangria, suprimento, fechamento).
**Conexão ruim:** catálogo e saldo em cache; venda gravada localmente numa fila e enviada com chave de idempotência, com indicador visível de "pendente de envio". Comprovante por WhatsApp fica só na `message_outbox`.
Referência de tablet: `Resp-PDV-Tablet`.

### Etapa 6 — Entregas (Fluxo 5)
App do entregador (9 telas) e painel de atribuição na gestão. Próprio × parceiro por papel/`couriers.kind`; aceite concorrente protegido por função (duas pessoas não aceitam a mesma entrega); confirmação pelo código; "Problema na entrega". "Abrir no mapa" usa o app de mapas do aparelho (H-E4).

### Etapa 7 — Realtime e acabamento
Pedidos novos na gestão, status para o cliente, entregas disponíveis, saldo no PDV. Depois: A2 (leitor de tela), passada responsiva nos 3 tamanhos, revisão de performance e de políticas RLS (`get_advisors`).

### Fora desta proposta (só com aprovação sua)
Pagamento real (Pix/cartão), envio real de WhatsApp/SMS, nota fiscal, qualquer cobrança.

---

## 3. Dúvidas que bloqueiam cada etapa

Legenda: **Bloqueia** = não dá para fechar a etapa sem resposta; **Hipótese** = sigo com a H-* já aprovada e deixo isolada para trocar depois.

### Antes de começar qualquer etapa
| # | Pergunta | Efeito |
|---|---|---|
| I-1 | **Qual projeto Supabase usar?** A conta só tem projetos de outro negócio (`pizzaria-shalon-dev`, `-prod`, `shalon-replay-ensaio`). Não vou usá-los. Posso criar um projeto novo da Bodeleve (pode ter custo), em qual organização e região? Sugestão: `sa-east-1`, dois projetos (dev e prod). | **Bloqueia a Etapa 1** |
| I-2 | Vite SPA ou Next.js para a loja (D-IMP-1 acima)? | Bloqueia a Etapa 3 (decide a estrutura do app; melhor decidir antes da 1) |
| I-3 | Repositório: posso trabalhar em branch e abrir PR, ou prefere commits direto na `main`? Onde o app mora: na raiz ou em `app/`? | Organização |
| I-4 | Ok registrar em `DECISIONS.md` as decisões D18+ da stack e os ajustes ao modelo de dados? | `CLAUDE.md` exige registro |

### Etapa 1 — Supabase
| Pergunta | Tipo |
|---|---|
| Q4: quem usa o sistema e em que aparelho — define o que o RLS libera por papel. | Hipótese: H-G27 (5 papéis fixos) |
| Q13: existe fiado? Muda `customers`/`financial_entries`. | Hipótese: H-G24 (fiado como a receber) |
| Q12: haverá nota fiscal? Muda o cadastro de produto (NCM, CFOP…). | Hipótese: fora desta versão (H-P8). Não bloqueia, mas é caro mudar depois |
| Aceita login anônimo do Supabase para compra de convidado? | Bloqueia a Etapa 3 |

### Etapa 2 — Design system
Sem bloqueio. Só o aviso: sem **logotipo oficial** (P3/D6) a marca é a palavra "Bodeleve" em texto; e as fontes vêm do Google Fonts (ok, ou prefere hospedar as fontes?).

### Etapa 3 — Loja
| Pergunta | Tipo |
|---|---|
| Q6 área e taxa de entrega | Hipótese: R$ 8,00 fixa (H-L1), CEP validado (H-L9) |
| Q7 pedido mínimo / agendamento | Hipótese: H-L7 janelas de exemplo |
| Q8 formas de pagamento online | Hipótese: H-L8. **Pagamento real: bloqueado** |
| Q9 item que falta depois do pedido | Hipótese: H-L13 (só avisa) |
| P8 provedor de WhatsApp para o código de login | Simulado até escolher |
| P3/P4/P5 fotos e textos da casa e dos produtos | Ficam como `[marcadores]` editáveis |
| Q1 / Q16 catálogo real e Linha Bodeleve | Seed de exemplo |

### Etapa 4 — Gestão
| Pergunta | Tipo |
|---|---|
| Q3 produção antecipada, sob demanda ou as duas | Hipótese: H-G15 (as duas) |
| Q14 contas e maquininhas | Hipótese: H-G20 (banco + caixa) |
| Q1 tamanho do catálogo e categorias | Afeta inventário por área (H-G13) |
| H8 / Q4 quem cadastra equipe | Hipótese: H-G1 |

### Etapa 5 — PDV
| Pergunta | Tipo |
|---|---|
| Q2 produtos por peso; balança integrada? | Hipótese: peso digitado (H-P2) |
| Q5 quantos caixas e atendentes ao mesmo tempo | Hipótese: um caixa por aparelho (H-P7) |
| Q4 aparelho (celular ou tablet no balcão) | Hipótese: H-P1 |
| Q8/Q14 maquininha: integrar ou registrar à parte? | Hipótese: à parte (H-P3). **Integração real: bloqueada** |
| Quanto de offline é necessário: só aguentar quedas curtas, ou vender o dia todo sem internet? | Define o esforço da fila local |

### Etapa 6 — Entregas
| Pergunta | Tipo |
|---|---|
| Q11 parceiros: motoboys avulsos ou plataformas? Como são pagos? | Hipótese: H-E2/E6/E7 |
| Entregador entra só com cadastro prévio (H-E1)? | Hipótese |

### Etapa 7 — Realtime
Sem bloqueio.

---

## 4. Depende de você (lista para quando voltar)

Ordem de prioridade; nada abaixo foi feito sem você.

0. **Conectar o Supabase da Bodeleve ao Claude** (você disse que vai fazer). Enquanto isso não acontecer, nada de banco é feito. As etapas 2 em diante não dependem do banco para começar, porque as telas leem `mocks/` por trás de `services/`.
1. **Autorizar a criação do projeto Supabase da Bodeleve** (I-1) — organização, região e se aceita custo. Sem isso a Etapa 1 só avança até as migrations em arquivo.
2. **Decidir Vite × Next.js para a loja** (I-2), pensando em aparecer no Google e em pré-visualização de link no WhatsApp.
3. **Aprovar esta proposta** (stack, etapas, ajustes ao modelo de dados).
4. **Responder Q1–Q16** (`BUSINESS_RULES.md`), principalmente Q6–Q8, Q12 e Q14 antes de qualquer pagamento real, área de entrega ou nota fiscal.
5. **Escolher provedores** de pagamento (Pix/cartão) e de WhatsApp (P8). Só então implemento a integração real — com sua aprovação expressa.
6. **Fornecer conteúdo**: logotipo, fotos, textos da casa e dos produtos, endereço, horários, WhatsApp, CNPJ (P3–P5).

## 5. O que não foi verificado

- Não comparei o canvas publicado com os arquivos de `design/` do repositório; usei o repositório como fonte (conforme `CLAUDE.md`). Li a fundo apenas `Loja-Sacola.dc.html` e `tokens.css`; as outras telas serão lidas ao implementar cada uma.
- Não renderizei nenhuma tela (a própria `AUDIT.md` lista isso como pendência A1).
- Não verifiquei se o container tem Docker para rodar o Supabase local; se não tiver, as migrations serão validadas num projeto de desenvolvimento ou num *branch* do Supabase (depende de I-1).
