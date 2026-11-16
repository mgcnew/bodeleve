import { describe, expect, it } from 'vitest'
import { buildSalesHistory, todayCounterSeed } from '@/mocks/reportsSeed'
import { buildSeedOrders } from '@/mocks/seedOrders'
import type { StockMovement } from './inventory'
import { buildHub, dayKey, monthLosses, monthOutflowCents, monthProduction, periodStart, salesByDay, salesReport } from './reports'
import type { ProductionOrder } from './production'

const now = new Date(2026, 10, 16, 15, 30)
const orders = buildSeedOrders(now)
const history = buildSalesHistory(now)

describe('vendas por dia', () => {
  it('usa o histórico nos dias que ele cobre e os pedidos de hoje no resto', () => {
    const days = salesByDay(history, orders, todayCounterSeed, new Date(2026, 10, 14), now)
    expect(days.map((d) => d.date)).toEqual(['2026-11-14', '2026-11-15', '2026-11-16'])
    expect(days[0]).toBe(history.find((h) => h.date === '2026-11-14'))
    const today = days[2]
    // Online de hoje: 1042, 1043, 1044, 1041, 1040 e 1039 (os pedidos antigos da base não entram).
    expect(today.onlineCents).toBe(8120 + 6370 + 4780 + 13210 + 8830 + 4140)
    expect(today.counterCents).toBe(89200)
    expect(today.count).toBe(26 + 6)
    expect(today.pixCents + today.cardCents + today.cashCents).toBe(today.counterCents + today.onlineCents)
  })

  it('pedido cancelado e pedido de dia coberto pelo histórico não contam', () => {
    const cancelled = orders.map((o) => (o.id === '1042' ? { ...o, status: 'cancelled' as const } : o))
    const days = salesByDay(history, cancelled, todayCounterSeed, now, now)
    expect(days[0].onlineCents).toBe(6370 + 4780 + 13210 + 8830 + 4140)
    const old = salesByDay(history, orders, todayCounterSeed, new Date(2026, 10, 2), new Date(2026, 10, 2))
    expect(old[0]).toBe(history.find((h) => h.date === '2026-11-02'))
  })
})

describe('relatório de vendas', () => {
  it('hoje: total, vendas, ticket médio, canal, pagamento e mais vendidos', () => {
    const r = salesReport(salesByDay(history, orders, todayCounterSeed, now, now), 'today')
    expect(r.label).toBe('Hoje, 16/11')
    expect(r.totalCents).toBe(89200 + 45450)
    expect(r.count).toBe(32)
    expect(r.ticketCents).toBe(Math.round((89200 + 45450) / 32))
    expect(r.counterCents).toBe(89200)
    expect(r.top.slice(0, 2)).toEqual([{ productId: 'farinha-de-mandioca', qty: 5 + 2 + 1 + 1 + 2 + 1 }, { productId: 'queijo-coalho', qty: 7 + 4 }])
    expect(r.days).toBeNull()
  })

  it('7 dias: uma barra por dia e o período no rótulo', () => {
    const days = salesByDay(history, orders, todayCounterSeed, periodStart('7d', now), now)
    const r = salesReport(days, '7d')
    expect(r.label).toBe('10/11 a 16/11')
    expect(r.days).toHaveLength(7)
    expect(r.days!.map((d) => d.label)).toEqual(['10', '11', '12', '13', '14', '15', '16'])
    expect(r.days!.reduce((a, d) => a + d.cents, 0)).toBe(r.totalCents)
    expect(r.counterCents + r.onlineCents).toBe(r.totalCents)
    expect(r.pixCents + r.cardCents + r.cashCents).toBeGreaterThan(0)
  })

  it('mês: do dia 1 até hoje', () => {
    const r = salesReport(salesByDay(history, orders, todayCounterSeed, periodStart('month', now), now), 'month')
    expect(r.label).toBe('01/11 a 16/11')
    expect(dayKey(periodStart('month', now))).toBe('2026-11-01')
  })
})

describe('resumo do mês', () => {
  const mv = (o: Partial<StockMovement> & { id: string }): StockMovement => ({ itemId: 'queijo-coalho', lotId: 'l1', type: 'loss', qty: -1, at: new Date(2026, 10, 14).toISOString(), ref: 'x', ...o })

  it('perdas: conta e valoriza, ignora as desfeitas e as de outro mês', () => {
    const list = [mv({ id: 'a' }), mv({ id: 'b', qty: -2 }), mv({ id: 'r', qty: 2, reversalOf: 'b' }), mv({ id: 'old', at: new Date(2026, 9, 3).toISOString() }), mv({ id: 'in', type: 'adjustment' })]
    expect(monthLosses(list, () => 1420, now)).toEqual({ count: 1, cents: 1420 })
  })

  it('produção: ordens concluídas no mês, rendimento médio e unidades', () => {
    const o = (id: string, planned: number, good: number | null, doneAt: string | null, status: ProductionOrder['status'] = 'done'): ProductionOrder => ({
      id, recipeId: 'r', itemId: 'queijo-coalho', batches: 1, plannedQty: planned, status, destination: { kind: 'stock' }, startsAt: '', endsAt: null, startedAt: null,
      doneAt, goodQty: good, lotCode: null, expiresAt: null, costPerUnitCents: null, lotId: null, movementIds: [], reservationIds: [],
    })
    const r = monthProduction([o('1', 10, 10, new Date(2026, 10, 3).toISOString()), o('2', 20, 18, new Date(2026, 10, 9).toISOString()), o('3', 10, 10, new Date(2026, 9, 9).toISOString()), o('4', 10, null, null, 'planned')], now)
    expect(r).toEqual({ orders: 2, yieldPercent: 93, units: 28 })
    expect(monthProduction([], now).yieldPercent).toBeNull()
  })

  it('resultado = vendas − saídas do mês; transferência e entradas não contam como saída', () => {
    const tx = (amountCents: number, kind: 'payment' | 'transfer' | 'sale', day = 5) => ({ id: String(Math.random()), at: new Date(2026, 10, day).toISOString(), accountId: 'bank' as const, amountCents, kind, title: '', note: '' })
    const out = monthOutflowCents([tx(-50000, 'payment'), tx(-60000, 'transfer'), tx(30000, 'sale'), tx(-1000, 'payment', 20)], now)
    expect(out).toBe(50000) // o do dia 20 é depois de hoje; a transferência é neutra
    const hub = buildHub(salesByDay(history, orders, todayCounterSeed, periodStart('month', now), now), { count: 0, cents: 0 }, { orders: 0, yieldPercent: null, units: 0 }, out)
    expect(hub.resultCents).toBe(hub.salesCents - 50000)
    expect(hub.bestSeller).not.toBeNull()
    expect(hub.itemsSold).toBeGreaterThanOrEqual(7)
  })
})
