import { daysUntil, itemBalance, levelOf, lotBalance, lotsFefo, type Lot, type StockItem, type StockLevel, type StockMovement } from './inventory'
import type { PurchaseOrder } from './purchasing'
import type { Order } from './types'

/**
 * Saldos de estoque (BUSINESS_RULES H1): físico = Σ movimentações; reservado = pedidos online em aberto + reservas manuais;
 * disponível = físico − reservado; projetado = disponível + a receber + em produção.
 */

export type Reservation = { id: string; itemId: string; qty: number; ref: string }

/** Pedido online que ainda não saiu da casa reserva estoque (H2); ao sair, vira saída de venda. */
const RESERVING: Order['status'][] = ['received', 'preparing', 'ready_for_delivery', 'ready_for_pickup']

export type ReservedInfo = { qty: number; orders: number; manual: number }

export function reservedByItem(orders: Order[], manual: Reservation[]): Map<string, ReservedInfo> {
  const map = new Map<string, ReservedInfo>()
  const bump = (id: string, qty: number, kind: 'orders' | 'manual') => {
    const cur = map.get(id) ?? { qty: 0, orders: 0, manual: 0 }
    cur.qty += qty
    cur[kind] += 1
    map.set(id, cur)
  }
  for (const o of orders) {
    if (o.channel !== 'online' || !RESERVING.includes(o.status)) continue
    for (const i of o.items) bump(i.productId, i.qty, 'orders')
  }
  for (const r of manual) bump(r.itemId, r.qty, 'manual')
  return map
}

export function incomingByItem(purchases: PurchaseOrder[], now: Date): Map<string, { qty: number; today: number }> {
  const map = new Map<string, { qty: number; today: number }>()
  for (const po of purchases) {
    if (po.status !== 'sent' && po.status !== 'partially_received') continue
    for (const i of po.items) {
      const left = i.qty - i.receivedQty
      if (left <= 0) continue
      const cur = map.get(i.itemId) ?? { qty: 0, today: 0 }
      cur.qty += left
      if (daysUntil(po.expectedAt, now) <= 0) cur.today += left
      map.set(i.itemId, cur)
    }
  }
  return map
}

export type StockRow = {
  itemId: string
  name: string
  itemType: StockItem['itemType']
  origin: StockItem['origin']
  categoryId: string
  physical: number
  reserved: number
  available: number
  incoming: number
  incomingToday: number
  inProduction: number
  projected: number
  min: number
  level: StockLevel
  /** Validade mais próxima entre os lotes com saldo. */
  nextExpiry: string | null
  expiringSoon: boolean
}

export const EXPIRING_DAYS = 7

export type StockState = {
  stockItems: StockItem[]
  lots: Lot[]
  movements: StockMovement[]
  orders: Order[]
  reservations: Reservation[]
  purchaseOrders: PurchaseOrder[]
  /** Quanto está sendo produzido, por item (módulo Produção, lote 4). */
  production?: Map<string, number>
}

export function buildRows(st: StockState, now: Date): StockRow[] {
  const reserved = reservedByItem(st.orders, st.reservations)
  const incoming = incomingByItem(st.purchaseOrders, now)
  return st.stockItems.map((it) => {
    const physical = itemBalance(st.movements, it.id)
    const res = reserved.get(it.id)?.qty ?? 0
    const available = physical - res
    const inc = incoming.get(it.id)
    const prod = st.production?.get(it.id) ?? 0
    const fefo = lotsFefo(st.lots, st.movements, it.id).filter((l) => l.expiresAt)
    const nextExpiry = fefo[0]?.expiresAt ?? null
    return {
      itemId: it.id,
      name: `${it.name} ${it.unit}`,
      itemType: it.itemType,
      origin: it.origin,
      categoryId: it.categoryId,
      physical,
      reserved: res,
      available,
      incoming: inc?.qty ?? 0,
      incomingToday: inc?.today ?? 0,
      inProduction: prod,
      projected: available + (inc?.qty ?? 0) + prod,
      min: it.minStock,
      // O nível olha o que pode ser vendido agora (disponível), não o que está na prateleira.
      level: levelOf(available, it.minStock),
      nextExpiry,
      expiringSoon: nextExpiry != null && daysUntil(nextExpiry, now) <= EXPIRING_DAYS,
    }
  })
}

/** Valor do estoque a custo de cada lote. */
export function stockValueCents(st: Pick<StockState, 'lots' | 'movements'>): number {
  return st.lots.reduce((a, l) => a + Math.max(0, lotBalance(st.movements, l.id)) * l.unitCostCents, 0)
}

/** "R$ 8,4 mil" (como no indicador do quadro) ou "R$ 840,00" quando é pouco. */
export function compactMoney(cents: number): string {
  const reais = cents / 100
  if (reais >= 1000) return `R$ ${(reais / 1000).toFixed(1).replace('.', ',')} mil`
  return `R$ ${reais.toFixed(2).replace('.', ',')}`
}

/** Itens com estoque baixo, do mais crítico (menor relação disponível/mínimo) ao menos. */
export function lowRows(rows: StockRow[]): StockRow[] {
  return rows
    .filter((r) => r.level !== 'ok')
    .sort((a, b) => a.available / Math.max(a.min, 1) - b.available / Math.max(b.min, 1) || a.name.localeCompare(b.name))
}

