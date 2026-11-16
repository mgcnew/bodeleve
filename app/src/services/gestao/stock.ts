// Saldos derivados das movimentações (DATA_MODEL_DRAFT.md):
// físico = Σ movimentos · reservado = pedidos em aberto · disponível = físico − reservado
// projetado = disponível + a receber (compras enviadas) + em produção
import type { Item, Lot, Movement, Purchase } from '@/domain/backoffice'
import type { StaffOrder } from '@/domain/staffOrder'
import { daysUntil } from '@/domain/dates'

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

export function balanceOf(itemId: string, ctx: { movements: Movement[]; orders: StaffOrder[]; purchases: Purchase[]; inProduction?: number }): Balance {
  const physical = physicalOf(itemId, ctx.movements)
  const reserved = reservedOf(itemId, ctx.orders)
  const available = round(physical - reserved)
  const incoming = incomingOf(itemId, ctx.purchases)
  const inProduction = ctx.inProduction ?? 0
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
