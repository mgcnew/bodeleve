# Bodeleve

Plataforma da Bodeleve, uma Casa do Norte: gestão administrativa, PDV (frente de caixa), loja online e app de entregas.

O **design está completo** (75 telas, 7 etapas) e a **frente de telas está implementada** em `app/` (loja, gestão, PDV e app de Entregas), com dados e serviços **simulados** no navegador. Falta o banco: o Supabase só entra quando o dono o conectar (D19). Pagamento real (Pix, cartão) e envio de mensagens (WhatsApp) continuam fora até ele aprovar (D21). Comece por `CLAUDE.md` e por `docs/OWNER_CHECKLIST.md`.

## Estrutura

| Pasta | O que tem |
|---|---|
| `docs/` | Documentos do projeto. São a fonte de verdade: visão, arquitetura, mapa de telas, design system, regras de negócio, modelo de dados, decisões e roadmap. |
| `design/` | Telas e quadros do canvas de design (arquivos `.dc.html` e `canvas.json`) e `tokens.css`. Os `.dc.html` abrem como telas apenas no canvas de design do Claude; aqui servem de referência versionada. |
| `app/` | O aplicativo (Vite, React e TypeScript): design system (`/design-system`), loja (`/`), gestão (`/gestao`), PDV (`/pdv`) e app de Entregas (`/entregas`), com serviços simulados: `cd app && npm install && npm run dev`. |
| `gen/` | Scripts Python que geram os arquivos de `design/`. |

## Onde começar

1. `CLAUDE.md` — instruções para quem vai implementar.
2. `docs/DECISIONS.md` — o que está decidido, o que é hipótese e o que está pendente (inclui o que depende do dono).
3. `docs/ROADMAP.md` — etapas e situação de cada uma.
4. `docs/BUSINESS_RULES.md` — perguntas de negócio ainda em aberto.
5. `docs/AUDIT.md` — auditoria de acessibilidade e consistência.

## Como ver rodando

```bash
cd app && npm install && npm run dev      # http://localhost:5173
```

| Ambiente | Endereço | Entrar com |
|---|---|---|
| Loja | `/` | sem conta; código de teste `1234` para "Entrar" |
| Gestão | `/gestao/entrar` | `dono@exemplo.com` (tudo), `ana@exemplo.com` (gestor), `julia@exemplo.com` (atendente), `raimundo@exemplo.com` (produção); senha `bodeleve` |
| PDV | `/pdv` | Júlia, Ana ou o dono; senha do gestor para cancelar venda: `2468` (Ana) ou `1357` (dono) |
| Entregas | `/entregas/entrar` | celular `(00) 90000-0300` (Bruno, da casa), `…0301` (Carlos, da casa), `…0302` (Diego, parceiro); código `1234` |

Em desenvolvimento a base de exemplo traz pedidos, estoque, caixa aberto e entregas. Para ver o fluxo de entrega do começo ao fim: em Gestão → Pedidos, abra o #1041, aceite e marque como pronto; em Entregas, entre como Bruno, pegue e aceite a entrega; confira, saia, informe o código do pedido (o do #1041 é `2290`) e acompanhe tudo no painel Gestão → Entregas. Nada é cobrado nem enviado. Testes: `npm test`; `npm run lint`; `npm run build`.

## Situação


| Etapa | Situação |
|---|---|
| 1 — Discovery | Aprovada |
| 2 — Design system | Aprovada |
| 3 — Loja online (18 telas) | Entregue |
| 4 — Gestão (36 telas) | Entregue |
| 5 — PDV | Entregue |
| 6 — Entregas | Entregue |
| 7 — Auditoria | Entregue |

Implementação em `app/`: Etapas 2 a 7 entregues na simulação (ver `docs/ROADMAP.md`); Etapa 1 (Supabase) aguarda o dono.

## Gerar as telas de novo

```bash
cd gen
python3 b16_entregas.py   # regenera gestão, PDV e entregas em ../design (b8_loja3.py: loja; b1–b5: design system; b17_responsivo.py: tablet e computador)
```

Requer apenas Python 3. Todos os dados das telas são fictícios.