export function expiringLots(lots: Lot[], movements: StockMovement[], items: StockItem[], now: Date): Array<{ lot: Lot; balance: number; item: StockItem; days: number }> {
  return lots
    .map((lot) => ({ lot, balance: lotBalance(movements, lot.id), item: items.find((i) => i.id === lot.itemId)!, days: lot.expiresAt ? daysUntil(lot.expiresAt, now) : Infinity }))
    .filter((x) => x.balance > 0 && x.days <= EXPIRING_DAYS && x.item)
    .sort((a, b) => a.days - b.days)
}

// ───────────── Ajuste, perda e contagem ─────────────

export type AdjustKind = 'loss' | 'internal' | 'correction'

const label: Record<AdjustKind, string> = { loss: 'Perda', internal: 'Consumo interno', correction: 'Correção de contagem' }

export class StockError extends Error {
  constructor(public code: 'not_found' | 'insufficient' | 'invalid_qty' | 'cannot_reverse') {
    super(code)
  }
}

type Ledger = Pick<StockState, 'lots' | 'movements'>

const nextId = (prefix: string, ids: string[]) => `${prefix}${ids.reduce((a, id) => Math.max(a, Number(id.slice(prefix.length)) || 0), 0) + 1}`

/** Lança uma saída (ou, na correção, uma entrada) de um lote. Nunca deixa o lote ficar negativo. */
export function adjust(
  st: Ledger,
  input: { itemId: string; lotId: string; qty: number; kind: AdjustKind; reason: string; add?: boolean; by: string; now: Date },
): StockMovement {
  const lot = st.lots.find((l) => l.id === input.lotId && l.itemId === input.itemId)
  if (!lot) throw new StockError('not_found')
  if (!(input.qty > 0)) throw new StockError('invalid_qty')
  const sign = input.add ? 1 : -1
  if (sign < 0 && lotBalance(st.movements, lot.id) < input.qty) throw new StockError('insufficient')
  const m: StockMovement = {
    id: nextId('mv-', st.movements.map((x) => x.id)),
    itemId: input.itemId,
    lotId: lot.id,
    type: input.kind === 'loss' ? 'loss' : 'adjustment',
    qty: sign * input.qty,
    at: input.now.toISOString(),
    ref: 'Ajuste manual',
    description: `${label[input.kind]}${input.reason ? ` · ${input.reason.toLowerCase()}` : ''}`,
    by: input.by,
  }
  st.movements.push(m)
  return m
}

/** Desfaz um lançamento com um lançamento contrário (o histórico não é apagado). Só uma vez e só se o saldo permitir. */
export function reverse(st: Ledger, movementId: string, by: string, now: Date): StockMovement {
  const original = st.movements.find((m) => m.id === movementId)
  if (!original || !original.lotId) throw new StockError('not_found')
  if (st.movements.some((m) => m.reversalOf === movementId)) throw new StockError('cannot_reverse')
  if (original.qty > 0 && lotBalance(st.movements, original.lotId) < original.qty) throw new StockError('insufficient')
  const m: StockMovement = {
    id: nextId('mv-', st.movements.map((x) => x.id)),
    itemId: original.itemId,
    lotId: original.lotId,
    type: 'adjustment',
    qty: -original.qty,
    at: now.toISOString(),
    ref: original.ref,
    description: `Desfeito · ${original.description ?? 'lançamento'}`,
    by,
    batchId: original.batchId,
    reversalOf: movementId,
  }
  st.movements.push(m)
  return m
}

export type CountLine = { itemId: string; counted: number }

/** Lança a diferença de cada item contado. Falta sai do lote que vence primeiro; sobra entra no lote mais recente (H-G13). */
export function applyCount(st: Ledger, lines: CountLine[], by: string, now: Date): { batchId: string; movements: StockMovement[]; deltaUnits: number; deltaCostCents: number } {
  const batchId = nextId('INV-', st.movements.map((m) => m.batchId ?? ''))
  const created: StockMovement[] = []
  let deltaUnits = 0
  let deltaCost = 0
  for (const line of lines) {
    const system = itemBalance(st.movements, line.itemId)
    const diff = line.counted - system
    if (diff === 0) continue
    deltaUnits += diff
    if (diff > 0) {
      const lots = st.lots.filter((l) => l.itemId === line.itemId).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      const lot = lots[0]
      if (!lot) throw new StockError('not_found')
      created.push({ id: nextId('mv-', [...st.movements, ...created].map((x) => x.id)), itemId: line.itemId, lotId: lot.id, type: 'inventory', qty: diff, at: now.toISOString(), ref: batchId, description: 'Contagem de inventário · sobra', by, batchId })
      deltaCost += diff * lot.unitCostCents
    } else {
      let left = -diff
      for (const lot of lotsFefo(st.lots, st.movements, line.itemId)) {
        if (left <= 0) break
        const take = Math.min(left, lot.balance)
        created.push({ id: nextId('mv-', [...st.movements, ...created].map((x) => x.id)), itemId: line.itemId, lotId: lot.id, type: 'inventory', qty: -take, at: now.toISOString(), ref: batchId, description: 'Contagem de inventário · falta', by, batchId })
        deltaCost -= take * lot.unitCostCents
        left -= take
      }
    }
  }
  st.movements.push(...created)
  return { batchId, movements: created, deltaUnits, deltaCostCents: deltaCost }
}

/** Corrige uma contagem aplicada: desfaz todas as movimentações dela. */
export function undoCount(st: Ledger, batchId: string, by: string, now: Date): number {
  const originals = st.movements.filter((m) => m.batchId === batchId && !m.reversalOf)
  if (originals.length === 0) throw new StockError('not_found')
  for (const m of originals) reverse(st, m.id, by, now)
  return originals.length
}
