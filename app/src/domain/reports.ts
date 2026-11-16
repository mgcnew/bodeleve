import type { StockMovement } from './inventory'
import type { CashTransaction } from './finance'
import type { ProductionOrder } from './production'
import type { Order } from './types'

/**
 * Relatórios da gestão. Os dias anteriores à base (histórico de exemplo, que depois vem do PDV e das vendas reais) são
 * agregados por dia; os dias depois dela saem dos pedidos. Dinheiro em centavos.
 */

export type SalesDay = {
  /** Dia local "2026-11-14". */
  date: string
  counterCents: number
  onlineCents: number
  count: number
  pixCents: number
  cardCents: number
  cashCents: number
  /** Unidades vendidas por produto. */
  products: Record<string, number>
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const dm = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`

export type TodayCounter = { count: number; cents: number; pixCents: number; cardCents: number; cashCents: number; products: Record<string, number> }

const paymentKey = { pix: 'pixCents', card_on_delivery: 'cardCents', cash: 'cashCents' } as const

const empty = (date: string): SalesDay => ({ date, counterCents: 0, onlineCents: 0, count: 0, pixCents: 0, cardCents: 0, cashCents: 0, products: {} })

/** Vendas de cada dia, de `from` até `to`: histórico quando há; senão os pedidos online (e o balcão de hoje, até o PDV existir). */
export function salesByDay(history: SalesDay[], orders: Order[], counter: TodayCounter, from: Date, to: Date): SalesDay[] {
  const known = new Map(history.map((h) => [h.date, h]))
  const out: SalesDay[] = []
  const today = dayKey(to)
  for (let d = from; dayKey(d) <= today; d = addDays(d, 1)) {
    const key = dayKey(d)
    const h = known.get(key)
    if (h) { out.push(h); continue }
    const day = empty(key)
    for (const o of orders) {
      if (o.channel !== 'online' || o.status === 'cancelled' || dayKey(new Date(o.createdAt)) !== key) continue
      day.onlineCents += o.totalCents
      day.count += 1
      day[paymentKey[o.payment.method]] += o.totalCents
      for (const i of o.items) day.products[i.productId] = (day.products[i.productId] ?? 0) + i.qty
    }
    if (key === today) {
      day.counterCents = counter.cents
      day.count += counter.count
      day.pixCents += counter.pixCents
      day.cardCents += counter.cardCents
      day.cashCents += counter.cashCents
      for (const [id, n] of Object.entries(counter.products)) day.products[id] = (day.products[id] ?? 0) + n
    }
    out.push(day)
  }
  return out
}

export type Period = 'today' | '7d' | 'month'

export const periodStart = (period: Period, now: Date) => (period === 'today' ? now : period === '7d' ? addDays(now, -6) : new Date(now.getFullYear(), now.getMonth(), 1))

export type SalesReport = {
  label: string
  totalCents: number
  count: number
  ticketCents: number
  counterCents: number
  onlineCents: number
  pixCents: number
  cardCents: number
  cashCents: number
  top: Array<{ productId: string; qty: number }>
  /** Só no período de 7 dias. */
  days: Array<{ date: string; label: string; cents: number }> | null
}

const sum = (days: SalesDay[], f: (d: SalesDay) => number) => days.reduce((a, d) => a + f(d), 0)
const total = (d: SalesDay) => d.counterCents + d.onlineCents

export function salesReport(days: SalesDay[], period: Period): SalesReport {
  const totalCents = sum(days, total)
  const count = sum(days, (d) => d.count)
  const qty: Record<string, number> = {}
  for (const d of days) for (const [id, n] of Object.entries(d.products)) qty[id] = (qty[id] ?? 0) + n
  const first = days[0].date
  const last = days[days.length - 1].date
  return {
    label: period === 'today' ? `Hoje, ${dm(last)}` : `${dm(first)} a ${dm(last)}`,
    totalCents,
    count,
    ticketCents: count ? Math.round(totalCents / count) : 0,
    counterCents: sum(days, (d) => d.counterCents),
    onlineCents: sum(days, (d) => d.onlineCents),
    pixCents: sum(days, (d) => d.pixCents),
    cardCents: sum(days, (d) => d.cardCents),
    cashCents: sum(days, (d) => d.cashCents),
    top: Object.entries(qty).map(([productId, q]) => ({ productId, qty: q })).sort((a, b) => b.qty - a.qty).slice(0, 3),
    days: period === '7d' ? days.map((d) => ({ date: d.date, label: d.date.slice(8, 10), cents: total(d) })) : null,
  }
}

export type Hub = {
  salesCents: number
  bestSeller: { productId: string; qty: number } | null
  itemsSold: number
  losses: { count: number; cents: number }
  production: { orders: number; yieldPercent: number | null; units: number }
  resultCents: number
}

const inMonth = (iso: string, now: Date) => {
  const d = new Date(iso)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d <= now
}

/** Perdas lançadas e ainda valendo (as desfeitas por estorno não contam). */
export function monthLosses(movements: StockMovement[], costOf: (m: StockMovement) => number, now: Date): { count: number; cents: number } {
  const reversed = new Set(movements.filter((m) => m.reversalOf).map((m) => m.reversalOf))
  const losses = movements.filter((m) => m.type === 'loss' && m.qty < 0 && !m.reversalOf && !reversed.has(m.id) && inMonth(m.at, now))
  return { count: losses.length, cents: losses.reduce((a, m) => a + Math.round(-m.qty * costOf(m)), 0) }
}

export function monthProduction(orders: ProductionOrder[], now: Date): Hub['production'] {
  const done = orders.filter((o) => o.status === 'done' && o.doneAt && inMonth(o.doneAt, now) && o.goodQty != null)
  const planned = done.reduce((a, o) => a + o.plannedQty, 0)
  const good = done.reduce((a, o) => a + (o.goodQty ?? 0), 0)
  return { orders: done.length, yieldPercent: planned ? Math.round((good / planned) * 100) : null, units: good }
}

/** Vendas menos o que saiu do banco e do caixa no mês (compras, despesas, multas). Transferência entre contas não conta. */
export function monthOutflowCents(transactions: CashTransaction[], now: Date): number {
  return transactions.filter((t) => t.amountCents < 0 && t.kind !== 'transfer' && inMonth(t.at, now)).reduce((a, t) => a + -t.amountCents, 0)
}

export function buildHub(days: SalesDay[], losses: Hub['losses'], production: Hub['production'], outflowCents: number): Hub {
  const r = salesReport(days, 'month')
  const qty: Record<string, number> = {}
  for (const d of days) for (const [id, n] of Object.entries(d.products)) qty[id] = (qty[id] ?? 0) + n
  return {
    salesCents: r.totalCents,
    bestSeller: r.top[0] ?? null,
    itemsSold: Object.keys(qty).length,
    losses,
    production,
    resultCents: r.totalCents - outflowCents,
  }
}
