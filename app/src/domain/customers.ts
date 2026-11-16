import type { FinancialEntry } from './finance'
import { remaining } from './finance'
import type { Order, OrderStatus } from './types'

/**
 * Clientes da gestão. Ninguém precisa de conta para comprar (D6): quem compra na loja sem conta entra aqui pelo celular informado.
 * O cadastro guarda só o que o pedido não tem (desde quando, observação interna, histórico anterior); o resto sai dos pedidos.
 */

export type CustomerRecord = {
  phone: string
  name: string
  /** "03/2026". */
  since: string | null
  /** Observação interna da equipe. */
  notes: string
  /** Como compra quando não há pedido online, ex.: "Balcão · compra fiado". */
  channelNote: string | null
  /** O que veio de antes dos pedidos deste sistema (vendas de balcão e histórico antigo). */
  baseline: { orders: number; spentCents: number; products: Record<string, number> }
}

export const customerId = (phone: string) => `c${phone.replace(/\D/g, '')}`

const monthYear = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
const dayMonth = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export type CustomerSummary = {
  id: string
  name: string
  phone: string
  initial: string
  orders: number
  spentCents: number
  /** "5 pedidos · último hoje", "Balcão · compra fiado". */
  detail: string
  tag: { tone: 'info' | 'warning'; label: string } | null
}

const countsOrder = (o: Order) => o.status !== 'cancelled'
export const orderPlural = (n: number) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`

/** Fiado em aberto do cliente: contas a receber marcadas "Fiado" com o nome dele. */
export function fiadoCents(name: string, entries: FinancialEntry[]): number {
  return entries.filter((e) => e.direction === 'receivable' && e.tag === 'Fiado' && e.description === name).reduce((a, e) => a + remaining(e), 0)
}

type Merged = { record: CustomerRecord; orders: Order[] }

/** Cadastro + pedidos: quem pediu com um celular que ainda não está no cadastro entra como cliente novo. */
export function mergeCustomers(records: CustomerRecord[], orders: Order[]): Merged[] {
  const byPhone = new Map<string, Merged>()
  for (const r of records) byPhone.set(r.phone, { record: r, orders: [] })
  const sorted = [...orders].filter(countsOrder).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  for (const o of sorted) {
    let m = byPhone.get(o.contact.phone)
    if (!m) {
      m = { record: { phone: o.contact.phone, name: o.contact.name, since: monthYear(o.createdAt), notes: '', channelNote: null, baseline: { orders: 0, spentCents: 0, products: {} } }, orders: [] }
      byPhone.set(o.contact.phone, m)
    }
    m.orders.push(o)
  }
  for (const m of byPhone.values()) m.orders.reverse()
  return [...byPhone.values()]
}

function summarize(m: Merged, entries: FinancialEntry[], now: Date): CustomerSummary {
  const { record, orders } = m
  const total = record.baseline.orders + orders.length
  const spent = record.baseline.spentCents + orders.reduce((a, o) => a + o.totalCents, 0)
  const last = orders[0]
  let detail: string
  if (last) detail = total === 1 ? `1 pedido · ${sameDay(new Date(last.createdAt), now) ? 'hoje' : dayMonth(last.createdAt)}` : `${orderPlural(total)} · último ${sameDay(new Date(last.createdAt), now) ? 'hoje' : dayMonth(last.createdAt)}`
  else detail = record.channelNote ?? orderPlural(total)
  const fiado = fiadoCents(record.name, entries)
  const tag = fiado > 0 ? { tone: 'warning' as const, label: `Fiado ${brl(fiado)}` } : total === 1 ? { tone: 'info' as const, label: 'Novo' } : null
  return { id: customerId(record.phone), name: record.name, phone: record.phone, initial: record.name.trim().charAt(0).toUpperCase(), orders: total, spentCents: spent, detail, tag }
}

const brl = (c: number) => `R$ ${(c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Mais recentes primeiro; busca por nome ou parte do celular. */
export function listCustomers(records: CustomerRecord[], orders: Order[], entries: FinancialEntry[], now: Date, query = ''): CustomerSummary[] {
  const q = norm(query.trim())
  const digits = query.replace(/\D/g, '')
  const lastAt = (m: Merged) => m.orders[0]?.createdAt ?? ''
  return mergeCustomers(records, orders)
    .filter((m) => !q || norm(m.record.name).includes(q) || (digits.length > 0 && m.record.phone.replace(/\D/g, '').includes(digits)))
    .sort((a, b) => lastAt(b).localeCompare(lastAt(a)) || b.record.baseline.spentCents - a.record.baseline.spentCents)
    .map((m) => summarize(m, entries, now))
}

const STATUS_LABEL: Partial<Record<OrderStatus, string>> = { received: 'Novo', preparing: 'Em preparo', ready_for_delivery: 'Pronto', ready_for_pickup: 'Pronto', out_for_delivery: 'Em rota', delivered: 'Entregue', picked_up: 'Retirado' }

export type CustomerDetail = {
  summary: CustomerSummary
  since: string | null
  channel: string
  /** Total ÷ pedidos; sem pedido registrado não há ticket. */
  ticketCents: number | null
  phone: string
  address: string | null
  topProducts: Array<{ productId: string; name: string; times: number }>
  orders: Array<{ id: string; when: string; kind: string; items: number; totalCents: number; status: string; tone: 'info' | 'success' | 'neutral' }>
  notes: string
}

export function customerDetail(id: string, records: CustomerRecord[], orders: Order[], entries: FinancialEntry[], now: Date, nameOf: (productId: string) => string): CustomerDetail | null {
  const m = mergeCustomers(records, orders).find((x) => customerId(x.record.phone) === id)
  if (!m) return null
  const summary = summarize(m, entries, now)
  const counts: Record<string, { name: string; times: number }> = {}
  for (const [pid, n] of Object.entries(m.record.baseline.products)) counts[pid] = { name: nameOf(pid), times: n }
  for (const o of m.orders) for (const i of o.items) counts[i.productId] = { name: i.name, times: (counts[i.productId]?.times ?? 0) + 1 }
  const withAddr = m.orders.find((o) => o.address)
  const a = withAddr?.address
  const online = m.orders.some((o) => o.channel === 'online')
  return {
    summary,
    since: m.record.since,
    channel: online ? 'compra pela loja online' : m.record.channelNote ?? 'compra no balcão',
    ticketCents: summary.orders ? Math.round(summary.spentCents / summary.orders) : null,
    phone: m.record.phone,
    address: a ? `${a.street}, ${a.number}${a.complement ? ` · ${a.complement}` : ''} — ${a.district}` : null,
    topProducts: Object.entries(counts).map(([productId, v]) => ({ productId, ...v })).sort((x, y) => y.times - x.times || x.name.localeCompare(y.name)).slice(0, 3),
    orders: m.orders.map((o) => ({
      id: o.id,
      when: sameDay(new Date(o.createdAt), now) ? 'hoje' : dayMonth(o.createdAt),
      kind: o.fulfillment === 'delivery' ? 'Entrega' : 'Retirada',
      items: o.items.reduce((s, i) => s + i.qty, 0),
      totalCents: o.totalCents,
      status: STATUS_LABEL[o.status] ?? o.status,
      tone: o.status === 'received' ? 'info' : o.status === 'delivered' || o.status === 'picked_up' ? 'success' : 'neutral',
    })),
    notes: m.record.notes,
  }
}
