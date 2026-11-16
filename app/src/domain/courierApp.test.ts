import { describe, expect, it } from 'vitest'
import { buildCouriersSeed, buildDeliverySeed } from '@/mocks/deliverySeed'
import { buildSeedOrders } from '@/mocks/seedOrders'
import { accept, cashDue, confirm, depart, historyOf, payoutOf, reportProblem, take, undoProblem, visibleTo } from './courierApp'
import { assign, DeliveryError, type DeliveryRecord } from './deliveries'
import type { Order } from './types'

const now = new Date(2026, 10, 16, 15, 30)
const couriers = buildCouriersSeed()
const [carlos, bruno, diego] = [couriers.find((c) => c.id === 'carlos')!, couriers.find((c) => c.id === 'bruno')!, couriers.find((c) => c.id === 'diego')!]

/** O pedido 1041 pronto para sair (como no quadro) e as entregas de exemplo. */
function world() {
  const orders: Order[] = buildSeedOrders(now).map((o) => (o.id === '1041' ? { ...o, status: 'ready_for_delivery' as const } : o))
  const records: DeliveryRecord[] = buildDeliverySeed(now)
  return { orders, records, o: (id: string) => orders.find((x) => x.id === id)! }
}
const code = (o: Order) => o.deliveryCode

describe('o que cada pessoa vê', () => {
  it('entregador da casa vê o que está livre; parceiro só o que foi publicado', () => {
    const w = world()
    expect(visibleTo(bruno, w.orders, w.records).available.map((s) => s.order.id)).toEqual(['1041'])
    expect(visibleTo(diego, w.orders, w.records).available).toEqual([])
    w.records.push(assign(w.orders, w.records, couriers, '1041', 'partners', now).record)
    expect(visibleTo(diego, w.orders, w.records).available.map((s) => s.order.id)).toEqual(['1041'])
    expect(visibleTo(bruno, w.orders, w.records).available).toEqual([]) // publicado é dos parceiros
  })

  it('Minhas: o que é dele e ainda não terminou, em rota primeiro; o entregue não volta', () => {
    const w = world()
    expect(visibleTo(carlos, w.orders, w.records).mine.map((m) => [m.order.id, m.record.status])).toEqual([['1042', 'en_route']])
    expect(visibleTo(bruno, w.orders, w.records).mine).toEqual([]) // 1038 já foi entregue
  })

  it('fora do turno não vê nem pega nada', () => {
    const w = world()
    const off = { ...bruno, available: false }
    expect(visibleTo(off, w.orders, w.records).available).toEqual([])
    expect(() => take(off, w.o('1041'), w.records, now)).toThrowError('unavailable')
  })
})

describe('as etapas até entregar', () => {
  it('pegar → aceitar → sair da loja → confirmar com o código do pedido', () => {
    const w = world()
    const rec = take(bruno, w.o('1041'), w.records, now)
    expect(rec).toMatchObject({ courierId: 'bruno', status: 'assigned', district: 'Bairro Alto', items: 6 })
    accept(bruno, rec, now)
    expect(rec.status).toBe('accepted')
    const left = new Date(now.getTime() + 5 * 60_000)
    depart(bruno, w.o('1041'), rec, left)
    expect(rec).toMatchObject({ status: 'en_route', at: left.toISOString() })
    expect(new Date(rec.expectedAt!).getTime() - left.getTime()).toBe(Math.round(4.1 * 3 * 60_000)) // 4,1 km × 3 min
    expect(w.o('1041')).toMatchObject({ status: 'out_for_delivery', courierName: 'Bruno' })
    expect(w.o('1041').etaLabel).toMatch(/^Hoje, \d\dh\d\d$/)
    expect(() => confirm(bruno, w.o('1041'), rec, '0000', left)).toThrowError('wrong_code')
    expect(rec.status).toBe('en_route')
    confirm(bruno, w.o('1041'), rec, code(w.o('1041')), left)
    expect(rec.status).toBe('delivered')
    expect(w.o('1041').status).toBe('delivered')
    expect(w.o('1041').stepTimes.delivered).toMatch(/^\d\dh\d\d$/)
  })

  it('entrega com pagamento na porta passa a paga quando entregue', () => {
    const w = world()
    const o = w.o('1041')
    o.payment = { method: 'cash', changeForCents: null, paid: false }
    expect(cashDue(o)).toBe(o.totalCents)
    const rec = take(bruno, o, w.records, now)
    accept(bruno, rec, now)
    depart(bruno, o, rec, now)
    confirm(bruno, o, rec, o.deliveryCode, now)
    expect(o.payment.paid).toBe(true)
    expect(cashDue(o)).toBe(0)
  })

  it('não pula etapa: sair sem aceitar, confirmar sem sair e aceitar o que é de outro', () => {
    const w = world()
    const rec = take(bruno, w.o('1041'), w.records, now)
    expect(() => depart(bruno, w.o('1041'), rec, now)).toThrowError('wrong_state')
    expect(() => confirm(bruno, w.o('1041'), rec, '1', now)).toThrowError('wrong_state')
    expect(() => accept(carlos, rec, now)).toThrowError('not_yours')
    expect(() => accept(bruno, undefined, now)).toThrowError(DeliveryError)
    accept(bruno, rec, now)
    expect(() => accept(bruno, rec, now)).toThrowError('wrong_state')
  })

  it('quem está em rota que pega outra entrega fica com ela reservada', () => {
    const w = world()
    expect(take(carlos, w.o('1041'), w.records, now).status).toBe('reserved')
  })

  it('duas pessoas não pegam a mesma entrega', () => {
    const w = world()
    take(bruno, w.o('1041'), w.records, now)
    expect(() => take(carlos, w.o('1041'), w.records, now)).toThrowError('already_assigned')
  })

  it('parceiro: pega o que foi publicado e recebe R$ 9,00', () => {
    const w = world()
    w.records.push(assign(w.orders, w.records, couriers, '1041', 'partners', now).record)
    const rec = take(diego, w.o('1041'), w.records, now)
    expect(rec).toMatchObject({ courierId: 'diego', courierName: 'Diego', kind: 'partner', status: 'assigned', feeCents: 900 })
    expect(w.records.filter((r) => r.orderId === '1041')).toHaveLength(1) // a mesma publicação, agora dele
    expect(payoutOf(rec)).toBe(900)
    expect(payoutOf({ kind: 'partner', status: 'returned', feeCents: 900 })).toBe(450)
    expect(payoutOf({ kind: 'own', status: 'delivered', feeCents: null })).toBeNull()
  })
})

