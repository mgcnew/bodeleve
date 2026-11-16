import type { Item, Lot, Movement, ProductionOrder, Recipe } from '@/domain/backoffice'
import { daysFromToday } from '@/domain/dates'
import { itemsStore, newId, productionStore, recipesStore, stockStore } from './backoffice'
import { sessionStore } from './session'
import { lotsOf, physicalOf, type StockContext } from './stock'

// H-G16 — ficha por fornada: custo por unidade calculado e margem sobre o preço
export function batchCostCents(recipe: Recipe, items: Item[]) {
  const inputs = recipe.lines.reduce((n, l) => n + l.qty * (items.find((i) => i.id === l.itemId)?.costCents ?? 0), 0)
  return Math.round(inputs + recipe.indirectCostCents)
}

export function unitCostCents(recipe: Recipe, items: Item[]) {
  return Math.round(batchCostCents(recipe, items) / recipe.yieldQty)
}

/** margem sobre o preço de venda, 0 a 1 */
export function margin(costCents: number, priceCents: number | null) {
  return priceCents ? (priceCents - costCents) / priceCents : null
}

export type Need = { itemId: string; name: string; unit: Item['unit']; need: number; have: number; missing: number; incoming: number }

/**
 * H-G17 — criar ordem confere os insumos: o que há livre (físico menos reservado por outras
 * ordens) e o que está para chegar em compras enviadas.
 */
export function needsFor(recipe: Recipe, batches: number, items: Item[], ctx: StockContext): Need[] {
  return recipe.lines.map((l) => {
    const item = items.find((i) => i.id === l.itemId)!
    const physical = physicalOf(l.itemId, ctx.movements)
    const reservedByOthers = (ctx.production ?? [])
      .filter((p) => p.status === 'planned' || p.status === 'in_progress')
      .reduce((n, p) => n + (recipesStore.get().find((r) => r.id === p.recipeId)?.lines.find((x) => x.itemId === l.itemId)?.qty ?? 0) * p.batches, 0)
    const have = Math.round((physical - reservedByOthers) * 1000) / 1000
    const need = Math.round(l.qty * batches * 1000) / 1000
    const incoming = ctx.purchases
      .filter((p) => p.status === 'sent' || p.status === 'partially_received')
      .reduce((n, p) => n + p.items.filter((i) => i.itemId === l.itemId).reduce((a, i) => a + Math.max(0, i.qty - i.receivedQty), 0), 0)
    return { itemId: l.itemId, name: item.name, unit: item.unit, need, have, missing: Math.max(0, Math.round((need - have) * 1000) / 1000), incoming }
  })
}

export function nextOrderNumber() {
  const max = Math.max(0, ...productionStore.get().map((p) => Number(p.number.replace(/\D/g, ''))))
  return `OP-${String(max + 1).padStart(4, '0')}`
}

export function createOrder(input: { recipe: Recipe; batches: number; destination: ProductionOrder['destination']; startAt: string }): ProductionOrder {
  const op: ProductionOrder = {
    id: newId('op'),
    number: nextOrderNumber(),
    recipeId: input.recipe.id,
    productId: input.recipe.productId,
    batches: input.batches,
    plannedQty: input.recipe.yieldQty * input.batches,
    destination: input.destination,
    status: 'planned',
    startAt: input.startAt,
    endAt: new Date(new Date(input.startAt).getTime() + 9 * 3_600_000).toISOString(),
    goodQty: null,
    lotCode: null,
    consumptions: null,
    realUnitCostCents: null,
  }
  productionStore.set((all) => [op, ...all])
  return op
}

export function removeOrder(id: string) {
  productionStore.set((all) => all.filter((p) => p.id !== id))
}

export function startOrder(id: string) {
  productionStore.set((all) => all.map((p) => (p.id === id ? { ...p, status: 'in_progress', startAt: new Date().toISOString() } : p)))
}

export type Completion = { orderId: string; previous: ProductionOrder; movementIds: string[]; lotId: string | null }

