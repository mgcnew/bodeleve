import type { CategoryRecord, SaleInfo } from '@/domain/catalog'
import { DESCRIPTION_PLACEHOLDER } from '@/domain/catalog'
import type { CashTransaction, FinancialEntry } from '@/domain/finance'
import type { Lot, StockItem, StockMovement } from '@/domain/inventory'
import type { ProductionOrder, Recipe } from '@/domain/production'
import type { PaymentTermId, PurchaseOrder, Supplier } from '@/domain/purchasing'
import type { Receipt } from '@/domain/receiving'
import type { Reservation } from '@/domain/stock'
import type { Courier, DeliveryRecord } from '@/domain/deliveries'
import { emptyHouse } from '@/domain/settings'
import type { MockState } from '@/mocks/db'
import type { AdminContext } from './context'
import { toOrder } from './orders'

/**
 * Estado da casa, lido do Supabase e traduzido para o formato que as regras e as visões do app já conhecem (estoque, compras, produção, financeiro).
 * Assim as telas continuam calculando tudo com as mesmas regras testadas, e o banco só entrega os dados. Escritas NÃO passam por aqui: vão pelas funções do banco.
 * Lê tudo da casa a cada atualização (cabe numa casa pequena; quando crescer, trocar por consultas por tela).
 */

export type Registry = {
  state: MockState
  /** Número do documento → id no banco (as telas trabalham com "PC-0057"; as funções, com o id). */
  poId: Map<string, string>
  poItemId: Map<string, string>
  opId: Map<string, string>
  orderId: Map<string, string>
  /** Recebimentos que ainda valem, do mais novo para o mais antigo, por pedido de compra. */
  receiptsByPo: Map<string, string[]>
}

const PAGE = 1000

/** O Supabase devolve no máximo 1000 linhas por consulta: lê em páginas. */
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    out.push(...(data ?? []))
    if (!data || data.length < PAGE) return out
  }
}

const termOf = (t: string | null): PaymentTermId => (t === 'pix_on_delivery' || t === 'cash_on_delivery' ? t : 'boleto14')
const n = (v: number | string | null | undefined) => Number(v ?? 0)
const label = (p: { name: string; unit: string }) => (p.unit ? `${p.name} ${p.unit}` : p.name)

