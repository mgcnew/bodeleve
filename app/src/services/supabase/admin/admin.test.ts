import { describe, expect, it } from 'vitest'
import type { ProductInput } from '@/domain/catalog'
import type { Db } from '../client'
import { createSupabaseCatalogAdmin } from './catalog'
import { createAdminContext } from './context'
import { createSupabaseOrdersAdmin } from './orders'
import { createSupabaseSettings } from './settings'

type State = { table: string; op: 'select' | 'insert' | 'update'; filters: Array<[string, string, unknown]>; payload?: Record<string, unknown>; single: boolean }
type Answer = { data: unknown; error?: { message: string; code?: string } | null }

/** Cliente falso: devolve o que o teste manda por tabela/operação e guarda o que foi pedido. */
function fake(handler: (s: State) => Answer, rpc: (fn: string, args: Record<string, unknown>) => Answer = () => ({ data: null }), session: string | null = 'user-1') {
  const log: State[] = []
  const rpcs: Array<{ fn: string; args: Record<string, unknown> }> = []
  const builder = (table: string) => {
    const s: State = { table, op: 'select', filters: [], single: false }
    const q: Record<string, unknown> = {}
    const chain = (name: string, f?: (...a: unknown[]) => void) => { q[name] = (...a: unknown[]) => { f?.(...a); return q } }
    chain('select')
    chain('insert', (p) => { s.op = 'insert'; s.payload = p as Record<string, unknown> })
    chain('update', (p) => { s.op = 'update'; s.payload = p as Record<string, unknown> })
    for (const f of ['eq', 'neq', 'in', 'gt', 'is']) chain(f, (c, v) => s.filters.push([f, String(c), v]))
    for (const f of ['order', 'limit']) chain(f)
    const done = (): Promise<Answer> => { log.push(s); const a = handler(s); return Promise.resolve({ error: null, ...a }) }
    q.maybeSingle = () => { s.single = true; return done().then((a) => ({ ...a, data: Array.isArray(a.data) ? (a.data[0] ?? null) : a.data })) }
    q.single = q.maybeSingle
    q.then = (res: (v: Answer) => unknown, rej: (e: unknown) => unknown) => done().then(res, rej)
    return q
  }
  const client = {
    from: builder,
    rpc: async (fn: string, args: Record<string, unknown>) => { rpcs.push({ fn, args }); return { error: null, ...rpc(fn, args) } },
    auth: { getSession: async () => ({ data: { session: session ? { user: { id: session } } : null } }) },
  } as unknown as Db
  return { client, log, rpcs }
}

const membership = (s: State): Answer | null => (s.table === 'memberships' && s.filters.some(([, c]) => c === 'user_id') ? { data: { establishment_id: 'est-1' } } : null)

const base: ProductInput = {
  name: 'Queijo coalho 500 g', categoryId: '', itemType: 'finished', origin: 'house', priceCents: 3290, weightPriceCents: 5990, minStock: '10', published: true,
  favoritePos: true, soldByWeight: true, tracksExpiry: true, description: '',
}

describe('contexto da Gestão', () => {
  it('sem sessão ou sem vínculo não há casa', async () => {
    const a = fake(() => ({ data: null }), undefined, null)
    await expect(createAdminContext(a.client).establishment()).rejects.toThrow('forbidden')
    const b = fake(() => ({ data: null }))
    await expect(createAdminContext(b.client).establishment()).rejects.toThrow('forbidden')
  })
  it('a casa vem do vínculo ativo, que não seja de entregador, e fica guardada', async () => {
    const { client, log } = fake((s) => membership(s) ?? { data: null })
    const ctx = createAdminContext(client)
    expect(await ctx.establishment()).toBe('est-1')
    expect(await ctx.establishment()).toBe('est-1')
    expect(log.filter((l) => l.table === 'memberships')).toHaveLength(1)
    expect(log[0].filters).toEqual(expect.arrayContaining([['eq', 'status', 'active'], ['neq', 'role', 'courier']]))
  })
})

