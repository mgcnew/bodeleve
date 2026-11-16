import { describe, expect, it } from 'vitest'
import { createAdminServices } from './adminServices'
import { createDb } from './db'
import { memoryStorage } from '@/test/renderApp'

async function setup(readyOrder = true) {
  const storage = memoryStorage()
  const now = new Date()
  const db = createDb({ storage, withSeed: true, now: () => now })
  const svc = createAdminServices({ db, now: () => now })
  if (readyOrder) {
    const o = (await svc.orders.get('1041'))!
    await svc.orders.markReady('1041', o.items.map((i) => i.productId))
  }
  return { db, svc }
}

describe('entrar', () => {
  it('só entra quem a casa cadastrou, com o código; o celular pode ter qualquer pontuação', async () => {
    const { svc } = await setup(false)
    await expect(svc.courier.requestCode('(00) 98888-0000')).rejects.toMatchObject({ code: 'not_found' })
    await expect(svc.courier.requestCode('(00) 90000-0300')).resolves.toBeUndefined()
    await expect(svc.courier.verify('(00) 90000-0300', '0000')).rejects.toThrow('invalid_code')
    await expect(svc.courier.verify('(00) 98888-0000', '1234')).rejects.toMatchObject({ code: 'not_found' })
    expect(await svc.courier.verify('0090000-0300', '1234')).toMatchObject({ id: 'bruno', name: 'Bruno', kind: 'own' })
    expect(await svc.courier.verify('(00) 90000-0302', '1234')).toMatchObject({ id: 'diego', kind: 'partner' })
  })
})

describe('lista do entregador', () => {
  it('da casa: vê o pedido pronto como livre e o que é dele em Minhas', async () => {
    const { svc } = await setup()
    const l = await svc.courier.list('bruno')
    expect(l.profile.name).toBe('Bruno')
    expect(l.available).toEqual([expect.objectContaining({ orderId: '1041', district: 'Bairro Alto', street: 'Rua do Sol, 88', km: '4,1 km', items: 6, state: 'free', detail: 'Ainda sem entregador. Você pode pegar.', valueLabel: 'Cobrar', value: 'Nada' })])
    expect(l.mine).toEqual([])
    const c = await svc.courier.list('carlos')
    expect(c.mine.map((m) => [m.orderId, m.tag, m.state])).toEqual([['1042', 'Em rota', 'en_route']])
  })

  it('parceiro vê só o publicado e o valor que recebe', async () => {
    const { svc } = await setup()
    expect((await svc.courier.list('diego')).available).toEqual([])
    await svc.deliveries.assign('1041', 'partners')
    const d = await svc.courier.list('diego')
    expect(d.available).toEqual([expect.objectContaining({ orderId: '1041', state: 'published', valueLabel: 'Você recebe', value: 'R$\u00a09,00', detail: 'Publicada para parceiros · você recebe R$\u00a09,00' })])
    expect((await svc.courier.list('bruno')).available).toEqual([])
  })
})

