import { describe, expect, it } from 'vitest'
import { DeliveryError } from '@/domain/deliveries'
import type { Db } from './client'
import { createSupabaseCourier, e164 } from './courier'

const profile = { id: 'c1', establishment_id: 'e1', name: 'Carlos', kind: 'own', phone: '(00) 90000-0301', vehicle: 'Moto', available: true, pix_key: '' }
const at = '2026-11-16T12:00:00Z'
const card = (over: Record<string, unknown> = {}) => ({
  order_id: 'o-uuid', number: '1001', state: 'assigned', district: 'Centro', street: 'Rua A 10', address: { street: 'Rua A', number: '10', complement: '', district: 'Centro', reference: 'Portão azul' },
  items: 3, total_cents: 6370, payment_method: 'cash', payment_paid: false, change_for_cents: 10000, ready_at: '09:40', fee_cents: null, at, expected_at: null, return_at: null, problem_reason: null,
  customer: 'Ana', phone: '11999990000', ...over,
})

function fake(answers: Record<string, unknown | ((args: Record<string, unknown>) => unknown)>) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = []
  const client = {
    rpc: async (fn: string, args: Record<string, unknown> = {}) => {
      calls.push({ fn, args })
      const a = answers[fn]
      const v = typeof a === 'function' ? (a as (x: Record<string, unknown>) => unknown)(args) : a
      return v instanceof Error ? { data: null, error: { message: v.message } } : { data: v ?? null, error: null }
    },
    auth: { signOut: async () => ({}) },
  } as unknown as Db
  return { client, calls }
}

describe('app do entregador sobre o banco', () => {
  it('celular com DDD vira o formato internacional', () => {
    expect(e164('(11) 99999-0000')).toBe('+5511999990000')
    expect(e164('011999990000')).toBe('+5511999990000')
  })

  it('a lista usa as mesmas regras do app: o que é dele e o que está livre, sem código de entrega', async () => {
    const { client } = fake({ courier_link: profile, courier_list: { mine: [card()], available: [card({ order_id: 'o2', number: '1002', state: 'free', customer: undefined, phone: undefined, payment_paid: true })] } })
    const svc = createSupabaseCourier(client)
    const l = await svc.list('c1')
    expect(l.mine).toHaveLength(1)
    expect(l.mine[0]).toMatchObject({ orderId: '1001', tag: 'Para você', street: 'Rua A, 10', items: 3 })
    expect(l.mine[0].value.replace(/\s/g, ' ')).toBe('R$ 63,70')
    expect(l.available[0]).toMatchObject({ orderId: '1002', state: 'free' })
    expect(JSON.stringify(l)).not.toMatch(/delivery_code|deliveryCode/)
  })

  it('cada passo chama a função do banco com o pedido certo e devolve a tela da etapa', async () => {
    const { client, calls } = fake({
      courier_link: profile, courier_list: { mine: [card()], available: [] },
      courier_detail: () => card({ state: 'accepted', store_address: 'Rua da Loja, 1', mine: true }),
    })
    const svc = createSupabaseCourier(client)
    await svc.list('c1')
    const d = await svc.accept('c1', '1001')
    expect(calls.find((c) => c.fn === 'courier_accept')!.args).toEqual({ p_order: 'o-uuid' })
    expect(d).toMatchObject({ orderId: '1001', state: 'accepted', stage: 2, storeAddress: 'Rua da Loja, 1', customer: 'Ana', cashDueCents: 6370 })
    expect(d.payLine.replace(/\s/g, ' ')).toMatch(/Cobrar R\$ 63,70 em dinheiro.*troco para R\$ 100,00/)
    await svc.confirm('c1', '1001', '4321')
    expect(calls.find((c) => c.fn === 'courier_confirm')!.args).toEqual({ p_order: 'o-uuid', p_code: '4321' })
  })

  it('código errado e entrega de outra pessoa voltam como os erros que a tela já trata', async () => {
    const { client } = fake({ courier_link: profile, courier_list: { mine: [card({ state: 'en_route' })], available: [] }, courier_confirm: new Error('wrong_code'), courier_take: new Error('already_assigned') })
    const svc = createSupabaseCourier(client)
    await svc.list('c1')
    await expect(svc.confirm('c1', '1001', '0000')).rejects.toMatchObject({ code: 'wrong_code' })
    await expect(svc.take('c1', '1001')).rejects.toBeInstanceOf(DeliveryError)
  })

  it('pedido que a pessoa não pode ver não abre', async () => {
    const { client } = fake({ courier_link: profile, courier_list: { mine: [], available: [] }, courier_detail: null })
    const svc = createSupabaseCourier(client)
    expect(await svc.get('c1', '1001')).toBeNull()
  })

  it('o código por SMS só liga quando a casa aprovar (D21)', async () => {
    const { client } = fake({})
    await expect(createSupabaseCourier(client).requestCode('(00) 90000-0301')).rejects.toThrow('sms_disabled')
  })

  it('histórico de hoje', async () => {
    const { client } = fake({ courier_link: { ...profile, kind: 'partner' }, courier_history: { rows: [{ number: '1001', district: 'Centro', at: new Date().toISOString(), status: 'delivered', fee_cents: 900 }] } })
    const h = await createSupabaseCourier(client).history('c1')
    expect(h).toMatchObject({ delivered: 1, returned: 0, courierName: 'Carlos', payoutCents: 900 })
  })
})
