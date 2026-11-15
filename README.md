# Bodeleve

Plataforma da Bodeleve, uma Casa do Norte: gestão administrativa, PDV (frente de caixa), loja online e app de entregas.

O **design está completo** (75 telas, 7 etapas). A próxima fase é a implementação com Supabase; comece por `CLAUDE.md`. Nada aqui é funcional ainda — sem banco, pagamentos ou estoque reais.

## Estrutura

| Pasta | O que tem |
|---|---|
| `docs/` | Documentos do projeto. São a fonte de verdade: visão, arquitetura, mapa de telas, design system, regras de negócio, modelo de dados, decisões e roadmap. |
| `design/` | Telas e quadros do canvas de design (arquivos `.dc.html` e `canvas.json`) e `tokens.css`. Os `.dc.html` abrem como telas apenas no canvas de design do Claude; aqui servem de referência versionada. |
| `app/` | O aplicativo (Vite, React e TypeScript). Hoje contém o design system em componentes e o catálogo para visualizá-los: `cd app && npm install && npm run dev`. |
| `gen/` | Scripts Python que geram os arquivos de `design/`. |

## Onde começar

1. `CLAUDE.md` — instruções para quem vai implementar.
2. `docs/DECISIONS.md` — o que está decidido, o que é hipótese e o que está pendente (inclui o que depende do dono).
3. `docs/ROADMAP.md` — etapas e situação de cada uma.
4. `docs/BUSINESS_RULES.md` — perguntas de negócio ainda em aberto.
5. `docs/AUDIT.md` — auditoria de acessibilidade e consistência.

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

## Gerar as telas de novo

```bash
cd gen
python3 b16_entregas.py   # regenera gestão, PDV e entregas em ../design (b8_loja3.py: loja; b1–b5: design system; b17_responsivo.py: tablet e computador)
```

Requer apenas Python 3. Todos os dados das telas são fictícios.