describe('pedidos da Gestão', () => {
  const row = {
    id: 'o-uuid', number: '1001', channel: 'online', status: 'received', fulfillment: 'delivery', created_at: '2026-11-16T12:00:00Z', customer_id: 'c1',
    contact_name: 'Ana', contact_phone: '11999990000', address: { street: 'Rua A', number: '10', district: 'Centro' }, delivery_window: { id: 'asap' },
    subtotal_cents: 3000, delivery_fee_cents: 800, total_cents: 3800, payment_method: 'cash', payment_paid: false, change_for_cents: 5000, delivery_code: '4321',
    eta_label: null, courier_name: null, step_times: { received: '09:12' },
    order_items: [{ product_id: 'p-queijo', name: 'Queijo coalho', unit: '500 g', qty: 2, unit_price_cents: 1500 }],
  }
  const handler = (s: State): Answer => {
    const m = membership(s)
    if (m) return m
    if (s.table === 'orders' && s.filters.some(([, c]) => c === 'customer_id')) return { data: [{ customer_id: 'c1' }, { customer_id: 'c1' }] }
    if (s.table === 'orders') return { data: [row] }
    if (s.table === 'lot_balances') return { data: [{ product_id: 'p-queijo', code: 'QC-1', expires_at: '2026-12-01', received_at: '2026-11-01', balance: 5 }, { product_id: 'p-queijo', code: 'QC-2', expires_at: '2027-01-01', received_at: '2026-11-10', balance: 9 }] }
    if (s.table === 'customers') return { data: [{ id: 'c1', since: '2026-03-10', baseline_orders: 3 }] }
    return { data: null }
  }

  it('lista os abertos com o produto do banco, o lote que vence primeiro e o histórico da cliente', async () => {
    const { client, log } = fake(handler)
    const [o] = await createSupabaseOrdersAdmin(createAdminContext(client)).listOpen()
    expect(o.id).toBe('1001')
    expect(o.items[0]).toMatchObject({ productId: 'p-queijo', qty: 2, lot: { code: 'QC-1' } })
    expect(o.customerSince).toBe('2026-03-10')
    expect(o.customerOrderCount).toBe(5)
    expect(o.stepTimes).toEqual({ received: '09h12' })
    expect(o.window.label).toBe('O quanto antes')
    const q = log.find((l) => l.table === 'orders')!
    expect(q.filters).toEqual(expect.arrayContaining([['eq', 'channel', 'online']]))
  })

  it('aceitar e conferir chamam as funções do banco com o pedido certo', async () => {
    const { client, rpcs } = fake(handler)
    const svc = createSupabaseOrdersAdmin(createAdminContext(client))
    await svc.accept('1001')
    await svc.markReady('1001', ['p-queijo'])
    expect(rpcs).toEqual([
      { fn: 'order_accept', args: { p_order: 'o-uuid' } },
      { fn: 'order_mark_ready', args: { p_order: 'o-uuid', p_checked: ['p-queijo'] } },
    ])
  })

  it('o erro de regra do banco chega à tela com o código', async () => {
    const { client } = fake(handler, () => ({ data: null, error: { message: 'items_not_checked' } }))
    await expect(createSupabaseOrdersAdmin(createAdminContext(client)).markReady('1001', [])).rejects.toMatchObject({ code: 'items_not_checked' })
  })
})

