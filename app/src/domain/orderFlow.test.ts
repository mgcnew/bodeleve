import { describe, expect, it } from 'vitest'
import { FlowError, transition } from './orderFlow'
import { buildSeedOrders } from '@/mocks/seedOrders'

const now = new Date('2026-11-15T15:30:00-03:00')
const order = (id: string) => buildSeedOrders(now).find((o) => o.id === id)!

describe('fluxo do pedido na gestão (H-G4)', () => {
  it('aceitar leva Novo a Em preparo e registra a hora', () => {
    const o = transition(order('1043'), 'accept', '15h31')
    expect(o.status).toBe('preparing')
    expect(o.stepTimes.preparing).toBe('15h31')
  })
  it('só aceita pedido novo', () => {
    expect(() => transition(order('1041'), 'accept', '15h31')).toThrow(FlowError)
  })
  it('marcar pronto exige todos os itens conferidos', () => {
    const preparing = order('1041')
    expect(() => transition(preparing, 'mark_ready', '15h40', { checkedProductIds: ['queijo-manteiga'] })).toThrowError('items_not_checked')
    const all = preparing.items.map((i) => i.productId)
    expect(transition(preparing, 'mark_ready', '15h40', { checkedProductIds: all }).status).toBe('ready_for_delivery')
  })
  it('retirada fica "pronto para retirada"', () => {
    const o = order('1040')
    const done = transition(o, 'mark_ready', '15h40', { checkedProductIds: o.items.map((i) => i.productId) })
    expect(done.status).toBe('ready_for_pickup')
  })
  it('desfazer volta o pronto para preparo; não desfaz o que ainda não está pronto', () => {
    expect(transition(order('1039'), 'undo_ready', '').status).toBe('preparing')
    expect(() => transition(order('1043'), 'undo_ready', '')).toThrow(FlowError)
  })
  it('não altera o pedido original', () => {
    const o = order('1043')
    transition(o, 'accept', '15h31')
    expect(o.status).toBe('received')
  })
})

describe('totais dos pedidos de exemplo batem com os quadros', () => {
  it.each([
    ['1043', 6370], ['1044', 4780], ['1041', 13210], ['1040', 8830], ['1039', 4140], ['1042', 8120],
  ])('pedido %s = %i centavos', (id, total) => {
    expect(order(id).totalCents).toBe(total)
  })
  it.each([['1043', 3], ['1044', 2], ['1041', 6], ['1040', 4], ['1039', 2], ['1042', 4]])('pedido %s tem %i itens', (id, n) => {
    expect(order(id).items.reduce((a, i) => a + i.qty, 0)).toBe(n)
  })
})
