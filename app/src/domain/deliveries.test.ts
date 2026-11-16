import { describe, expect, it } from 'vitest'
import { buildSeedOrders } from '@/mocks/seedOrders'
import { buildCouriersSeed, buildDeliverySeed } from '@/mocks/deliverySeed'
import { assign, assignOptions, courierRows, DeliveryError, dispatchRows, unassign } from './deliveries'
import type { Order } from './types'

const now = new Date(2026, 10, 16, 15, 30)
const couriers = buildCouriersSeed()
const orders = (): Order[] => buildSeedOrders(now)
const ready = (id: string): Order[] => orders().map((o) => (o.id === id ? { ...o, status: 'ready_for_delivery' as const, stepTimes: { ...o.stepTimes, ready_for_delivery: '15h24' } } : o))

describe('painel de entregas', () => {
  it('para sair: 2 pedidos de entrega (preparo e novo); em rota: 1; entregues: 2 — como no quadro', () => {
    const rows = dispatchRows(orders(), buildDeliverySeed(now))
    expect(rows.filter((r) => r.tab === 'out').map((r) => `${r.orderId} ${r.label}`)).toEqual(['1041 Em preparo', '1043 Novo'])
    expect(rows.filter((r) => r.tab === 'route').map((r) => r.orderId)).toEqual(['1042'])
    expect(rows.filter((r) => r.tab === 'done').map((r) => r.orderId)).toEqual(['1038', '1036'])
  })

  it('retirada não entra no painel; só o pedido pronto abre o Atribuir', () => {
    const rows = dispatchRows(ready('1041'), buildDeliverySeed(now))
    expect(rows.find((r) => r.orderId === '1040')).toBeUndefined()
    const pronto = rows.find((r) => r.orderId === '1041')!
    expect(pronto).toMatchObject({ label: 'Pronto', href: '/gestao/entregas/atribuir/1041' })
    expect(pronto.detail).toBe('Pronto às 15h24 · Bairro Alto · 4,1 km')
    expect(rows.find((r) => r.orderId === '1043')).toMatchObject({ href: null, detail: 'Aguardando aceite · Centro · 1,8 km' })
    expect(rows[0].orderId).toBe('1041') // o pronto vem primeiro
  })

  it('detalhe de em rota e de entregues', () => {
    const rows = dispatchRows(orders(), buildDeliverySeed(now))
    expect(rows.find((r) => r.orderId === '1042')!.detail).toMatch(/^Carlos \(próprio\) · saiu 15h12 · previsão 15h40$/)
    expect(rows.find((r) => r.orderId === '1038')!.detail).toBe('Bruno (próprio) · entregue 13h05')
    expect(rows.find((r) => r.orderId === '1036')!.detail).toBe('Diego (parceiro) · entregue 11h48')
  })

  it('entregadores: Carlos em rota com o #1042 e volta 15h50, Bruno disponível, parceiros online', () => {
    const c = courierRows(couriers, buildDeliverySeed(now))
    expect(c[0]).toMatchObject({ name: 'Carlos', detail: 'Próprio · em rota com #1042, volta 15h50', tag: { label: 'Em rota' } })
    expect(c[1]).toMatchObject({ name: 'Bruno', detail: 'Próprio · na loja', tag: { label: 'Disponível' } })
    expect(c[2]).toMatchObject({ name: 'Parceiros', detail: 'Avulsos · 2 com o app aberto agora', tag: { label: '2 online' } })
  })
})

describe('atribuir', () => {
  it('opções: Bruno livre, Carlos em rota, parceiros por R$ 9,00', () => {
    const o = assignOptions(couriers, buildDeliverySeed(now))
    expect(o.map((x) => x.id)).toEqual(['bruno', 'carlos', 'partners'])
    expect(o[0]).toMatchObject({ title: 'Bruno · próprio', detail: 'Na loja agora · sai em seguida', button: 'Enviar com o Bruno' })
    expect(o[1]).toMatchObject({ detail: 'Volta às 15h50 · pode levar junto na próxima saída', button: 'Reservar para o Carlos' })
    expect(o[2]).toMatchObject({ detail: 'O primeiro que aceitar leva · 2 online', priceCents: 900, button: 'Publicar por R$ 9,00' })
  })

  it('com o Bruno: atribuída; com o Carlos em rota: reservada; parceiros: publicada com o valor', () => {
    const recs = buildDeliverySeed(now)
    const a = assign(ready('1041'), recs, couriers, '1041', 'bruno', now)
    expect(a.record).toMatchObject({ status: 'assigned', courierId: 'bruno', kind: 'own' })
    expect(a.assignment).toEqual({ title: 'Bruno recebeu a entrega', summary: 'O pedido apareceu no app do Bruno. Quem comprou recebe o aviso quando sair.' })
    const c = assign(ready('1041'), recs, couriers, '1041', 'carlos', now)
    expect(c.record.status).toBe('reserved')
    expect(c.assignment).toEqual({ title: 'Reservado para o Carlos', summary: 'Entra na lista do Carlos quando voltar, às 15h50.' })
    const p = assign(ready('1041'), recs, couriers, '1041', 'partners', now)
    expect(p.record).toMatchObject({ status: 'published', courierId: null, feeCents: 900 })
    expect(p.assignment.summary).toBe('Avisamos aqui quando um parceiro aceitar. Se ninguém aceitar em 10 min, volta para você.')
  })

  it('recusa pedido que não está pronto, que já tem entrega e que não é de entrega', () => {
    const recs = buildDeliverySeed(now)
    expect(() => assign(orders(), recs, couriers, '1041', 'bruno', now)).toThrow(DeliveryError)
    expect(() => assign(orders(), recs, couriers, '1041', 'bruno', now)).toThrowError('not_ready')
    expect(() => assign(ready('1041'), recs, couriers, '1042', 'bruno', now)).toThrowError('already_assigned')
    expect(() => assign(ready('1040'), recs, couriers, '1040', 'bruno', now)).toThrowError('not_found') // retirada
  })

  it('desfazer remove a atribuição enquanto não saiu; em rota e entregue não', () => {
    const recs = buildDeliverySeed(now)
    const { record } = assign(ready('1041'), recs, couriers, '1041', 'bruno', now)
    expect(unassign([...recs, record], '1041')).toHaveLength(recs.length)
    expect(() => unassign(recs, '1042')).toThrowError('no_assignment')
    expect(() => unassign(recs, '1038')).toThrowError('no_assignment')
  })
})
