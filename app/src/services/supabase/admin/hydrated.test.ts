import { describe, expect, it } from 'vitest'
import { FinanceError } from '@/domain/finance'
import { PosError } from '@/domain/pos'
import { ProductionError } from '@/domain/production'
import type { Db } from '../client'
import { createAdminContext } from './context'
import { createHydratedAdmin } from './hydrated'

const EST = 'est-1'
const at = '2026-11-10T12:00:00Z'

type Rows = Record<string, unknown[]>
type Rpc = (fn: string, args: Record<string, unknown>) => { data?: unknown; error?: { message: string } | null }

function fake(rows: Rows, rpc: Rpc = () => ({ data: null }), afterWrite: Rows = {}) {
  const rpcs: Array<{ fn: string; args: Record<string, unknown> }> = []
  let loads = 0
  const client = {
    from: (table: string) => {
      const q: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'neq', 'is', 'in', 'order', 'limit', 'range', 'gt', 'gte']) q[m] = () => q
      q.maybeSingle = () => Promise.resolve({ data: table === 'memberships' ? { establishment_id: EST } : null, error: null })
      q.then = (res: (v: unknown) => unknown) => {
        if (table === 'products') loads++
        const written = rpcs.length > 0 && table in afterWrite
        return Promise.resolve({ data: (written ? afterWrite[table] : rows[table]) ?? [], error: null }).then(res)
      }
      return q
    },
    rpc: async (fn: string, args: Record<string, unknown>) => { rpcs.push({ fn, args }); return { data: null, error: null, ...rpc(fn, args) } },
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) },
  } as unknown as Db
  return { client, rpcs, loads: () => loads }
}

const product = (id: string, name: string, unit: string, extra: Record<string, unknown> = {}) => ({
  id, name, unit, item_type: 'raw_material', origin: null, category_id: null, min_stock: 10, tracks_expiry: true, supplier_id: 'sup-1', last_cost_cents: 300,
  price_cents: null, weight_price_cents: null, is_published: false, is_favorite_pos: false, sold_by_weight: false, description: '', content_qty: null, content_unit: null, ...extra,
})
const base: Rows = {
  products: [product('p-leite', 'Leite', '1 L'), product('p-queijo', 'Queijo coalho', '500 g', { item_type: 'finished', origin: 'house', price_cents: 3290, is_published: true, tracks_expiry: true })],
  product_lots: [{ id: 'lot-1', establishment_id: EST, product_id: 'p-leite', code: 'L1', expires_at: '2026-12-01T12:00:00Z', unit_cost_cents: 300, received_at: at, source: 'PC-0001' }],
  stock_movements: [{ id: 'm1', product_id: 'p-leite', lot_id: 'lot-1', type: 'purchase_in', qty: 40, at, ref: 'PC-0001', description: 'Compra', created_by_name: 'Dono', batch_id: null, reversal_of: null }],
  suppliers: [{ id: 'sup-1', name: 'Laticínios Serra', phone: '(00) 90000-0101', email: null, tax_id: null, supplies: 'Leite', created_at: at, payment_terms: null, lead_time_days: 2, previous_purchases_cents: 0 }],
  financial_accounts: [{ id: 'a-bank', kind: 'bank' }, { id: 'a-cash', kind: 'cash' }],
  financial_transactions: [{ id: 't1', at, account_id: 'a-bank', amount_cents: 100000, kind: 'opening', title: 'abertura', note: '', entry_id: null, principal_cents: null, transfer_id: null, reversal_of: null }],
}

