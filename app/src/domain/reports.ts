// Relatório de vendas calculado a partir dos pedidos gravados (dinheiro em centavos, dias no fuso do aparelho).
// Vale como venda todo pedido que não foi cancelado, do balcão e da loja online.

export type SalesRow = {
  created_at: string
  channel: string
  total_cents: number
  payment_method: string | null
  payments: { method: string; cents: number }[]
  order_items: { name: string; qty: number; kind: string | null; total_cents: number }[]
}

export type SalesPeriod = {
  total: number
  count: number
  counter: { count: number; total: number }
  online: { count: number; total: number }
  pix: number
  card: number
  cash: number
  /** mais vendidos por valor, com a quantidade já escrita (un ou kg) */
  top: { name: string; qty: string }[]
}

export type SalesReport = {
  /** últimos 7 dias, do mais antigo (há 6 dias) ao de hoje, em centavos */
  days: number[]
  today: SalesPeriod
  week: SalesPeriod
  month: SalesPeriod
  /** vendas de ontem até a mesma hora de agora */
  yesterdaySameTime: number
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

const method = (m: string): 'pix' | 'cash' | 'card' => (m === 'pix' ? 'pix' : m === 'cash' ? 'cash' : 'card')

const emptyPeriod = (): SalesPeriod => ({ total: 0, count: 0, counter: { count: 0, total: 0 }, online: { count: 0, total: 0 }, pix: 0, card: 0, cash: 0, top: [] })

function period(rows: SalesRow[]): SalesPeriod {
  const p = emptyPeriod()
  const items = new Map<string, { name: string; qty: number; cents: number; weight: boolean }>()
  for (const r of rows) {
    const total = Number(r.total_cents)
    p.total += total
    p.count += 1
    const side = r.channel === 'pos' ? p.counter : p.online
    side.count += 1
    side.total += total
    if (r.payments.length > 0) for (const pay of r.payments) p[method(pay.method)] += Number(pay.cents)
    else p[method(r.payment_method ?? '')] += total
    for (const i of r.order_items) {
      const weight = i.kind === 'weight'
      const key = `${i.name}|${weight}`
      const cur = items.get(key) ?? { name: i.name, qty: 0, cents: 0, weight }
      cur.qty += Number(i.qty)
      cur.cents += Number(i.total_cents)
      items.set(key, cur)
    }
  }
  p.top = [...items.values()]
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 5)
    .map((i) => ({ name: i.name, qty: i.weight ? `${i.qty.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg` : `${Math.round(i.qty)} un` }))
  return p
}

export function buildSalesReport(all: SalesRow[], now = new Date()): SalesReport {
  const rows = all.map((r) => ({ r, at: new Date(r.created_at) }))
  const today0 = startOfDay(now)
  const week0 = addDays(today0, -6)
  const month0 = new Date(now.getFullYear(), now.getMonth(), 1)
  const within = (from: Date) => rows.filter((x) => x.at >= from && x.at <= now).map((x) => x.r)

  const days = Array.from({ length: 7 }, (_, i) => {
    const from = addDays(week0, i)
    const to = addDays(week0, i + 1)
    return rows.filter((x) => x.at >= from && x.at < to).reduce((n, x) => n + Number(x.r.total_cents), 0)
  })

  const yFrom = addDays(today0, -1)
  const yTo = new Date(yFrom.getTime() + (now.getTime() - today0.getTime()))
  const yesterdaySameTime = rows.filter((x) => x.at >= yFrom && x.at <= yTo).reduce((n, x) => n + Number(x.r.total_cents), 0)

  return { days, today: period(within(today0)), week: period(within(week0)), month: period(within(month0)), yesterdaySameTime }
}

export const ticket = (p: SalesPeriod) => (p.count > 0 ? Math.round(p.total / p.count) : 0)
