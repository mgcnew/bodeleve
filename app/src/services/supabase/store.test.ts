import { describe, expect, it } from 'vitest'
import type { Db } from './client'
import { createSupabaseStore, toOrder } from './store'

type Call = { fn: string; args: Record<string, unknown> }

function fakeClient(answers: Record<string, unknown>) {
  const calls: Call[] = []
  const client = {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      calls.push({ fn, args })
      const a = answers[fn]
      if (a instanceof Error) return { data: null, error: { message: a.message } }
      return { data: a ?? null, error: null }
    },
  } as unknown as Db
  return { client, calls }
}

const mem = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

const dbOrder = {
  number: '1001', status: 'preparing', fulfillment: 'delivery', created_at: '2026-11-16T13:00:00Z',
  contact: { name: 'Ana', phone: '11999990000' },
  address: { street: 'Rua A', number: '10', district: 'Centro', cep: '01000000' },
  window: { id: 'asap' }, subtotal_cents: 3000, delivery_fee_cents: 800, total_cents: 3800,
  payment: { method: 'cash', paid: false, change_for_cents: 5000 }, delivery_code: '4321', eta_label: 'Hoje, 10:58', courier_name: 'Carlos',
  step_times: { received: '09:12', preparing: '09:20' },
  items: [{ slug: 'queijo-coalho', name: 'Queijo coalho', unit: '500 g', qty: 1, unit_price_cents: 3000 }],
}

describe('loja sobre o Supabase', () => {
  it('traduz o pedido do banco para o formato das telas (horário 14h52, janela conhecida)', () => {
    const o = toOrder(dbOrder, [{ id: 'asap', label: 'O quanto antes', detail: 'Hoje' }])
    expect(o.id).toBe('1001')
    expect(o.window.label).toBe('O quanto antes')
    expect(o.stepTimes).toEqual({ received: '09h12', preparing: '09h20' })
    expect(o.etaLabel).toBe('Hoje, 10h58')
    expect(o.items[0]).toMatchObject({ productId: 'queijo-coalho', unitPriceCents: 3000, qty: 1 })
    expect(o.payment).toEqual({ method: 'cash', changeForCents: 5000, paid: false })
  })

  it('catálogo: o identificador é o slug e o texto que falta vira marcador entre colchetes', async () => {
    const { client } = fakeClient({
      store_catalog: [{ slug: 'queijo-coalho', name: 'Queijo coalho', unit: '500 g', price_cents: 3000, origin: 'house', category_slug: 'queijos', description: '', details: { conservation: 'Refrigerado' } }],
      store_categories: [{ slug: 'queijos', name: 'Queijos', position: 0 }],
    })
    const s = createSupabaseStore({ client, slug: 'bodeleve', storage: mem() })
    const [p] = await s.catalog.listProducts()
    expect(p).toMatchObject({ id: 'queijo-coalho', categoryId: 'queijos', priceCents: 3000, origin: 'house' })
    expect(p.details.conservation).toBe('Refrigerado')
    expect(p.details.description).toMatch(/^\[DESCRIÇÃO/)
    expect(await s.catalog.listCategories()).toEqual([{ id: 'queijos', name: 'Queijos' }])
    expect((await s.catalog.getHomeSections()).map((x) => x.id)).toEqual(['pedidos', 'casa'])
  })

  it('pedido: manda só o que o servidor precisa (sem preço), guarda número e celular neste aparelho e acompanha por eles', async () => {
    const { client, calls } = fakeClient({ place_order: dbOrder, track_orders: [dbOrder], track_order: dbOrder, store_info: null })
    const storage = mem()
    const s = createSupabaseStore({ client, slug: 'bodeleve', storage })
    const placed = await s.orders.placeOrder({
      items: [{ productId: 'queijo-coalho', qty: 1 }], fulfillment: 'delivery', contact: { name: 'Ana', phone: '11999990000' },
      address: { cep: '01000000', street: 'Rua A', number: '10', complement: '', district: 'Centro', reference: '' }, windowId: 'asap',
      payment: { method: 'cash', changeForCents: 5000 },
    })
    expect(placed.id).toBe('1001')
    const sent = calls.find((c) => c.fn === 'place_order')!.args.p_order as Record<string, unknown>
    expect(sent.items).toEqual([{ slug: 'queijo-coalho', qty: 1 }])
    expect(JSON.stringify(sent)).not.toMatch(/price|total|fee/i)

    expect((await s.orders.listOrders()).map((o) => o.id)).toEqual(['1001'])
    expect(calls.find((c) => c.fn === 'track_orders')!.args).toMatchObject({ p_numbers: ['1001'], p_phone: '11999990000' })
    expect((await s.orders.getOrder('1001'))?.deliveryCode).toBe('4321')
    // outro aparelho não conhece o pedido: não consulta o banco
    const other = createSupabaseStore({ client, slug: 'bodeleve', storage: mem() })
    expect(await other.orders.getOrder('1001')).toBeNull()
  })

  it('erro do banco vira Error com o código', async () => {
    const { client } = fakeClient({ place_order: new Error('empty_order') })
    const s = createSupabaseStore({ client, slug: 'bodeleve', storage: mem() })
    await expect(
      s.orders.placeOrder({ items: [], fulfillment: 'pickup', contact: { name: 'Ana', phone: '11999990000' }, address: null, windowId: 'asap', payment: { method: 'pix', changeForCents: null } }),
    ).rejects.toThrow('empty_order')
  })

  it('A casa: usa o que o banco devolve e deixa o marcador onde está vazio', async () => {
    const { client } = fakeClient({ store_info: { address: 'Rua B, 2', whatsapp: '', hours: { weekdays: '8h às 18h', saturday: '', sunday: '' }, delivery_fee_cents: 900 } })
    const s = createSupabaseStore({ client, slug: 'bodeleve', storage: mem() })
    const c = await s.content.getStoreContent()
    expect(c.address).toBe('Rua B, 2')
    expect(c.whatsapp).toMatch(/^\[WHATSAPP/)
    expect(c.hours).toBe('Segunda a sexta: 8h às 18h')
    expect(await s.area.checkCep('01000-000')).toMatchObject({ covered: true, feeCents: 900 })
    expect(await s.area.checkCep('99000-000')).toEqual({ covered: false })
  })
})
