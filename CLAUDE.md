# Bodeleve — instruções para o Claude Code

Plataforma da Bodeleve (Casa do Norte): loja online, gestão, PDV e app de entregas. O design está pronto; a próxima fase é implementar com Supabase.

## Fonte de verdade

1. `docs/DECISIONS.md` — decisões aprovadas (D*), propostas aprovadas (P-*), hipóteses a confirmar (H-*) e pendências. Leia primeiro.
2. `docs/BUSINESS_RULES.md` — regras confirmadas, hipóteses e perguntas abertas (Q1–Q16).
3. `docs/SCREEN_MAP.md` — as 75 telas e o arquivo de design de cada uma.
4. `docs/DESIGN_SYSTEM.md` + `design/tokens.css` — tokens, componentes e regras de uso.
5. `docs/DATA_MODEL_DRAFT.md` — rascunho do modelo de dados (por estabelecimento, RLS).
6. `docs/AUDIT.md` — o que foi conferido e as regras de acessibilidade a manter.

## Regras

- **Reproduza as telas de `design/` com fidelidade.** Cada `.dc.html` tem cores, tamanhos, espaçamentos, textos e comportamento escritos de forma explícita. É referência visual e de interação, não código para copiar: as marcações `<x-dc>`, `<sc-if>`, `<sc-for>` e `DCLogic` são do canvas de design e não rodam fora dele.
- **Use `design/tokens.css`.** Não redigite valores de cor, fonte, espaço ou raio.
- **Hipótese não é regra.** Itens H-* em `DECISIONS.md` foram usados para desenhar, mas podem mudar. Isole-os (configuração, constante ou tabela) para trocar sem refazer telas.
- **Textos entre [colchetes]** são conteúdo que o dono ainda vai fornecer. Mantenha como conteúdo editável, nunca fixo no código.
- **Dados das telas são fictícios.** Use-os só como dados de exemplo (seed) em ambiente de desenvolvimento.
- **Não mude decisão aprovada sem registrar** em `DECISIONS.md` (seção "Alterações de decisões aprovadas").
- **Mobile-first**: 360–430 px primeiro. Tablet e computador seguem `Resp-*.dc.html` e a seção "Responsivo" de `DESIGN_SYSTEM.md`.
- **Acessibilidade**: manter o que `AUDIT.md` lista (contraste AA, rótulos, nomes em botões de ícone, alvo mínimo 44 px, cor nunca como único sinal).

## Ordem sugerida de implementação

> Banco de dados congelado até o dono conectar o Supabase (D19 em `docs/DECISIONS.md`): não crie projeto, migration, tabela, política ou seed. Pagamento e mensagens reais seguem fora (D21). Plano completo em `docs/IMPLEMENTATION_PLAN.md`.

1. Supabase: projeto, Auth, tabelas do `DATA_MODEL_DRAFT.md` com `establishment_id` e RLS por papel (H-G27). **Pendente**: depende do dono (D19). A seção "Ajustes ao modelo" do `DATA_MODEL_DRAFT.md` lista o que a implementação simulada precisou além do rascunho.
2. Design system em componentes (tokens, botões, campos, etiquetas, selos, barras, folha, modal, estados).
3. Loja online (Fluxo 4) — catálogo público sem login, checkout sem conta.
4. Gestão: pedidos → estoque → compras/recebimento → produção → financeiro → demais módulos.
5. PDV (Fluxo 3), com caixa e funcionamento estável em conexão ruim.
6. App de entregas (Fluxo 5) e painel de atribuição.
7. Realtime onde o `DATA_MODEL_DRAFT.md` indica (pedidos novos, status do pedido, entregas disponíveis).

Antes de pagamentos reais (Pix, cartão), nota fiscal e área de entrega, confirme com o dono as pendências Q6–Q8, Q12 e Q14.

## Estrutura

- `docs/` — documentação do projeto
- `design/` — telas do canvas (`*.dc.html`), índice `canvas.json`, `tokens.css`
- `app/` — o aplicativo (Vite, React, TypeScript): loja (`/`), gestão (`/gestao`), PDV (`/pdv`) e Entregas (`/entregas`), tudo com serviços simulados em `src/mocks`. `cd app && npm run dev` (catálogo do design system), `npm test`, `npm run lint`, `npm run build`. Componentes em `src/components`, tokens vêm de `../design/tokens.css`
- `gen/` — scripts Python que geram as telas (`cd gen && python3 b16_entregas.py` regenera gestão, PDV e entregas; `b8_loja3.py` a loja; `b1`–`b5` o design system; `b17_responsivo.py` as referências de tablet e computador)