describe('a entrega do começo ao fim', () => {
  it('pegar, aceitar, sair, confirmar: o pedido anda e a gestão acompanha', async () => {
    const { svc, db } = await setup()
    let d = await svc.courier.take('bruno', '1041')
    expect(d).toMatchObject({ state: 'assigned', stage: 1, customer: 'Paula Reis', street: 'Rua do Sol, 88', district: 'Bairro Alto', km: '4,1 km', minutes: 12, items: 6, payLine: 'Pago no Pix. Nada a cobrar.', partnerFeeCents: null })
    expect((await svc.courier.list('bruno')).mine.map((m) => m.tag)).toEqual(['Para você'])
    expect((await svc.deliveries.overview()).rows.find((r) => r.orderId === '1041')).toMatchObject({ label: 'Atribuída' })
    d = await svc.courier.accept('bruno', '1041')
    expect(d).toMatchObject({ state: 'accepted', stage: 2 })
    expect((await svc.deliveries.overview()).rows.find((r) => r.orderId === '1041')).toMatchObject({ label: 'Aceita' })
    d = await svc.courier.depart('bruno', '1041')
    expect(d).toMatchObject({ state: 'en_route', stage: 3 })
    expect(db.read().orders.find((o) => o.id === '1041')).toMatchObject({ status: 'out_for_delivery', courierName: 'Bruno' })
    const ov = await svc.deliveries.overview()
    expect(ov.rows.find((r) => r.orderId === '1041')).toMatchObject({ tab: 'route', label: 'Em rota' })
    expect(ov.couriers.find((c) => c.id === 'bruno')?.tag.label).toBe('Em rota')
    await expect(svc.courier.confirm('bruno', '1041', '0000')).rejects.toMatchObject({ code: 'wrong_code' })
    d = await svc.courier.confirm('bruno', '1041', db.read().orders.find((o) => o.id === '1041')!.deliveryCode)
    expect(d).toMatchObject({ state: 'delivered', stage: 0 })
    expect(db.read().orders.find((o) => o.id === '1041')?.status).toBe('delivered')
    expect((await svc.deliveries.overview()).rows.find((r) => r.orderId === '1041')).toMatchObject({ tab: 'done', label: 'Entregue' })
    const h = await svc.courier.history('bruno')
    expect(h).toMatchObject({ delivered: 2, returned: 0, courierName: 'Bruno' })
    expect(h.rows.map((r) => r.orderId)).toEqual(['1041', '1038'])
  })

  it('o código de entrega nunca vai para o entregador', async () => {
    const { svc } = await setup()
    const d = await svc.courier.take('bruno', '1041')
    expect(JSON.stringify(d)).not.toContain('2290') // código do pedido 1041
    expect(Object.keys(d)).not.toContain('deliveryCode')
  })

  it('só vê o detalhe do que é livre ou dele; o de outro não abre', async () => {
    const { svc } = await setup()
    expect(await svc.courier.get('bruno', '1041')).not.toBeNull()
    expect(await svc.courier.get('diego', '1041')).toBeNull() // não foi publicado
    expect(await svc.courier.get('bruno', '1042')).toBeNull() // é do Carlos
    expect(await svc.courier.get('carlos', '1042')).toMatchObject({ stage: 3 })
    expect(await svc.courier.get('bruno', '1040')).toBeNull() // retirada
  })

  it('parceiro aceita o publicado, entrega e o valor entra no histórico', async () => {
    const { svc, db } = await setup()
    await svc.deliveries.assign('1041', 'partners')
    const d = await svc.courier.take('diego', '1041')
    expect(d).toMatchObject({ state: 'assigned', partnerFeeCents: 900 })
    await svc.courier.accept('diego', '1041')
    await svc.courier.depart('diego', '1041')
    await svc.courier.confirm('diego', '1041', db.read().orders.find((o) => o.id === '1041')!.deliveryCode)
    const h = await svc.courier.history('diego')
    expect(h).toMatchObject({ delivered: 2, returned: 0, payoutCents: 1800 })
    expect(h.payoutDetail).toBe('2 entregas × R$ 9,00 + 0 devoluções × R$ 4,50. Pago por Pix toda segunda.')
  })

  it('devolver à loja volta o pedido a pronto; a gestão atribui de novo; desfazer só antes', async () => {
    const { svc, db } = await setup()
    await svc.courier.take('bruno', '1041')
    await svc.courier.accept('bruno', '1041')
    await svc.courier.depart('bruno', '1041')
    await svc.courier.problem('bruno', '1041', 'Cliente não atende', 'Portão fechado')
    expect(db.read().orders.find((o) => o.id === '1041')?.status).toBe('ready_for_delivery')
    const ov = await svc.deliveries.overview()
    expect(ov.rows.filter((r) => r.orderId === '1041').map((r) => [r.tab, r.label])).toEqual(expect.arrayContaining([['out', 'Pronto'], ['done', 'Devolvida']]))
    expect((await svc.courier.history('bruno')).returned).toBe(1)
    const back = await svc.courier.undoProblem('bruno', '1041')
    expect(back).toMatchObject({ state: 'en_route', stage: 3 })
    expect((await svc.courier.history('bruno')).returned).toBe(0)
    await svc.courier.problem('bruno', '1041', 'Outro', '')
    await svc.deliveries.assign('1041', 'bruno')
    await expect(svc.courier.undoProblem('bruno', '1041')).rejects.toMatchObject({ code: 'wrong_state' })
  })

  it('pagamento na entrega: a venda fica paga quando entrega', async () => {
    const { svc, db } = await setup(false)
    await svc.orders.accept('1044').catch(() => null)
    const o = db.read().orders.find((x) => x.id === '1041')!
    expect(o.payment.paid).toBe(true)
    // 1044 é retirada (dinheiro, ainda não paga): a regra de cobrança aparece na linha de pagamento de uma entrega em dinheiro
    db.update((st) => { const x = st.orders.find((y) => y.id === '1041')!; x.payment = { method: 'cash', changeForCents: 20000, paid: false }; x.status = 'ready_for_delivery' })
    const d = await svc.courier.take('bruno', '1041')
    expect(d.payLine).toMatch(/^Cobrar R\$.132,10 em dinheiro \(troco para R\$.200,00\)\.$/)
    expect(d.cashDueCents).toBe(13210)
    await svc.courier.accept('bruno', '1041')
    await svc.courier.depart('bruno', '1041')
    await svc.courier.confirm('bruno', '1041', o.deliveryCode)
    expect(db.read().orders.find((x) => x.id === '1041')?.payment.paid).toBe(true)
  })

  it('disponibilidade: fora do turno não vê nem pega; chave Pix é guardada', async () => {
    const { svc } = await setup()
    await svc.courier.setAvailable('bruno', false)
    expect((await svc.courier.list('bruno')).available).toEqual([])
    await expect(svc.courier.take('bruno', '1041')).rejects.toMatchObject({ code: 'unavailable' })
    expect((await svc.deliveries.overview()).couriers.find((c) => c.id === 'bruno')).toMatchObject({ detail: 'Próprio · fora do turno', tag: { label: 'Fora do turno' } })
    expect((await svc.deliveries.getAssign('1041'))!.options.map((o) => o.id)).toEqual(['carlos', 'partners'])
    await svc.courier.setAvailable('bruno', true)
    expect(await svc.courier.savePix('diego', '  chave@exemplo.com ')).toMatchObject({ pixKey: 'chave@exemplo.com' })
  })
})
