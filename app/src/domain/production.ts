import { itemBalance, itemLabel, lotsFefo, type Lot, type StockItem, type StockMovement } from './inventory'

/**
 * Produção (H-G14 a H-G19): ficha técnica por fornada, ordem de produção para estoque ou para pedido,
 * conferência de insumos, apontamento do consumo real e entrada do lote acabado com custo real.
 */

export type RecipeLine = {
  itemId: string
  /** Quantidade por fornada, em unidades de estoque (0,4 un de coalho líquido = 20 ml). */
  qtyPerBatch: number
}

export type Recipe = {
  id: string
  /** Produto acabado que sai da ficha. */
  itemId: string
  yieldPerBatch: number
  /** "fornada", "tacho", "lote" */
  batchLabel: string
  shelfLifeDays: number
  lines: RecipeLine[]
  /** Gás e energia: custo indireto estimado por fornada (H-G19). */
  overheadCents: number
  /** Conteúdo do dono (P5). */
  method: string
  /** Prefixo do código de lote ("QC"). */
  lotPrefix: string
}

export type ProductionStatus = 'planned' | 'in_progress' | 'done'

export type Destination = { kind: 'stock' } | { kind: 'order'; orderId: string }

export type ProductionOrder = {
  /** "OP-0032" */
  id: string
  recipeId: string
  itemId: string
  batches: number
  plannedQty: number
  status: ProductionStatus
  destination: Destination
  startsAt: string
  endsAt: string | null
  startedAt: string | null
  doneAt: string | null
  /** Preenchidos no apontamento. */
  goodQty: number | null
  lotCode: string | null
  expiresAt: string | null
  costPerUnitCents: number | null
  /** Para corrigir o apontamento. */
  lotId: string | null
  movementIds: string[]
  reservationIds: string[]
}