describe('problema na entrega', () => {
  const enRoute = () => {
    const w = world()
    const rec = take(bruno, w.o('1041'), w.records, now)
    accept(bruno, rec, now)
    depart(bruno, w.o('1041'), rec, now)
    return { w, rec }
  }

  it('devolver à loja: pedido volta a pronto, entrega vira devolvida com o motivo', () => {
    const { w, rec } = enRoute()
    reportProblem(bruno, w.o('1041'), rec, 'Cliente não atende', '  Portão fechado ', now)
    expect(rec).toMatchObject({ status: 'returned', problem: { reason: 'Cliente não atende', note: 'Portão fechado' } })
    expect(w.o('1041')).toMatchObject({ status: 'ready_for_delivery', courierName: null, etaLabel: null })
  })

  it('a casa atribui de novo depois da devolução', () => {
    const { w, rec } = enRoute()
    reportProblem(bruno, w.o('1041'), rec, 'Outro', '', now)
    const again = assign(w.orders, w.records, couriers, '1041', 'carlos', now)
    expect(again.record.status).toBe('reserved') // o Carlos ainda está em rota com o 1042
  })

  it('desfazer volta para em rota enquanto ninguém pegou de novo', () => {
    const { w, rec } = enRoute()
    const before = { at: rec.at, expectedAt: rec.expectedAt }
    reportProblem(bruno, w.o('1041'), rec, 'Outro', '', new Date(now.getTime() + 60_000))
    undoProblem(bruno, w.o('1041'), rec, w.records)
    expect(rec).toMatchObject({ status: 'en_route', at: before.at, expectedAt: before.expectedAt, problem: null })
    expect(w.o('1041')).toMatchObject({ status: 'out_for_delivery', courierName: 'Bruno' })
    reportProblem(bruno, w.o('1041'), rec, 'Outro', '', now)
    w.records.push(assign(w.orders, w.records, couriers, '1041', 'partners', now).record)
    expect(() => undoProblem(bruno, w.o('1041'), rec, w.records)).toThrowError('wrong_state')
  })

  it('só quem está em rota pode relatar problema', () => {
    const w = world()
    const rec = take(bruno, w.o('1041'), w.records, now)
    expect(() => reportProblem(bruno, w.o('1041'), rec, 'Outro', '', now)).toThrowError('wrong_state')
  })
})

describe('histórico do dia', () => {
  it('entregador da casa: entregas, devolução e km rodados, sem valores a receber', () => {
    const w = world()
    const rec = take(bruno, w.o('1041'), w.records, now)
    accept(bruno, rec, now)
    depart(bruno, w.o('1041'), rec, now)
    confirm(bruno, w.o('1041'), rec, code(w.o('1041')), now)
    const h = historyOf(bruno, w.records, now)
    expect(h).toMatchObject({ delivered: 2, returned: 0, km: 5.9, payoutCents: null, payoutDetail: null })
    expect(h.rows.map((r) => r.orderId)).toEqual(['1041', '1038']) // mais recente primeiro
  })

  it('parceiro: o que vai receber = entregas × R$ 9,00 + devoluções × R$ 4,50', () => {
    const w = world()
    w.records.push({ orderId: '1031', customer: 'X', district: 'Jardim das Flores', courierId: 'diego', courierName: 'Diego', kind: 'partner', status: 'returned', feeCents: 900, at: new Date(2026, 10, 16, 10, 2).toISOString(), expectedAt: null, returnAt: null, problem: null })
    const h = historyOf(diego, w.records, now)
    expect(h).toMatchObject({ delivered: 1, returned: 1, payoutCents: 900 + 450, km: 7.4 })
    expect(h.payoutDetail).toBe('1 entrega × R$ 9,00 + 1 devolução × R$ 4,50. Pago por Pix toda segunda.')
  })

  it('o histórico é só de hoje', () => {
    const w = world()
    const tomorrow = new Date(2026, 10, 17, 9, 0)
    expect(historyOf(bruno, w.records, tomorrow).rows).toEqual([])
  })
})
