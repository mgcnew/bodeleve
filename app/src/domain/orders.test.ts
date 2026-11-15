import { describe, expect, it } from 'vitest'
import { buildTimeline, isInProgress } from './orders'
import { seedOrders } from '@/mocks/seed'

const byId = (id: string) => seedOrders.find((o) => o.id === id)!

describe('linha do tempo do pedido', () => {
  it('pedido 1042 (saiu para entrega): 2 concluídas, 1 atual, 1 futura — como no quadro', () => {
    const t = buildTimeline(byId('1042'))
    expect(t.map((x) => x.state)).toEqual(['done', 'done', 'current', 'future'])
    expect(t[2].detail).toBe('15h12 · com Carlos, entregador da casa')
  })
  it('recém-confirmado: "Pedido recebido" já feito e "Em preparo" atual', () => {
    const t = buildTimeline({ ...byId('1042'), status: 'received', courierName: null, stepTimes: { received: '14h52' } })
    expect(t.map((x) => x.state)).toEqual(['done', 'current', 'future', 'future'])
    expect(t[1].detail).toBe('A casa está separando seus itens')
  })
  it('entregue: todas concluídas', () => {
    expect(buildTimeline(byId('1017')).every((x) => x.state === 'done')).toBe(true)
  })
  it('retirada usa as etapas de retirada', () => {
    expect(buildTimeline(byId('0988')).map((x) => x.label)).toEqual(['Pedido recebido', 'Em preparo', 'Pronto para retirada', 'Retirado'])
  })
  it('só pedido não concluído está em andamento', () => {
    expect(isInProgress(byId('1042'))).toBe(true)
    expect(isInProgress(byId('1017'))).toBe(false)
    expect(isInProgress(byId('0988'))).toBe(false)
  })
})
