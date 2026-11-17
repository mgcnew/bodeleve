// Saldos derivados das movimentações (DATA_MODEL_DRAFT.md):
// físico = Σ movimentos · reservado = pedidos em aberto · disponível = físico − reservado
// projetado = disponível + a receber (compras enviadas) + em produção
import type { Item, Lot, Movement, ProductionOrder, Purchase, Recipe } from '@/domain/backoffice'
import type { StaffOrder } from '@/domain/staffOrder'
import { daysUntil } from '@/domain/dates'
import { supabase } from '@/lib/supabase'
import { itemsStore, newId, stockStore } from './backoffice'
import { remoteAdjust, remoteCount, remoteUndoStock, type UndoToken } from './backofficeRemote'
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

export type StockContext = { movements: Movement[]; orders: StaffOrder[]; purchases: Purchase[]; production?: ProductionOrder[]; recipes?: Recipe[] }

/** H-G17 — insumos das ordens ainda não concluídas ficam reservados */
export function productionReservedOf(itemId: string, production: ProductionOrder[], recipes: Recipe[]) {
  return round(
    production
      .filter((p) => p.status === 'planned' || p.status === 'in_progress')
      .reduce((n, p) => {
        const line = recipes.find((r) => r.id === p.recipeId)?.lines.find((l) => l.itemId === itemId)
        return n + (line ? line.qty * p.batches : 0)
      }, 0),
  )
}

export function balanceOf(itemId: string, ctx: StockContext): Balance {
  const physical = physicalOf(itemId, ctx.movements)
  const reserved = round(reservedOf(itemId, ctx.orders) + (ctx.production && ctx.recipes ? productionReservedOf(itemId, ctx.production, ctx.recipes) : 0))
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
export type { UndoToken }

export async function registerAdjustment(input: { itemId: string; lotId: string | null; kind: AdjustmentKind; qty: number; reason: string }): Promise<UndoToken> {
  if (supabase) return remoteAdjust(input)
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
  return { kind: 'movements', ids: [m.id] }
}

/** Desfaz um ajuste ou uma contagem (no banco, lança o movimento contrário e mantém a trilha) */
export async function undoStock(token: UndoToken) {
  if (supabase) return remoteUndoStock(token)
  if (token.kind === 'movements') stockStore.set((s) => ({ ...s, movements: s.movements.filter((m) => !token.ids.includes(m.id)) }))
}

/** Inventário: lança a diferença entre contado e sistema; falta sai do lote que vence primeiro */
export async function applyInventory(counts: { itemId: string; counted: number }[]): Promise<{ token: UndoToken | null; changed: number }> {
  if (supabase) return remoteCount(counts)
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
  return { token: { kind: 'movements', ids: created.map((m) => m.id) }, changed: created.length }
}

/** Saída de estoque pelo lote que vence primeiro (H-G11). Devolve os movimentos a lançar. */
export function fefoOut(input: { itemId: string; qty: number; type: Movement['type']; note: string; ref: string | null; by: string; at: string }): Movement[] {
  const { lots, movements } = stockStore.get()
  const item = itemsStore.get().find((i) => i.id === input.itemId)
  const out: Movement[] = []
  let left = input.qty
  for (const lot of item?.tracksLots ? lotsOf(input.itemId, lots, movements) : []) {
    if (left <= 0) break
    const take = Math.min(lot.qty, left)
    out.push({ id: newId('mv'), itemId: input.itemId, lotId: lot.id, type: input.type, qty: -take, at: input.at, note: input.note, by: input.by, ref: input.ref })
    left = round(left - take)
  }
  if (left > 0) out.push({ id: newId('mv'), itemId: input.itemId, lotId: null, type: input.type, qty: -left, at: input.at, note: input.note, by: input.by, ref: input.ref })
  return out
}

/** Sugestão de código de lote: iniciais do item + mês e dia (ex.: CS-1116); se já existe, acrescenta -2, -3... */
export function suggestLotCode(name: string, itemId: string) {
  const words = name.split(/\s+/).filter((w) => /^\p{L}{3,}$/u.test(w))
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? 'LT').slice(0, 2)).toUpperCase()
  const d = new Date()
  const base = `${initials}-${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  // o banco não aceita o mesmo código duas vezes no mesmo produto
  const used = new Set(stockStore.get().lots.filter((l) => l.itemId === itemId).map((l) => l.code))
  let code = base
  for (let n = 2; used.has(code); n++) code = `${base}-${n}`
  return code
}