export async function hydrate(ctx: AdminContext): Promise<Registry> {
  const { client } = ctx
  const est = await ctx.establishment()

  const [products, categories, lots, movements, reservations, suppliers, pos, receipts, entries, txs, accounts, recipes, prodOrders, orders, courierRows, deliveryRows] = await Promise.all([
    all((a, b) => client.from('products').select('*').eq('establishment_id', est).eq('is_active', true).order('name').range(a, b)),
    all((a, b) => client.from('categories').select('*').eq('establishment_id', est).order('position').range(a, b)),
    all((a, b) => client.from('product_lots').select('*').eq('establishment_id', est).order('received_at').range(a, b)),
    all((a, b) => client.from('stock_movements').select('*').eq('establishment_id', est).order('at').range(a, b)),
    all((a, b) => client.from('stock_reservations').select('*').eq('establishment_id', est).range(a, b)),
    all((a, b) => client.from('suppliers').select('*').eq('establishment_id', est).order('name').range(a, b)),
    all((a, b) => client.from('purchase_orders').select('*, purchase_order_items(*)').eq('establishment_id', est).order('created_at').range(a, b)),
    all((a, b) => client.from('goods_receipts').select('*, goods_receipt_items(*)').eq('establishment_id', est).is('undone_at', null).order('received_at').range(a, b)),
    all((a, b) => client.from('financial_entries').select('*').eq('establishment_id', est).order('due_at').range(a, b)),
    all((a, b) => client.from('financial_transactions').select('*').eq('establishment_id', est).order('at').range(a, b)),
    all((a, b) => client.from('financial_accounts').select('*').eq('establishment_id', est).range(a, b)),
    all((a, b) => client.from('recipes').select('*, recipe_items(*)').eq('establishment_id', est).range(a, b)),
    all((a, b) => client.from('production_orders').select('*').eq('establishment_id', est).order('created_at').range(a, b)),
    all((a, b) => client.from('orders').select('*, order_items(product_id, name, unit, qty, unit_price_cents)').eq('establishment_id', est).eq('channel', 'online').order('created_at', { ascending: false }).range(a, b)),
    all((a, b) => client.from('couriers').select('*').eq('establishment_id', est).order('created_at').range(a, b)),
    all((a, b) => client.from('deliveries').select('*').eq('establishment_id', est).order('created_at').range(a, b)),
  ])

  const lotById = new Map(lots.map((l) => [l.id, l]))
  const productById = new Map(products.map((p) => [p.id, p]))
  const accountKind = new Map(accounts.map((a) => [a.id, a.kind as 'bank' | 'cash']))
  const orderNumber = new Map(orders.map((o) => [o.id, o.number]))

  const stockItems: StockItem[] = products.map((p) => ({
    id: p.id, name: p.name, unit: p.unit, itemType: p.item_type as StockItem['itemType'], origin: (p.origin as StockItem['origin']) ?? null,
    ...(p.content_qty != null && p.content_unit ? { content: { qty: n(p.content_qty), unit: p.content_unit } } : {}),
    categoryId: p.category_id ?? '', minStock: n(p.min_stock), tracksExpiry: p.tracks_expiry, supplierId: p.supplier_id, lastCostCents: p.last_cost_cents == null ? null : n(p.last_cost_cents),
  }))
  const sales: SaleInfo[] = products.map((p) => ({
    itemId: p.id, priceCents: p.price_cents == null ? null : n(p.price_cents), weightPriceCents: p.weight_price_cents == null ? null : n(p.weight_price_cents),
    published: p.is_published, favoritePos: p.is_favorite_pos, soldByWeight: p.sold_by_weight, description: p.description?.trim() ? p.description : DESCRIPTION_PLACEHOLDER,
  }))
  const cats: CategoryRecord[] = categories.map((c) => ({ id: c.id, name: c.name, ...(c.is_internal ? { internal: true } : {}) }))
  const lotList: Lot[] = lots.map((l) => ({ id: l.id, itemId: l.product_id, code: l.code, expiresAt: l.expires_at, unitCostCents: n(l.unit_cost_cents), receivedAt: l.received_at, source: l.source ?? '' }))
  const moves: StockMovement[] = movements.map((m) => ({
    id: m.id, itemId: m.product_id, lotId: m.lot_id, type: m.type as StockMovement['type'], qty: n(m.qty), at: m.at, ref: m.ref,
    ...(m.description ? { description: m.description } : {}), ...(m.created_by_name ? { by: m.created_by_name } : {}),
    ...(m.batch_id ? { batchId: m.batch_id } : {}), ...(m.reversal_of ? { reversalOf: m.reversal_of } : {}),
  }))
  const reservationList: Reservation[] = reservations.map((r) => ({ id: r.id, itemId: r.product_id, qty: n(r.qty), ref: r.ref }))

  const supplierList: Supplier[] = suppliers.map((s) => ({
    id: s.id, name: s.name, contactName: s.contact_name || '[NOME DO CONTATO]', phone: s.phone ?? '', email: s.email || '[E-MAIL]', doc: s.tax_id || '[CNPJ OU CPF]', supplies: s.supplies,
    since: s.created_at.slice(0, 4), defaultPayment: termOf(s.payment_terms), leadTime: s.lead_time_days == null ? '' : `${s.lead_time_days} ${s.lead_time_days === 1 ? 'dia' : 'dias'}`,
    previousPurchasesCents: n(s.previous_purchases_cents),
  }))

  const poId = new Map<string, string>()
  const poItemId = new Map<string, string>()
  const purchaseOrders: PurchaseOrder[] = pos.map((o) => {
    poId.set(o.number, o.id)
    const items = [...(o.purchase_order_items ?? [])].map((i) => {
      poItemId.set(`${o.number}:${i.product_id}`, i.id)
      const p = productById.get(i.product_id)
      return { itemId: i.product_id, name: p ? label(p) : '', qty: n(i.qty), unitCostCents: n(i.unit_cost_cents), receivedQty: n(i.received_qty) }
    })
    const closedShort = o.status === 'received' && items.some((i) => i.receivedQty < i.qty)
    return {
      id: o.number, supplierId: o.supplier_id, status: o.status as PurchaseOrder['status'], createdAt: o.created_at, sentAt: o.sent_at, expectedAt: o.expected_at ?? o.created_at,
      receivedAt: o.received_at, payment: termOf(o.payment_term), items, closedShort,
      // D21: o pedido é registrado; nenhuma mensagem sai.
      sentVia: 'registered_only',
    }
  })

  const receiptsByPo = new Map<string, string[]>()
  const receiptList: Receipt[] = receipts.map((r) => {
    const po = pos.find((x) => x.id === r.purchase_order_id)
    const number = po?.number ?? ''
    receiptsByPo.set(number, [r.id, ...(receiptsByPo.get(number) ?? [])])
    const items = r.goods_receipt_items ?? []
    const lotIds = items.map((i) => i.lot_id).filter((x): x is string => !!x)
    const payable = entries.find((e) => e.origin === 'purchase' && e.ref === number && n(e.amount_cents) === n(r.total_cents))
    return {
      id: r.id, orderId: number, at: r.received_at, lotIds,
      movementIds: movements.filter((m) => m.type === 'purchase_in' && m.ref === number && m.lot_id && lotIds.includes(m.lot_id)).map((m) => m.id),
      payableId: payable?.id ?? null,
      before: { status: 'sent', closedShort: false, receivedAt: null, receivedQty: {} },
    }
  })

  const entryList: FinancialEntry[] = entries.map((e) => ({
    id: e.id, direction: e.direction as FinancialEntry['direction'], description: e.description, amountCents: n(e.amount_cents), dueAt: e.due_at, paidAt: e.paid_at,
    origin: e.origin as FinancialEntry['origin'], ref: e.ref ?? '', supplierId: e.supplier_id, paidCents: n(e.paid_cents),
    ...(e.title ? { title: e.title } : {}), ...(e.kind_label ? { kindLabel: e.kind_label } : {}), ...(e.note ? { note: e.note } : {}),
    ...(e.recurring ? { recurring: true } : {}), ...(e.tag ? { tag: e.tag } : {}), ...(e.generated_from ? { generatedFrom: e.generated_from } : {}), createdAt: e.created_at,
  }))
  const txList: CashTransaction[] = txs.map((t) => ({
    id: t.id, at: t.at, accountId: accountKind.get(t.account_id) ?? 'bank', amountCents: n(t.amount_cents), kind: t.kind as CashTransaction['kind'], title: t.title, note: t.note,
    ...(t.entry_id ? { entryId: t.entry_id } : {}), ...(t.principal_cents != null ? { principalCents: n(t.principal_cents) } : {}),
    ...(t.transfer_id ? { transferId: t.transfer_id } : {}), ...(t.reversal_of ? { reversalOf: t.reversal_of } : {}),
  }))

  const recipeList: Recipe[] = recipes.map((r) => ({
    id: r.id, itemId: r.product_id, yieldPerBatch: n(r.yield_per_batch), batchLabel: r.batch_label, shelfLifeDays: r.shelf_life_days ?? 0,
    lines: (r.recipe_items ?? []).map((i) => ({ itemId: i.product_id, qtyPerBatch: n(i.qty_per_batch) })), overheadCents: n(r.overhead_cents), method: r.method, lotPrefix: r.lot_prefix,
  }))

  const opId = new Map<string, string>()
  const productionOrders: ProductionOrder[] = prodOrders.map((o) => {
    opId.set(o.number, o.id)
    const lot = o.lot_id ? lotById.get(o.lot_id) : undefined
    const dest = o.destination_order_id ? orderNumber.get(o.destination_order_id) : undefined
    return {
      id: o.number, recipeId: o.recipe_id, itemId: o.product_id, batches: o.batches, plannedQty: n(o.planned_qty), status: o.status as ProductionOrder['status'],
      destination: dest ? { kind: 'order', orderId: dest } : { kind: 'stock' }, startsAt: o.starts_at ?? o.created_at, endsAt: o.ends_at, startedAt: o.started_at, doneAt: o.done_at,
      goodQty: o.good_qty == null ? null : n(o.good_qty), lotCode: lot?.code ?? null, expiresAt: lot?.expires_at ?? null, costPerUnitCents: o.cost_per_unit_cents == null ? null : n(o.cost_per_unit_cents),
      lotId: o.lot_id, movementIds: [], reservationIds: reservations.filter((r) => r.ref === o.number).map((r) => r.id),
    }
  })

  const orderId = new Map<string, string>()
  const orderList = orders.map((o) => {
    orderId.set(o.number, o.id)
    return toOrder(o as unknown as Parameters<typeof toOrder>[0])
  })

  const courierList: Courier[] = courierRows.map((c) => ({ id: c.id, name: c.name, kind: c.kind as Courier['kind'], phone: c.phone, vehicle: c.vehicle, available: c.available, pixKey: c.pix_key }))
  const courierById = new Map(courierRows.map((c) => [c.id, c]))
  const orderByUuid = new Map(orders.map((o) => [o.id, o]))
  const deliveries: DeliveryRecord[] = deliveryRows.flatMap((d) => {
    const o = orderByUuid.get(d.order_id)
    if (!o) return []
    const c = d.courier_id ? courierById.get(d.courier_id) : undefined
    const prev = d.problem_prev as { at: string; expectedAt: string | null; returnAt: string | null } | null
    return [{
      orderId: o.number, customer: o.contact_name, district: ((o.address as { district?: string } | null)?.district) ?? '', courierId: d.courier_id,
      courierName: c?.name ?? 'Parceiros', kind: (c?.kind ?? 'partner') as DeliveryRecord['kind'], status: d.status as DeliveryRecord['status'],
      feeCents: d.fee_cents == null ? null : n(d.fee_cents), at: d.at, expectedAt: d.expected_at, returnAt: d.return_at, items: d.items,
      problem: d.problem_reason && prev ? { reason: d.problem_reason, note: d.problem_note ?? '', prev } : null,
    }]
  })

  const state: MockState = {
    orders: orderList, deviceOrderIds: [], suppliers: supplierList, purchaseOrders, stockItems, lots: lotList, movements: moves, entries: entryList, transactions: txList,
    receipts: receiptList, reservations: reservationList, recipes: recipeList, productionOrders, sales, categories: cats, customers: [], couriers: courierList, deliveries, salesHistory: [],
    cashSessions: [], posSales: [], house: { ...emptyHouse }, team: [], outbox: [],
  }
  return { state, poId, poItemId, opId, orderId, receiptsByPo }
}