describe('Estoque, Compras, Produção e Financeiro sobre o banco', () => {
  it('o estoque é montado pelas regras do app, com o que o banco entregou', async () => {
    const { client } = fake(base)
    const svc = createHydratedAdmin(createAdminContext(client))
    const o = await svc.stock.overview()
    const row = o.rows.find((r) => r.itemId === 'p-leite')!
    expect(row.physical).toBe(40)
    const item = await svc.stock.getItem('p-leite')
    expect(item?.lots[0]).toMatchObject({ code: 'L1', balance: 40, isNext: true })
  })

  it('leituras seguidas reaproveitam a carga; depois de gravar, recarrega', async () => {
    const f = fake(base)
    const svc = createHydratedAdmin(createAdminContext(f.client))
    await svc.stock.overview()
    await svc.stock.getItem('p-leite')
    expect(f.loads()).toBe(1)
    await svc.stock.undoMovement('m1', 'Dono')
    expect(f.loads()).toBe(2)
    expect(f.rpcs[0]).toEqual({ fn: 'stock_reverse', args: { p_movement: 'm1' } })
  })

  it('ajuste: manda a função do banco e devolve saldo antes e depois', async () => {
    const f = fake(base, () => ({ data: 'mv-9' }))
    const svc = createHydratedAdmin(createAdminContext(f.client))
    const r = await svc.stock.adjust({ itemId: 'p-leite', lotId: 'lot-1', qty: 5, kind: 'loss', reason: 'caiu', by: 'Dono' })
    expect(f.rpcs[0]).toEqual({ fn: 'stock_adjust', args: { p_product: 'p-leite', p_lot: 'lot-1', p_qty: 5, p_kind: 'loss', p_reason: 'caiu', p_add: false } })
    expect(r).toMatchObject({ movementId: 'mv-9', physicalBefore: 40, physicalAfter: 35, lotCode: 'L1', itemName: 'Leite 1 L', costCents: 1500 })
  })

  it('compra: a mensagem ao fornecedor leva o número que o banco deu, e nada é enviado', async () => {
    const written = { purchase_orders: [{ id: 'po-1', number: 'PC-0007', supplier_id: 'sup-1', status: 'sent', created_at: at, sent_at: at, expected_at: at, received_at: null, payment_term: 'boleto14', purchase_order_items: [{ id: 'i1', product_id: 'p-leite', qty: 20, unit_cost_cents: 300, received_qty: 0 }] }] }
    const f = fake(base, (fn) => (fn === 'create_purchase_order' ? { data: { id: 'po-1', number: 'PC-0007' } } : { data: null }), written)
    const svc = createHydratedAdmin(createAdminContext(f.client))
    const r = await svc.purchasing.send({ supplierId: 'sup-1', expectedAt: at, payment: 'boleto14', items: [{ itemId: 'p-leite', qty: 20 }] })
    const sent = f.rpcs.find((x) => x.fn === 'create_purchase_order')!.args
    expect(sent.p_message).toContain('Pedido {number}')
    expect(sent.p_items).toEqual([{ product_id: 'p-leite', qty: 20 }])
    expect(JSON.stringify(sent)).not.toMatch(/cost|price/i)
    expect(r.message).toContain('Pedido PC-0007')
    expect(r.order.id).toBe('PC-0007')
  })

  it('recebimento: confere a nota antes de chamar o banco', async () => {
    const f = fake({ ...base, purchase_orders: [{ id: 'po-1', number: 'PC-0001', supplier_id: 'sup-1', status: 'sent', created_at: at, sent_at: at, expected_at: at, received_at: null, payment_term: 'boleto14', purchase_order_items: [{ id: 'i1', product_id: 'p-leite', qty: 20, unit_cost_cents: 300, received_qty: 0 }] }] })
    const svc = createHydratedAdmin(createAdminContext(f.client))
    await expect(svc.purchasing.receive('PC-0001', { lines: [{ itemId: 'p-leite', qty: 10, lot: '', expiresAt: null }], closeShort: false })).rejects.toMatchObject({ code: 'invalid_lines' })
    await expect(svc.purchasing.receive('PC-0001', { lines: [{ itemId: 'p-leite', qty: 25, lot: 'L9', expiresAt: '2026-12-10T12:00:00Z' }], closeShort: false })).rejects.toMatchObject({ code: 'invalid_lines' })
    expect(f.rpcs).toHaveLength(0)
  })

  it('produção: falta de insumo chega à tela com o item', async () => {
    const f = fake({ ...base, recipes: [{ id: 'r1', product_id: 'p-queijo', yield_per_batch: 10, batch_label: 'fornada', shelf_life_days: 30, lot_prefix: 'QC', overhead_cents: 100, method: '', recipe_items: [{ product_id: 'p-leite', qty_per_batch: 20 }] }],
      production_orders: [{ id: 'op-1', number: 'OP-0001', recipe_id: 'r1', product_id: 'p-queijo', batches: 1, planned_qty: 10, status: 'in_progress', destination_order_id: null, starts_at: at, ends_at: null, started_at: at, done_at: null, good_qty: null, lot_id: null, cost_per_unit_cents: null, created_at: at }] },
    () => ({ error: { message: 'insufficient_input:Leite' } }))
    const svc = createHydratedAdmin(createAdminContext(f.client))
    const err = await svc.production.finish('OP-0001', { consumption: [{ itemId: 'p-leite', qty: 99 }], goodQty: 9, lotCode: 'QC-1', expiresAt: null }).catch((e) => e)
    expect(err).toBeInstanceOf(ProductionError)
    expect(err).toMatchObject({ code: 'insufficient', detail: 'p-leite' })
    expect(f.rpcs[0].args).toMatchObject({ p_order: 'op-1', p_consumption: [{ product_id: 'p-leite', qty: 99 }] })
  })

  it('financeiro: saldo insuficiente volta com o saldo da conta', async () => {
    const f = fake(base, () => ({ error: { message: 'insufficient_balance:5000' } }))
    const svc = createHydratedAdmin(createAdminContext(f.client))
    const err = await svc.finance.pay('e1', { amountCents: 9000, fineCents: 0, accountId: 'cash', method: 'Dinheiro', paidAt: at }).catch((e) => e)
    expect(err).toBeInstanceOf(FinanceError)
    expect(err).toMatchObject({ code: 'insufficient_balance', detail: '5000' })
  })

  it('entregas: atribui pelo pedido, publica para parceiros sem entregador e traduz os erros', async () => {
    const order = { id: 'o-1', number: '1001', channel: 'online', status: 'ready_for_delivery', fulfillment: 'delivery', created_at: at, customer_id: null, contact_name: 'Ana', contact_phone: '11999990000', address: { street: 'Rua A', number: '1', district: 'Centro' }, delivery_window: { id: 'asap' }, subtotal_cents: 1000, delivery_fee_cents: 800, total_cents: 1800, payment_method: 'pix', payment_paid: true, change_for_cents: null, delivery_code: '1111', eta_label: null, courier_name: null, step_times: {}, order_items: [] }
    const f = fake({ ...base, orders: [order], couriers: [{ id: 'c1', name: 'Carlos', kind: 'own', phone: '(00) 90000-0301', vehicle: 'Moto', available: true, pix_key: '', created_at: at }] })
    const svc = createHydratedAdmin(createAdminContext(f.client))
    await svc.deliveries.assign('1001', 'c1')
    await svc.deliveries.assign('1001', 'partners')
    expect(f.rpcs.filter((r) => r.fn === 'delivery_assign').map((r) => r.args)).toEqual([{ p_order: 'o-1', p_courier: 'c1' }, { p_order: 'o-1', p_courier: null }])
    const bad = fake({ ...base, orders: [order] }, () => ({ error: { message: 'already_assigned' } }))
    await expect(createHydratedAdmin(createAdminContext(bad.client)).deliveries.assign('1001', 'partners')).rejects.toMatchObject({ code: 'already_assigned' })
    await expect(createHydratedAdmin(createAdminContext(bad.client)).deliveries.assign('9999', 'partners')).rejects.toMatchObject({ code: 'not_found' })
  })

  describe('balcão', () => {
    const queijo = product('p-queijo', 'Queijo coalho', '500 g', { item_type: 'finished', origin: 'house', price_cents: 3000, is_published: true, tracks_expiry: false })
    const pos: Rows = {
      ...base,
      products: [product('p-leite', 'Leite', '1 L'), queijo],
      product_lots: [{ id: 'lot-q', establishment_id: EST, product_id: 'p-queijo', code: 'Q1', expires_at: null, unit_cost_cents: 1500, received_at: at, source: '' }],
      stock_movements: [{ id: 'mq', product_id: 'p-queijo', lot_id: 'lot-q', type: 'purchase_in', qty: 10, at, ref: '', description: null, created_by_name: null, batch_id: null, reversal_of: null }],
      cash_sessions: [{ id: 'cx1', opened_at: at, opened_by_name: 'Julia', opening_cents: 10000, baseline: {}, status: 'open', closed_at: null, closed_by_name: null, counted_cents: null, expected_cents: null, difference_tx_id: null }],
    }
    const sold = [{ id: 'o-v1', number: 'V-0001', channel: 'pos', status: 'completed', cash_session_id: 'cx1', created_at: at, created_by_name: 'Julia', subtotal_cents: 3000, discount_kind: null, discount_cents: 0, discount_reason: null, total_cents: 3000, pending_sync: false, cancelled_at: null, approved_by_name: null,
      order_items: [{ product_id: 'p-queijo', name: 'Queijo coalho', unit: '500 g', kind: 'unit', qty: 1, unit_price_cents: 3000, total_cents: 3000, lots: [{ lotCode: 'Q1', qty: 1 }] }], payments: [{ method: 'pix', cents: 3000, received_cents: null }] }]
    const input = { lines: [{ key: 'a', itemId: 'p-queijo', kind: 'unit' as const, qty: 1 }], discount: null, payments: [{ method: 'pix' as const, cents: 3000 }] }

    it('venda: manda só produto, quantidade e forma de pagamento; o preço vem do banco', async () => {
      const f = fake(pos, (fn) => (fn === 'pos_checkout' ? { data: { number: 'V-0001' } } : { data: null }), { orders: sold })
      const svc = createHydratedAdmin(createAdminContext(f.client))
      const sale = await svc.pos.checkout(input, 'Julia')
      const sent = f.rpcs.find((r) => r.fn === 'pos_checkout')!.args.p_sale as Record<string, unknown>
      expect(sent).toEqual({ lines: [{ product_id: 'p-queijo', kind: 'unit', qty: 1 }], discount: null, payments: [{ method: 'pix', cents: 3000, received_cents: null }], offline: false })
      expect(JSON.stringify(sent)).not.toMatch(/price|total/i)
      expect(sale).toMatchObject({ id: 'V-0001', totalCents: 3000, status: 'completed', by: 'Julia' })
    })

    it('erro do banco vira o erro do balcão; senha errada volta como senha incorreta', async () => {
      const f = fake(pos, (fn) => (fn === 'pos_checkout' ? { error: { message: 'insufficient_stock:p-queijo' } } : { data: { error: 'invalid_pin' } }), { orders: sold })
      const svc = createHydratedAdmin(createAdminContext(f.client))
      const e1 = await svc.pos.checkout(input, 'Julia').catch((e) => e)
      expect(e1).toBeInstanceOf(PosError)
      expect(e1).toMatchObject({ code: 'insufficient_stock', detail: 'p-queijo' })
      const e2 = await createHydratedAdmin(createAdminContext(fake({ ...pos, orders: sold }, () => ({ data: { error: 'invalid_pin' } })).client)).pos.cancelSale('V-0001', '0000').catch((e) => e)
      expect(e2).toMatchObject({ code: 'invalid_pin' })
    })

    it('sem conexão: a venda sai pelas regras do app, fica na fila e sobe quando a conexão volta', async () => {
      localStorage.clear()
      const f = fake(pos, (fn) => (fn === 'pos_checkout' ? { data: { number: 'V-0001' } } : { data: null }))
      const svc = createHydratedAdmin(createAdminContext(f.client))
      await svc.pos.catalog()
      const sale = await svc.pos.checkout({ ...input, offline: true }, 'Julia')
      expect(sale).toMatchObject({ pending: true, totalCents: 3000 })
      expect(sale.id).toMatch(/^OFF-/)
      expect(f.rpcs.filter((r) => r.fn === 'pos_checkout')).toHaveLength(0)
      expect((await svc.pos.overview()).pendingSales).toBe(1)
      expect((await svc.pos.getSale(sale.id))?.id).toBe(sale.id)
      expect(await svc.pos.syncPending()).toBe(1)
      expect(f.rpcs.find((r) => r.fn === 'pos_checkout')!.args.p_sale).toMatchObject({ offline: true })
      expect((await svc.pos.overview()).pendingSales).toBe(0)
    })

    it('caixa aberto uma vez só: o erro do banco segue como na simulação', async () => {
      const f = fake(pos, () => ({ error: { message: 'session_open' } }))
      await expect(createHydratedAdmin(createAdminContext(f.client)).pos.openSession(5000, 'Julia')).rejects.toThrow('session_open')
    })
  })

  it('início e relatórios: nada de números de exemplo; contam só o que o banco tem', async () => {
    const svc = createHydratedAdmin(createAdminContext(fake(base).client))
    const d = await svc.dashboard.get()
    expect(d.salesToday).toMatchObject({ totalCents: 0, count: 0, yesterdayUntilNowCents: 0 })
    const week = await svc.reports.sales('7d' as never).catch(() => null)
    const hub = await svc.reports.hub()
    expect(hub.bestSeller).toBeNull()
    expect(week === null || week.totalCents === 0).toBe(true)
    const now = new Date().toISOString()
    const sold = fake({ ...base, orders: [{ id: 'o-v', number: 'V-0001', channel: 'pos', status: 'completed', cash_session_id: null, created_at: now, created_by_name: 'J', subtotal_cents: 5000, discount_kind: null, discount_cents: 0, discount_reason: null, total_cents: 5000, pending_sync: false, cancelled_at: null, approved_by_name: null, order_items: [{ product_id: 'p-queijo', name: 'Queijo', unit: '500 g', kind: 'unit', qty: 2, unit_price_cents: 2500, total_cents: 5000, lots: [] }], payments: [{ method: 'cash', cents: 5000, received_cents: null }] }] })
    const d2 = await createHydratedAdmin(createAdminContext(sold.client)).dashboard.get()
    expect(d2.salesToday.counter).toEqual({ count: 1, cents: 5000 })
  })
})

