# Bodeleve

Plataforma da Bodeleve, uma Casa do Norte: gestão administrativa, PDV (frente de caixa), loja online e app de entregas.

O projeto está na fase **design first**: primeiro o design e os protótipos navegáveis, depois a implementação com Supabase. Nada aqui é funcional ainda — sem banco, pagamentos ou estoque reais.

## Estrutura

| Pasta | O que tem |
|---|---|
| `docs/` | Documentos do projeto. São a fonte de verdade: visão, arquitetura, mapa de telas, design system, regras de negócio, modelo de dados, decisões e roadmap. |
| `design/` | Telas e quadros do canvas de design (arquivos `.dc.html` e `canvas.json`). Abrem como telas apenas no canvas de design do Claude; aqui servem de cópia versionada. |
| `gen/` | Scripts Python que geram os arquivos de `design/`. |

## Onde começar

1. `docs/DECISIONS.md` — o que está decidido, o que é hipótese e o que está pendente.
2. `docs/ROADMAP.md` — etapas e situação de cada uma.
3. `docs/BUSINESS_RULES.md` — perguntas de negócio ainda em aberto.

## Situação

| Etapa | Situação |
|---|---|
| 1 — Discovery | Aprovada |
| 2 — Design system | Aprovada |
| 3 — Loja online (18 telas) | Entregue |
| 4 — Gestão (36 telas) | Entregue |
| 5 — PDV | Entregue |
| 6 — Entregas | Entregue |
| 7 — Auditoria | A fazer |

## Gerar as telas de novo

```bash
cd gen
python3 b9_gestao1.py   # cada script b*.py gera um grupo de telas em ../design
```

Requer apenas Python 3. Todos os dados das telas são fictícios.
