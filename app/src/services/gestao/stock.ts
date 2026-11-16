// Saldos derivados das movimentações (DATA_MODEL_DRAFT.md):
// físico = Σ movimentos · reservado = pedidos em aberto · disponível = físico − reservado
// projetado = disponível + a receber (compras enviadas) + em produção
import type { Item, Lot, Movement, ProductionOrder, Purchase } from '@/domain/backoffice'
import type { StaffOrder } from '@/domain/staffOrder'
import { daysUntil } from '@/domain/dates'
import { itemsStore, newId, stockStore } from './backoffice'
import { sessionStore } from './session'

export type Balance = { physical: number; reserved: number; available: number; incoming: number; inProduction: number; projected: number }

const round = (n: number) => Math.round(n * 1000) / 1000

export function physicalOf(itemId: string, movements: Movement[]) {
  return round(movements.reduce((n, m) => (m.itemId === itemId ? n + m.qty : n), 0))
}

export function reservedOf(itemId: string, orders: StaffOrder[]) {
  return orders
    .filter((o) => o.status === 'new' || o.status === 'separating' || o.status === 'ready')
    .reduce((n, o) => n + o.items.filter((i) => i.productId === itemId).reduce((a, i) => a + i.quantity, 0), 0)
}

export function incomingOf(itemId: string, purchases: Purchase[]) {
  return purchases
    .filter((p) => p.status === 'sent' || p.status === 'partially_received')
    .reduce((n, p) => n + p.items.filter((i) => i.itemId === itemId).reduce((a, i) => a + Math.max(0, i.qty - i.receivedQty), 0), 0)
}

export function inProductionOf(itemId: string, production: ProductionOrder[]) {
  return production.filter((p) => p.productId === itemId && (p.status === 'in_progress' || p.status === 'planned')).reduce((n, p) => n + p.plannedQty, 0)
}

export type StockContext = { movements: Movement[]; orders: StaffOrder[]; purchases: Purchase[]; production?: ProductionOrder[] }

export function balanceOf(itemId: string, ctx: StockContext): Balance {
  const physical = physicalOf(itemId, ctx.movements)
  const reserved = reservedOf(itemId, ctx.orders)
  const available = round(physical - reserved)
  const incoming = incomingOf(itemId, ctx.purchases)
  const inProduction = ctx.production ? inProductionOf(itemId, ctx.production) : 0
  return { physical, reserved, available, incoming, inProduction, projected: round(available + incoming + inProduction) }
}

export type LotBalance = Lot & { qty: number }

/** Lotes com saldo, do que vence primeiro ao último (H-G11: sai primeiro o que vence antes) */
export function lotsOf(itemId: string, lots: Lot[], movements: Movement[]): LotBalance[] {
  return lots
    .filter((l) => l.itemId === itemId)
    .map((l) => ({ ...l, qty: round(movements.reduce((n, m) => (m.lotId === l.id ? n + m.qty : n), 0)) }))
    .filter((l) => l.qty > 0)
    .sort((a, b) => (a.expiry ?? '9999').localeCompare(b.expiry ?? '9999'))
}

export function isLow(item: Item, available: number) {
  return available < item.minStock
}

/** lotes que vencem em até `days` dias */
export function expiringLots(lots: LotBalance[], days = 7) {
  return lots.filter((l) => l.expiry && daysUntil(l.expiry) <= days)
}

// ---------- ações ----------

export type AdjustmentKind = 'loss' | 'internal' | 'correction'

/**
 * H-G12 — perda e consumo interno registram lote, motivo e custo;
 * correção de contagem pode tirar ou somar. Devolve o id para desfazer.
 */
export function registerAdjustment(input: { itemId: string; lotId: string | null; kind: AdjustmentKind; qty: number; reason: string }) {
  const kindNote = { loss: 'Perda', internal: 'Consumo interno', correction: 'Correção de contagem' }[input.kind]
  const m: Movement = {
    id: newId('mv'),
    itemId: input.itemId,
    lotId: input.lotId,
    type: input.kind === 'correction' ? 'adjustment' : 'loss',
    qty: input.qty,
    at: new Date().toISOString(),
    note: input.reason ? `${kindNote} · ${input.reason.toLowerCase()}` : kindNote,
    by: sessionStore.get()?.name ?? 'Equipe',
    ref: null,
  }
  stockStore.set((s) => ({ ...s, movements: [...s.movements, m] }))
  return m.id
}

export function removeMovements(ids: string[]) {
  stockStore.set((s) => ({ ...s, movements: s.movements.filter((m) => !ids.includes(m.id)) }))
}

/** Inventário: lança a diferença entre contado e sistema; falta sai do lote que vence primeiro */
export function applyInventory(counts: { itemId: string; counted: number }[]) {
  const { lots, movements } = stockStore.get()
  const by = sessionStore.get()?.name ?? 'Equipe'
  const now = new Date().toISOString()
  const created: Movement[] = []
  for (const c of counts) {
    const diff = round(c.counted - physicalOf(c.itemId, movements))
    if (diff === 0) continue
    const item = itemsStore.get().find((i) => i.id === c.itemId)
    const lot = diff < 0 && item?.tracksLots ? lotsOf(c.itemId, lots, movements)[0] ?? null : null
    created.push({ id: newId('mv'), itemId: c.itemId, lotId: lot?.id ?? null, type: 'inventory', qty: diff, at: now, note: 'Inventário', by, ref: null })
  }
  stockStore.set((s) => ({ ...s, movements: [...s.movements, ...created] }))
  return created.map((m) => m.id)
}