/**
 * H-G18 — ao concluir: consumo real e unidades boas apontados; o lote do acabado entra no estoque
 * e o custo real substitui o previsto. Insumos saem do lote que vence primeiro.
 */
export function completeOrder(
  orderId: string,
  input: { consumptions: { itemId: string; qty: number }[]; goodQty: number; lotCode: string; expiry: string | null },
): Completion {
  const op = productionStore.get().find((p) => p.id === orderId)
  if (!op) throw new Error('ordem não encontrada')
  const recipe = recipesStore.get().find((r) => r.id === op.recipeId)!
  const items = itemsStore.get()
  const { lots, movements } = stockStore.get()
  const now = new Date().toISOString()
  const by = sessionStore.get()?.name ?? 'Equipe'

  const created: Movement[] = []
  for (const c of input.consumptions) {
    if (c.qty <= 0) continue
    const item = items.find((i) => i.id === c.itemId)
    let left = c.qty
    // consome lote por lote, do que vence primeiro; o que não tiver lote sai direto
    const source = item?.tracksLots ? lotsOf(c.itemId, lots, movements) : []
    for (const lot of source) {
      if (left <= 0) break
      const take = Math.min(lot.qty, left)
      created.push({ id: newId('mv'), itemId: c.itemId, lotId: lot.id, type: 'production_out', qty: -take, at: now, note: `Consumo · ${op.number}`, by, ref: op.id })
      left = Math.round((left - take) * 1000) / 1000
    }
    if (left > 0) created.push({ id: newId('mv'), itemId: c.itemId, lotId: null, type: 'production_out', qty: -left, at: now, note: `Consumo · ${op.number}`, by, ref: op.id })
  }

  let lot: Lot | null = null
  if (input.goodQty > 0) {
    const product = items.find((i) => i.id === op.productId)
    const code = input.lotCode.trim()
    if (product?.tracksLots && code) {
      lot = { id: newId('lot'), itemId: op.productId, code, expiry: input.expiry, unitCostCents: 0, createdAt: now }
    }
    created.push({ id: newId('mv'), itemId: op.productId, lotId: lot?.id ?? null, type: 'production_in', qty: input.goodQty, at: now, note: `Entrada do lote ${code || '—'} · ${op.number}`, by, ref: op.id })
  }

  const consumedCost = input.consumptions.reduce((n, c) => n + c.qty * (items.find((i) => i.id === c.itemId)?.costCents ?? 0), 0)
  const realUnit = input.goodQty > 0 ? Math.round((consumedCost + recipe.indirectCostCents * op.batches) / input.goodQty) : null
  if (lot && realUnit !== null) lot.unitCostCents = realUnit

  stockStore.set((s) => ({ lots: lot ? [...s.lots, lot] : s.lots, movements: [...s.movements, ...created] }))
  // H-G18 — o custo real substitui o previsto no item
  if (realUnit !== null) itemsStore.set((all) => all.map((i) => (i.id === op.productId ? { ...i, costCents: realUnit } : i)))
  productionStore.set((all) =>
    all.map((p) => (p.id === orderId ? { ...p, status: 'done', goodQty: input.goodQty, lotCode: input.lotCode.trim() || null, consumptions: input.consumptions, realUnitCostCents: realUnit, endAt: now } : p)),
  )
  return { orderId, previous: op, movementIds: created.map((m) => m.id), lotId: lot?.id ?? null }
}

export function undoCompletion(c: Completion, previousItemCost: number) {
  stockStore.set((s) => ({ lots: s.lots.filter((l) => l.id !== c.lotId), movements: s.movements.filter((m) => !c.movementIds.includes(m.id)) }))
  itemsStore.set((all) => all.map((i) => (i.id === c.previous.productId ? { ...i, costCents: previousItemCost } : i)))
  productionStore.set((all) => all.map((p) => (p.id === c.orderId ? c.previous : p)))
}

export function defaultExpiry(recipe: Recipe) {
  return daysFromToday(recipe.shelfLifeDays).slice(0, 10)
}