export class ProductionError extends Error {
  constructor(
    public code: 'not_found' | 'invalid_state' | 'invalid_input' | 'insufficient' | 'cannot_reverse',
    public detail?: string,
  ) {
    super(code)
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Quanto de cada insumo a ordem pede: quantidade por fornada × fornadas. */
export function needs(recipe: Recipe, batches: number): Array<{ itemId: string; qty: number }> {
  return recipe.lines.map((l) => ({ itemId: l.itemId, qty: round2(l.qtyPerBatch * batches) }))
}

/** Custo de uma fornada: insumos pelo custo atual + gás e energia (R$ 142,00 no queijo coalho). */
export function batchCostCents(recipe: Recipe, costOf: (itemId: string) => number): number {
  return Math.round(recipe.lines.reduce((a, l) => a + l.qtyPerBatch * costOf(l.itemId), 0) + recipe.overheadCents)
}

export const unitCostCents = (recipe: Recipe, costOf: (itemId: string) => number) => Math.round(batchCostCents(recipe, costOf) / recipe.yieldPerBatch)

/** Margem sobre o preço, arredondada para baixo como no quadro (54,5% aparece como 54%). */
export function marginPercent(priceCents: number, costCents: number): number {
  if (priceCents <= 0) return 0
  return Math.round(((priceCents - costCents) / priceCents) * 100 - 0.0001)
}

/** "40 L", "20 ml", "0,5 kg", "10 un": a quantidade na unidade que a pessoa conhece. */
export function formatContent(units: number, item: Pick<StockItem, 'content'>): string {
  const c = item.content ?? { qty: 1, unit: 'un' }
  const v = round2(units * c.qty)
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${c.unit}`
}

export type InputCheck = {
  itemId: string
  need: number
  have: number
  missing: number
  /** Quanto da falta já está a caminho em compras que chegam hoje. */
  incomingToday: number
}

export type CheckSummary = { lines: InputCheck[]; missingAny: boolean; /** Só falta o que chega hoje: a ordem pode ser criada. */ coveredByIncoming: boolean }

/** H-G17: confere os insumos. O que falta e chega hoje avisa; o que falta sem compra a caminho deixa a ordem planejada. */
export function checkInputs(
  recipe: Recipe,
  batches: number,
  have: (itemId: string) => number,
  incomingToday: (itemId: string) => number,
): CheckSummary {
  const lines = needs(recipe, batches).map((n) => {
    const h = have(n.itemId)
    const missing = Math.max(0, round2(n.qty - h))
    return { itemId: n.itemId, need: n.qty, have: h, missing, incomingToday: incomingToday(n.itemId) }
  })
  const short = lines.filter((l) => l.missing > 0)
  return { lines, missingAny: short.length > 0, coveredByIncoming: short.length > 0 && short.every((l) => l.missing <= l.incomingToday) }
}

/** Próximo número de ordem: OP-0036 depois da OP-0035. */
export function nextOrderId(existing: string[]): string {
  const n = existing.reduce((a, id) => Math.max(a, Number(id.replace(/\D/g, '')) || 0), 0) + 1
  return `OP-${String(n).padStart(4, '0')}`
}

/** Sugestão de código de lote: prefixo + próximo número depois do maior já usado ("QC-1112" → "QC-1113"). */
export function suggestLotCode(prefix: string, lots: Array<Pick<Lot, 'code'>>): string {
  const nums = lots.filter((l) => l.code.startsWith(`${prefix}-`)).map((l) => Number(l.code.slice(prefix.length + 1)) || 0)
  return `${prefix}-${(nums.length ? Math.max(...nums) : 1000) + 1}`
}

export type Ledger = { lots: Lot[]; movements: StockMovement[] }

const nextId = (prefix: string, ids: string[]) => `${prefix}${ids.reduce((a, id) => Math.max(a, Number(id.slice(prefix.length)) || 0), 0) + 1}`

export type FinishInput = {
  consumption: Array<{ itemId: string; qty: number }>
  goodQty: number
  lotCode: string
  expiresAt: string | null
}

/** Baixa o insumo pelos lotes que vencem primeiro. Não deixa o estoque ficar negativo. */
function takeFefo(st: Ledger, itemId: string, qty: number, ref: string, at: string): { movements: StockMovement[]; costCents: number } {
  const created: StockMovement[] = []
  let left = qty
  let cost = 0
  for (const lot of lotsFefo(st.lots, st.movements, itemId)) {
    if (left <= 1e-9) break
    const take = Math.min(left, lot.balance)
    created.push({ id: nextId('mv-', [...st.movements, ...created].map((m) => m.id)), itemId, lotId: lot.id, type: 'production_out', qty: -round2(take), at, ref, description: `Produção · ${ref} · consumo` })
    cost += take * lot.unitCostCents
    left -= take
  }
  if (left > 1e-9) throw new ProductionError('insufficient', itemId)
  return { movements: created, costCents: cost }
}

/**
 * Conclui a ordem (H-G18): baixa o consumo real dos insumos, dá entrada no lote do acabado e calcula o custo real por unidade
 * (consumo real × custo dos lotes + gás e energia de cada fornada ÷ unidades boas). Nada é lançado se faltar insumo.
 */
export function finishOrder(
  st: Ledger,
  order: ProductionOrder,
  recipe: Recipe,
  input: FinishInput,
  now: Date,
): { order: ProductionOrder; entered: StockMovement; consumed: StockMovement[] } {
  if (order.status !== 'in_progress') throw new ProductionError('invalid_state')
  if (!(input.goodQty >= 0) || !input.lotCode.trim()) throw new ProductionError('invalid_input', 'lot')
  const at = now.toISOString()
  // Simula primeiro numa cópia para não deixar lançamentos pela metade.
  const trial: Ledger = { lots: st.lots, movements: [...st.movements] }
  const consumed: StockMovement[] = []
  let cost = 0
  for (const c of input.consumption) {
    if (!(c.qty > 0)) continue
    const r = takeFefo(trial, c.itemId, c.qty, order.id, at)
    trial.movements.push(...r.movements)
    consumed.push(...r.movements)
    cost += r.costCents
  }
  cost += recipe.overheadCents * order.batches
  const unitCost = input.goodQty > 0 ? Math.round(cost / input.goodQty) : 0

  const lotId = nextId('lot-', st.lots.map((l) => l.id))
  const lot: Lot = { id: lotId, itemId: order.itemId, code: input.lotCode.trim(), expiresAt: input.expiresAt, unitCostCents: unitCost, receivedAt: at, source: order.id }
  const entered: StockMovement = {
    id: nextId('mv-', [...trial.movements].map((m) => m.id)),
    itemId: order.itemId,
    lotId,
    type: 'production_in',
    qty: input.goodQty,
    at,
    ref: order.id,
    description: `Produção · ${order.id} · Entrada do lote ${lot.code}`,
  }
  st.movements.push(...consumed, entered)
  st.lots.push(lot)
  const done: ProductionOrder = {
    ...order,
    status: 'done',
    doneAt: at,
    goodQty: input.goodQty,
    lotCode: lot.code,
    expiresAt: input.expiresAt,
    costPerUnitCents: unitCost,
    lotId,
    movementIds: [...consumed.map((m) => m.id), entered.id],
  }
  return { order: done, entered, consumed }
}

/** Corrige o apontamento: devolve os insumos e tira o lote acabado, se nada saiu dele. */
export function undoFinish(st: Ledger, order: ProductionOrder): ProductionOrder {
  if (order.status !== 'done' || !order.lotId) throw new ProductionError('invalid_state')
  const lotBal = st.movements.filter((m) => m.lotId === order.lotId).reduce((a, m) => a + m.qty, 0)
  if (lotBal < (order.goodQty ?? 0)) throw new ProductionError('cannot_reverse')
  st.movements = st.movements.filter((m) => !order.movementIds.includes(m.id))
  st.lots = st.lots.filter((l) => l.id !== order.lotId)
  return { ...order, status: 'in_progress', doneAt: null, goodQty: null, lotCode: null, expiresAt: null, costPerUnitCents: null, lotId: null, movementIds: [] }
}

/** Saldo físico do item, exposto aqui para as telas de ficha não precisarem conhecer movimentações. */
export const haveOf = (movements: StockMovement[], itemId: string) => itemBalance(movements, itemId)
export { itemLabel }