describe('produtos da Gestão', () => {
  it('cadastra: a medida no fim do nome vira a embalagem e o slug repetido ganha número', async () => {
    let tries = 0
    const detail = { id: 'p1', name: 'Queijo coalho', unit: '500 g', item_type: 'finished', origin: 'house', category_id: null, min_stock: 10, tracks_expiry: true, last_cost_cents: null, price_cents: 3290, weight_price_cents: 5990, is_published: true, is_favorite_pos: true, sold_by_weight: true, description: '' }
    const { client, log } = fake((s) => {
      const m = membership(s)
      if (m) return m
      if (s.table === 'products' && s.op === 'insert') return ++tries === 1 ? { data: null, error: { message: 'duplicate key', code: '23505' } } : { data: { id: 'p1' } }
      if (s.table === 'products') return { data: detail }
      if (s.table === 'categories') return { data: [] }
      return { data: null }
    })
    const d = await createSupabaseCatalogAdmin(createAdminContext(client)).create(base)
    expect(d).toMatchObject({ id: 'p1', label: 'Queijo coalho 500 g', unit: '500 g', minStock: '10 un' })
    const inserts = log.filter((l) => l.op === 'insert').map((l) => l.payload)
    expect(inserts[0]).toMatchObject({ establishment_id: 'est-1', slug: 'queijo-coalho-500-g', name: 'Queijo coalho', unit: '500 g', category_id: null, price_cents: 3290, sold_by_weight: true })
    expect(inserts[1]).toMatchObject({ slug: 'queijo-coalho-500-g-2' })
  })

  it('matéria-prima não leva origem, preço, loja nem favorito', async () => {
    const { client, log } = fake((s) => membership(s) ?? (s.op === 'insert' ? { data: { id: 'p2' } } : { data: null }))
    await createSupabaseCatalogAdmin(createAdminContext(client)).create({ ...base, name: 'Leite 1 L', itemType: 'raw_material', soldByWeight: false, priceCents: null, weightPriceCents: null }).catch(() => undefined)
    expect(log.find((l) => l.op === 'insert')!.payload).toMatchObject({ origin: null, price_cents: null, weight_price_cents: null, is_published: false, is_favorite_pos: false, sold_by_weight: false })
  })

  it('recusa formulário inválido e venda por peso sem medida em g ou kg', async () => {
    const { client } = fake((s) => membership(s) ?? { data: null })
    const svc = createSupabaseCatalogAdmin(createAdminContext(client))
    await expect(svc.create({ ...base, name: '' })).rejects.toThrow('invalid')
    await expect(svc.create({ ...base, name: 'Leite 1 L' })).rejects.toThrow('invalid')
  })

  it('categoria repetida é recusada', async () => {
    const { client } = fake((s) => membership(s) ?? (s.table === 'categories' ? { data: [{ id: 'c1', name: 'Queijos', is_internal: false, position: 1 }] } : { data: null }))
    const svc = createSupabaseCatalogAdmin(createAdminContext(client))
    await expect(svc.addCategory('queijos')).rejects.toThrow('duplicate')
    await expect(svc.addCategory('  ')).rejects.toThrow('empty')
  })
})

describe('equipe da Gestão', () => {
  it('convite: e-mail inválido, papel inválido e pessoa já cadastrada são recusados; o válido fica pendente', async () => {
    const { client, log } = fake((s) => {
      const m = membership(s)
      if (m) return m
      if (s.table === 'memberships' && s.op === 'insert') return { data: { id: 'm9' } }
      if (s.table === 'memberships') return { data: [{ id: 'm1', email: 'dono@x.com', display_name: 'Dono', role: 'owner', status: 'active', note: '', created_at: '' }] }
      return { data: null }
    })
    const svc = createSupabaseSettings(createAdminContext(client))
    await expect(svc.invite('nao-e-email', 'clerk')).rejects.toThrow('invalid_email')
    await expect(svc.invite('a@x.com', 'owner')).rejects.toThrow('invalid_role')
    await expect(svc.invite('DONO@x.com', 'clerk')).rejects.toThrow('duplicate')
    const m = await svc.invite('Julia@X.com', 'clerk')
    expect(m).toMatchObject({ email: 'julia@x.com', role: 'clerk', pending: true })
    expect(log.find((l) => l.op === 'insert')!.payload).toMatchObject({ establishment_id: 'est-1', status: 'invited', email: 'julia@x.com' })
  })

  it('senha de gestor: só 4 a 8 números e vai para o banco (que guarda só o hash)', async () => {
    const { client, rpcs } = fake((s) => membership(s) ?? { data: null })
    const svc = createSupabaseSettings(createAdminContext(client))
    await expect(svc.setManagerPin('12')).rejects.toThrow('invalid')
    await svc.setManagerPin('2468')
    expect(rpcs).toEqual([{ fn: 'set_my_pin', args: { p_establishment: 'est-1', p_pin: '2468' } }])
  })

  it('custo da última compra: vai para o cadastro de quem compra pronto ou usa como insumo, nunca do produto acabado', async () => {
    const { client, log } = fake((s) => membership(s) ?? (s.op === 'insert' ? { data: { id: 'p3' } } : { data: null }))
    const svc = createSupabaseCatalogAdmin(createAdminContext(client))
    await svc.create({ ...base, name: 'Rapadura 400 g', itemType: 'resale', origin: 'resale', soldByWeight: false, weightPriceCents: null, lastCostCents: 1850 }).catch(() => undefined)
    await svc.create({ ...base, name: 'Queijo 500 g', itemType: 'finished', lastCostCents: 999 }).catch(() => undefined)
    const inserts = log.filter((l) => l.op === 'insert').map((l) => l.payload!)
    expect(inserts[0]).toMatchObject({ last_cost_cents: 1850 })
    expect(inserts[1]).not.toHaveProperty('last_cost_cents')
  })
})

