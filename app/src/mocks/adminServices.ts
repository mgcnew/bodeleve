import { transition } from '@/domain/orderFlow'
import { stageOf } from '@/domain/orders'
import type { Order } from '@/domain/types'
import type { TeamMember } from '@/domain/settings'
import { adjust, applyCount, buildRows, expiringLots, lowRows, reverse, stockValueCents, undoCount, reservedByItem, type StockState } from '@/domain/stock'
import { products } from './seed'
import { validateCourier, validateRecipe, validateSupplier } from '@/domain/registry'
import { applyProduct, channelLabel, checkNewCategory, defaultSale, kindOf, slugify, splitNewLabel, validateProduct, type ProductInput } from '@/domain/catalog'
import { customerDetail, customerId, listCustomers } from '@/domain/customers'
import { productCost } from './catalogView'
import { accept as courierAccept, cashDue, confirm as courierConfirm, deliveryItems, depart as courierDepart, historyOf, reportProblem, take as courierTake, undoProblem as courierUndoProblem, visibleTo } from '@/domain/courierApp'
import { delivery as deliveryCfg } from '@/config/delivery'
import { DeliveryError, isOpenRecord, kmValue, type Courier, type DeliveryRecord, type DeliveryStatus } from '@/domain/deliveries'
import { assertPaid, cashDifference, cashNetOf, changeOf, discountCents, expectedCash, nextSaleId, pickLots, PosError, priceLine, sessionTotals, subtotalOf, validateMovement, type CashSession, type PosSale, type PriceInfo, type SaleLine } from '@/domain/pos'
import { addTransaction } from '@/domain/finance'
import { formatKgShort, unitKg, unitsToKg } from '@/domain/units'
import { MOCK_MANAGER_PINS } from './adminSeed'
import { PIN_RULE, checkInvite, cleanHouse, rolesInUse, validateHouse } from '@/domain/settings'
import { storefront } from '@/config/storefront'
import { buildHub, monthLosses, monthOutflowCents, monthProduction, periodStart, salesByDay, salesReport } from '@/domain/reports'
import { todayCounterSeed } from './reportsSeed'
import { assign as assignDelivery, assignmentOf, assignOptions, courierRows, dispatchRows, kmLabel, openRecordOf, unassign } from '@/domain/deliveries'
import { paymentLabel } from '@/config/storefront'
import { formatBRL } from '@/lib/format'
import { batchCostCents, checkInputs, finishOrder, formatContent, marginPercent, needs, nextOrderId, ProductionError, suggestLotCode, undoFinish, unitCostCents, type ProductionOrder } from '@/domain/production'
import type { AccountView, AdminOrder, CashView, CourierCardView, CourierDetail, CategoryRow, PosSaleRow, PosSessionView, ProductDetail, AdminServices, Dashboard, EntryView, FinanceOverview, FinishDefaults, MovementView, ProductionOrderView, PurchaseSuggestion, PurchaseView, RecipeView, StockItemView, SupplierView } from '@/services/types'
import { daysUntil, itemBalance, itemLabel, lotsFefo, nextLot, type StockItem } from '@/domain/inventory'
import { orderTotal, paymentTerms, purchaseMessage, receivedTotal, suggestQty, isOpen, type PurchaseOrder } from '@/domain/purchasing'
import { closeShortOrder, receive, reverseLastReceipt } from '@/domain/receiving'
import { FinanceError, accountName, balanceOf, daysFromToday, forecast, isOpen as entryOpen, ledger, ledgerTotals, payEntry, remaining, standingOf, totals as financeTotals, undoPayment, type FinancialEntry } from '@/domain/finance'
import { adminUsers, dashboardSeed, MOCK_ADMIN_PASSWORD, MOCK_COURIER_CODE } from './adminSeed'
import type { MockDb, MockState } from './db'
import { customersSeed, hhmm } from './seedOrders'

const norm = (s: string) => s.trim().toLowerCase()

const stateOf = (st: MockState): StockState => {
  const production = new Map<string, number>()
  for (const o of st.productionOrders) if (o.status === 'in_progress') production.set(o.itemId, (production.get(o.itemId) ?? 0) + o.plannedQty)
  return { stockItems: st.stockItems, lots: st.lots, movements: st.movements, orders: st.orders, reservations: st.reservations, purchaseOrders: st.purchaseOrders, production }
}

const brDay = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

const entryView = (e: FinancialEntry, t: Date): EntryView => {
  const { standing, daysLate } = standingOf(e, t)
  const date = brDay(e.dueAt)
  const open = entryOpen(e)
  const createdToday = !!e.createdAt && daysFromToday(e.createdAt, t) === 0
  let detail = e.kindLabel ?? e.description
  if (e.direction === 'payable') {
    if (standing === 'overdue') detail += ` · venceu ${date}`
    else if (e.note) detail += ` · ${e.note}`
    if (standing === 'upcoming') detail += ` · ${date}`
  } else {
    detail += e.tag === 'Fiado' ? ` ${date}` : ` · ${date}`
  }
  const tag: EntryView['tag'] = !open ? null : e.direction === 'receivable' ? (e.tag ? { label: e.tag, tone: 'neutral' } : null)
    : standing === 'overdue' ? { label: 'Atrasado', tone: 'error' }
    : standing === 'today' ? { label: 'Vence hoje', tone: 'warning' }
    : createdToday ? { label: 'Criada hoje', tone: 'info' } : null
  return {
    id: e.id, direction: e.direction, title: e.title ?? e.description, detail, amountCents: e.amountCents, remainingCents: remaining(e),
    dueAt: e.dueAt, standing, daysLate, tag, ref: e.ref, recurring: !!e.recurring, paid: !open,
  }
}

/** Contas que pedem ação hoje: cada atrasada e as que vencem hoje (juntas). Usado no Financeiro e no Início. */
const financeAttention = (st: MockState, t: Date): FinanceOverview['attention'] => {
  const open = st.entries.filter((e) => e.direction === 'payable' && entryOpen(e))
  const overdue = open.filter((e) => standingOf(e, t).standing === 'overdue')
  const today = open.filter((e) => standingOf(e, t).standing === 'today')
  const out: FinanceOverview['attention'] = []
  for (const e of overdue) {
    const v = entryView(e, t)
    out.push({ id: e.id, title: v.title, detail: `Venceu em ${brDay(e.dueAt)} · ${v.daysLate} ${v.daysLate === 1 ? 'dia' : 'dias'} de atraso`, amountCents: remaining(e), tag: 'Atrasado', href: `/gestao/financeiro/pagar/${e.id}` })
  }
  if (today.length > 0) {
    const names = today.map((e, i) => (i === 0 ? e.title ?? e.description : (e.forecastLabel ?? e.title ?? e.description).toLowerCase()))
    out.push({
      id: 'today', title: today.length === 1 ? (today[0].title ?? today[0].description) : `${today.length} contas vencem hoje`,
      detail: today.length === 1 ? entryView(today[0], t).detail : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`,
      amountCents: today.reduce((a, e) => a + remaining(e), 0), tag: 'Vence hoje', href: today.length === 1 ? `/gestao/financeiro/pagar/${today[0].id}` : '/gestao/financeiro/contas',
    })
  }
  return out
}

const accountsOf = (st: MockState): AccountView[] =>
  (['bank', 'cash'] as const).map((id) => ({ id, name: accountName[id], balanceCents: balanceOf(st.transactions, id), opened: st.transactions.some((t) => t.accountId === id && t.kind === 'opening') }))

const costOfItem = (st: MockState) => (itemId: string) => {
  const it = st.stockItems.find((i) => i.id === itemId)
  const lot = lotsFefo(st.lots, st.movements, itemId)[0]
  return lot?.unitCostCents ?? it?.lastCostCents ?? 0
}

const sameDay = (iso: string, t: Date) => {
  const d = new Date(iso)
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

const productName = (st: MockState, id: string) => { const it = st.stockItems.find((i) => i.id === id); return it ? itemLabel(it) : id }

const nextMovementId = (st: MockState) => `mv-${st.stockItems.length * 0 + st.movements.reduce((a, m) => Math.max(a, Number(m.id.split('-').pop()) || 0), 0) + 1}`

const sessionView = (s: CashSession): PosSessionView => ({ id: s.id, openedBy: s.openedBy, openedAt: s.openedAt, status: s.status, openingCents: s.openingCents, closedAt: s.closedAt })

const currentSession = (st: MockState): CashSession | null => st.cashSessions.find((s) => s.status === 'open') ?? null
const lastClosed = (st: MockState): CashSession | null => [...st.cashSessions].filter((s) => s.status === 'closed').sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))[0] ?? null

const cashView = (st: MockState, s: CashSession): CashView => {
  const totals = sessionTotals(s, st.posSales)
  const mine = st.posSales.filter((x) => x.sessionId === s.id && x.status === 'completed')
  const salesCash = mine.reduce((a, x) => a + cashNetOf(x.payments), 0) + s.baseline.cashCents
  const expected = expectedCash(s, st.posSales)
  return {
    session: sessionView(s), count: totals.count, cashCents: totals.cashCents, pixCents: totals.pixCents, cardCents: totals.cardCents, totalCents: totals.totalCents,
    salesCashCents: salesCash,
    movements: s.movements.map((m) => ({ id: m.id, label: `${m.kind === 'sangria' ? 'Sangria' : 'Suprimento'} · ${m.reason}`, signedCents: m.kind === 'sangria' ? -m.cents : m.cents })),
    expectedCents: s.status === 'closed' && s.expectedCents != null ? s.expectedCents : expected,
    countedCents: s.countedCents,
    differenceCents: s.countedCents != null ? s.countedCents - (s.expectedCents ?? expected) : null,
  }
}

const saleRow = (s: PosSale): PosSaleRow => {
  const filters = [...new Set(s.payments.map((p) => (p.method === 'cash' ? 'cash' : p.method === 'pix' ? 'pix' : 'card')))] as PosSaleRow['filters']
  const label = (f: string) => (f === 'cash' ? 'Dinheiro' : f === 'pix' ? 'Pix' : 'Cartão')
  return { id: s.id, at: s.at, items: s.lines.reduce((a, l) => a + (l.kind === 'unit' ? l.qty : 1), 0), methods: filters.map(label).join(' e '), totalCents: s.totalCents, cancelled: s.status === 'cancelled', pending: !!s.pending, filters }
}

/** Vendas de balcão de hoje que o sistema registrou (as de exemplo já estão na base do caixa). Alimenta Início e Relatórios. */
export const todayCounter = (st: MockState, t: Date) => {
  const same = (iso: string) => { const d = new Date(iso); return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate() }
  const seed = st.counterBase ?? todayCounterSeed
  const base = { ...seed, products: { ...seed.products } }
  for (const s of st.posSales) {
    if (s.seed || s.status !== 'completed' || !same(s.at)) continue
    base.count += 1
    base.cents += s.totalCents
    for (const p of s.payments) {
      if (p.method === 'cash') base.cashCents += p.cents
      else if (p.method === 'pix') base.pixCents += p.cents
      else base.cardCents += p.cents
    }
    for (const l of s.lines) base.products[l.itemId] = (base.products[l.itemId] ?? 0) + (l.kind === 'unit' ? l.qty : 1)
  }
  return base
}

const digitsOf = (s: string) => s.replace(/\D/g, '')
const courierByPhone = (st: MockState, phone: string) => st.couriers.find((c) => digitsOf(c.phone) === digitsOf(phone))

const stateOf2 = (r: { status: DeliveryStatus } | undefined): CourierDetail['state'] => (r ? r.status : 'free')

const payLineOf = (o: Order): string => {
  if (o.payment.paid) return `Pago no ${paymentLabel[o.payment.method]}. Nada a cobrar.`
  return `Cobrar ${formatBRL(o.totalCents)} ${o.payment.method === 'cash' ? 'em dinheiro' : 'no cartão, na maquininha'}${o.payment.method === 'cash' && o.payment.changeForCents ? ` (troco para ${formatBRL(o.payment.changeForCents)})` : ''}.`
}

/** O que a pessoa vê de uma entrega. Nunca inclui o código de entrega: quem entrega só informa o que ouviu. */
const courierDetail = (st: MockState, courier: Courier, orderId: string): CourierDetail | null => {
  const o = st.orders.find((x) => x.id === orderId)
  if (!o || o.fulfillment !== 'delivery') return null
  const records = st.deliveries.filter((r) => r.orderId === orderId)
  const rec = records.find((r) => isOpenRecord(r)) ?? [...records].sort((a, b) => b.at.localeCompare(a.at))[0]
  const seen = visibleTo(courier, st.orders, st.deliveries)
  const mine = rec && rec.courierId === courier.id
  const canSee = mine || seen.available.some((s) => s.order.id === orderId)
  if (!canSee) return null
  const status = rec ? rec.status : 'free'
  const stage = status === 'free' || status === 'published' || status === 'assigned' || status === 'reserved' ? 1 : status === 'accepted' ? 2 : status === 'en_route' ? 3 : 0
  const district = o.address?.district ?? ''
  const km = kmValue(district)
  const addr = o.address
  const street = addr ? `${addr.street}, ${addr.number}${addr.complement ? ` · ${addr.complement}` : ''}` : ''
  return {
    orderId, customer: o.contact.name, phone: o.contact.phone, state: stateOf2(rec && { status: rec.status }), stage: stage as CourierDetail['stage'],
    storeAddress: st.house.address || '[ENDEREÇO DA LOJA]', street, district, reference: addr?.reference ?? '', km: kmLabel(district),
    minutes: km == null ? null : Math.round(km * deliveryCfg.minutesPerKm), items: deliveryItems(o), payLine: payLineOf(o), cashDueCents: cashDue(o),
    partnerFeeCents: courier.kind === 'partner' ? (rec?.feeCents ?? deliveryCfg.partnerFeeCents) : null,
    at: rec && (rec.status === 'en_route' || rec.status === 'delivered' || rec.status === 'returned') ? rec.at : null,
    problemReason: rec?.problem?.reason ?? null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([street, district].filter(Boolean).join(' '))}`,
  }
}

const courierCard = (c: Courier, o: Order, rec: DeliveryRecord | null): CourierCardView => {
  const district = o.address?.district ?? ''
  const addr = o.address
  const base = { orderId: o.id, district, street: addr ? `${addr.street}, ${addr.number}` : '', km: kmLabel(district), items: deliveryItems(o) }
  const partner = c.kind === 'partner'
  const value = partner ? { valueLabel: 'Você recebe', value: formatBRL(rec?.feeCents ?? deliveryCfg.partnerFeeCents) } : { valueLabel: 'Cobrar', value: cashDue(o) > 0 ? formatBRL(cashDue(o)) : 'Nada' }
  if (!rec || rec.courierId !== c.id) {
    return {
      ...base, ...value, state: rec ? 'published' : 'free', tag: o.stepTimes.ready_for_delivery ? `Pronto às ${o.stepTimes.ready_for_delivery}` : 'Pronto',
      detail: partner ? `Publicada para parceiros · você recebe ${formatBRL(rec?.feeCents ?? deliveryCfg.partnerFeeCents)}` : 'Ainda sem entregador. Você pode pegar.',
    }
  }
  const tag = rec.status === 'en_route' ? 'Em rota' : rec.status === 'accepted' ? 'Aceita' : rec.status === 'reserved' ? 'Reservada' : 'Para você'
  return { ...base, ...value, state: rec.status, tag, detail: '' }
}

const stageLabel = (o: Order) => (o.status === 'received' ? 'Novo' : o.status === 'preparing' ? 'Em preparo' : 'Pronto')

const productDetail = (st: MockState, id: string): ProductDetail | null => {
  const i = st.stockItems.find((x) => x.id === id)
  if (!i) return null
  const sale = st.sales.find((s) => s.itemId === id) ?? defaultSale(id)
  const cost = productCost(st, i)
  return {
    id, label: itemLabel(i), unit: i.unit, name: itemLabel(i), categoryId: i.categoryId, itemType: i.itemType, origin: i.origin,
    priceCents: sale.priceCents, weightPriceCents: sale.weightPriceCents, minStock: `${i.minStock} un`, published: sale.published, favoritePos: sale.favoritePos,
    soldByWeight: sale.soldByWeight, tracksExpiry: i.tracksExpiry, description: sale.description,
    costCents: cost.cents, costSource: cost.source, categories: st.categories.map((c) => ({ id: c.id, name: c.name })),
  }
}

const categoryRows = (st: MockState): CategoryRow[] =>
  st.categories.filter((c) => !c.internal).map((c) => {
    const n = st.stockItems.filter((i) => i.categoryId === c.id && i.itemType !== 'raw_material').length
    return { id: c.id, name: c.name, products: n, tag: n === 0 ? 'Nova' : 'Na loja' }
  })

export function createAdminServices({ db, now }: { db: MockDb; now: () => Date }): AdminServices {
  /** Senha definida em Configurações nesta sessão (a de exemplo continua valendo). */
  let customPin: string | null = null
  const orderView = (o: ProductionOrder, st: MockState): ProductionOrderView => ({
    ...o,
    itemName: itemLabel(st.stockItems.find((i) => i.id === o.itemId)!),
    batchLabel: st.recipes.find((r) => r.id === o.recipeId)?.batchLabel ?? 'fornada',
  })
  const recipeView = (id: string, st: MockState): RecipeView | null => {
    const r = st.recipes.find((x) => x.id === id)
    if (!r) return null
    const item = st.stockItems.find((i) => i.id === r.itemId)!
    const costOf = costOfItem(st)
    const unit = unitCostCents(r, costOf)
    const price = st.sales.find((x) => x.itemId === r.itemId)?.priceCents ?? products.find((p) => p.id === r.itemId)?.priceCents ?? null
    return {
      id: r.id, itemId: r.itemId, name: itemLabel(item), itemType: item.itemType, origin: item.origin,
      yieldPerBatch: r.yieldPerBatch, batchLabel: r.batchLabel, shelfLifeDays: r.shelfLifeDays,
      unitCostCents: unit, batchCostCents: batchCostCents(r, costOf), priceCents: price, marginPercent: price ? marginPercent(price, unit) : null,
      overheadCents: r.overheadCents, method: r.method, lotPrefix: r.lotPrefix,
      lines: r.lines.map((l) => {
        const it = st.stockItems.find((i) => i.id === l.itemId)!
        return { itemId: l.itemId, name: it.name, qtyText: formatContent(l.qtyPerBatch, it), qtyPerBatch: l.qtyPerBatch, costCents: Math.round(l.qtyPerBatch * costOf(l.itemId)) }
      }),
    }
  }

  const poView = (o: PurchaseOrder, st: MockState): PurchaseView => ({
    ...o,
    items: o.items.map((i) => ({ ...i, tracksExpiry: st.stockItems.find((x) => x.id === i.itemId)?.tracksExpiry ?? false })),
    supplierName: st.suppliers.find((s) => s.id === o.supplierId)?.name ?? o.supplierId,
    totalCents: orderTotal(o),
    receivedCents: receivedTotal(o),
    itemCount: o.items.length,
  })
  const supplierView = (id: string, st: MockState): SupplierView | null => {
    const sp = st.suppliers.find((s) => s.id === id)
    if (!sp) return null
    const t = now()
    const orders = st.purchaseOrders.filter((o) => o.supplierId === id)
    const open = orders.filter(isOpen)
    const received = orders.filter((o) => o.receivedAt).sort((a, b) => b.receivedAt!.localeCompare(a.receivedAt!))
    return {
      ...sp,
      openOrders: open.length,
      arrivingToday: open.filter((o) => sameDay(o.expectedAt, t)).length,
      lastPurchaseAt: received[0]?.receivedAt ?? null,
      purchasedThisYearCents: sp.previousPurchasesCents + received.filter((o) => new Date(o.receivedAt!).getFullYear() === t.getFullYear()).reduce((a, o) => a + receivedTotal(o), 0),
      openPayablesCents: st.entries.filter((p) => p.supplierId === id && p.direction === 'payable').reduce((a, p) => a + remaining(p), 0),
      products: st.stockItems.filter((i) => i.supplierId === id).map((i) => ({ itemId: i.id, name: itemLabel(i), lastCostCents: i.lastCostCents })),
      recentOrders: received.slice(0, 2).map((o) => ({ id: o.id, receivedAt: o.receivedAt!, totalCents: receivedTotal(o) })),
    }
  }

  const toAdmin = (o: Order, all: Order[]): AdminOrder => {
    const { lots, movements } = db.read()
    const known = customersSeed[o.contact.phone]
    const placed = all.filter((x) => x.contact.phone === o.contact.phone).length
    return {
      ...o,
      // O lote sugerido é o que vence primeiro (H-G11).
      items: o.items.map((i) => {
        const lot = nextLot(lots, movements, i.productId)
        return { ...i, lot: lot ? { code: lot.code, expiresAt: lot.expiresAt } : null }
      }),
      customerSince: known?.since ?? null,
      customerOrderCount: (known?.previousOrders ?? 0) + placed,
    }
  }

  const change = (id: string, f: (o: Order) => Order): AdminOrder => {
    let result: AdminOrder | null = null
    db.update((st) => {
      const i = st.orders.findIndex((o) => o.id === id)
      if (i < 0) throw new Error('not_found')
      st.orders[i] = f(st.orders[i])
      result = toAdmin(st.orders[i], st.orders)
    })
    return result as unknown as AdminOrder
  }

  /** Muda a entrega e o pedido de uma vez e devolve o que a pessoa vê depois. Erro de regra sobe para a tela. */
  const courierMutate = (id: string, orderId: string, f: (c: Courier, o: Order, st: MockState) => void): CourierDetail => {
    let out = null as CourierDetail | null
    db.update((st) => {
      const c = st.couriers.find((x) => x.id === id)
      const o = st.orders.find((x) => x.id === orderId)
      if (!c || !o) throw new DeliveryError('not_found')
      f(c, o, st)
      out = courierDetail(st, c, orderId)
    })
    if (!out) throw new DeliveryError('not_found')
    return out
  }

  return {
    auth: {
      async signIn(email, password) {
        const u = adminUsers.find((x) => x.email === norm(email))
        if (!u || password !== MOCK_ADMIN_PASSWORD) throw new Error('invalid_credentials')
        return { id: u.id, name: u.name, email: u.email, role: u.role }
      },
    },

    orders: {
      async listOpen() {
        const { orders } = db.read()
        return orders
          .filter((o) => stageOf(o) !== null)
          .map((o) => toAdmin(o, orders))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      },
      async get(id) {
        const { orders } = db.read()
        const o = orders.find((x) => x.id === id)
        return o ? toAdmin(o, orders) : null
      },
      async accept(id) {
        return change(id, (o) => transition(o, 'accept', hhmm(now())))
      },
      async markReady(id, checked) {
        return change(id, (o) => transition(o, 'mark_ready', hhmm(now()), { checkedProductIds: checked }))
      },
      async undoReady(id) {
        return change(id, (o) => transition(o, 'undo_ready', hhmm(now())))
      },
    },

    purchasing: {
      async listOrders() {
        const st = db.read()
        return st.purchaseOrders.map((o) => poView(o, st)).sort((a, b) => b.id.localeCompare(a.id))
      },
      async getOrder(id) {
        const st = db.read()
        const o = st.purchaseOrders.find((x) => x.id === id)
        return o ? poView(o, st) : null
      },
      async listSuppliers() {
        const st = db.read()
        return st.suppliers.map((s) => supplierView(s.id, st)!)
      },
      async getSupplier(id) {
        return supplierView(id, db.read())
      },
      async saveSupplier(id, input) {
        if (Object.keys(validateSupplier(input)).length) throw new Error('invalid')
        let savedId = id ?? ''
        db.update((st) => {
          const fields = {
            name: input.name.trim(), supplies: input.supplies.trim(), contactName: input.contactName.trim() || '[NOME DO CONTATO]', phone: input.phone.trim(),
            email: input.email.trim() || '[E-MAIL]', doc: input.doc.trim() || '[CNPJ OU CPF]', defaultPayment: input.defaultPayment,
            leadTime: input.leadTimeDays == null ? '' : `${input.leadTimeDays} ${input.leadTimeDays === 1 ? 'dia' : 'dias'}`,
          }
          if (id) {
            const cur = st.suppliers.find((x) => x.id === id)
            if (!cur) throw new Error('not_found')
            Object.assign(cur, fields)
          } else {
            const base = slugify(fields.name) || 'fornecedor'
            savedId = base
            for (let n = 2; st.suppliers.some((x) => x.id === savedId); n++) savedId = `${base}-${n}`
            st.suppliers.push({ id: savedId, since: String(now().getFullYear()), previousPurchasesCents: 0, ...fields })
          }
        })
        return supplierView(savedId, db.read())!
      },
      async suggest(supplierId) {
        const st = db.read()
        return st.stockItems
          .filter((i) => i.supplierId === supplierId)
          .map<PurchaseSuggestion>((i) => {
            // A sugestão olha o que pode ser vendido agora (disponível), como o nível de estoque.
            const r = buildRows(stateOf(st), now()).find((x) => x.itemId === i.id)!
            return { itemId: i.id, name: itemLabel(i), balance: r.available, min: i.minStock, level: r.level, lastCostCents: i.lastCostCents ?? 0, suggestedQty: suggestQty(r.available, i.minStock) }
          })
          // O que mais precisa vem primeiro.
          .sort((a, b) => b.suggestedQty - a.suggestedQty || a.name.localeCompare(b.name))
      },
      async send(input) {
        let created: PurchaseOrder | null = null
        let message = ''
        const st = db.update((s) => {
          const supplier = s.suppliers.find((x) => x.id === input.supplierId)
          const lines = input.items.filter((i) => i.qty > 0)
          if (!supplier) throw new Error('not_found')
          if (lines.length === 0) throw new Error('empty_order')
          const n = s.purchaseOrders.reduce((a, o) => Math.max(a, Number(o.id.slice(3)) || 0), 0) + 1
          const t = now().toISOString()
          const order: PurchaseOrder = {
            id: `PC-${String(n).padStart(4, '0')}`,
            supplierId: supplier.id,
            status: 'sent',
            createdAt: t,
            sentAt: t,
            expectedAt: input.expectedAt,
            receivedAt: null,
            payment: input.payment,
            closedShort: false,
            sentVia: 'registered_only',
            items: lines.map((l) => {
              const it = s.stockItems.find((x) => x.id === l.itemId)
              if (!it) throw new Error('not_found')
              return { itemId: it.id, name: itemLabel(it), qty: l.qty, unitCostCents: it.lastCostCents ?? 0, receivedQty: 0 }
            }),
          }
          message = purchaseMessage(supplier, order, paymentTerms[order.payment].label)
          s.purchaseOrders.push(order)
          // D21: a mensagem é montada e guardada, não enviada.
          s.outbox.push({ id: `msg-${s.outbox.length + 1}`, to: supplier.phone, text: message, at: t, kind: 'purchase_order' })
          created = order
        })
        return { order: poView(created as unknown as PurchaseOrder, st), message }
      },
      async receive(id, input) {
        let result!: ReturnType<typeof receive>
        const st = db.update((s) => {
          const po = s.purchaseOrders.find((o) => o.id === id)
          const supplierName = s.suppliers.find((x) => x.id === po?.supplierId)?.name ?? ''
          result = receive(s, id, input.lines, { closeShort: input.closeShort, now: now(), supplierName, items: s.stockItems })
        })
        return { ...result, order: poView(result.order, st) }
      },
      async closeShort(id) {
        let order!: PurchaseOrder
        const st = db.update((s) => {
          order = closeShortOrder(s, id, now())
        })
        return poView(order, st)
      },
      async reverseReceipt(id) {
        let order!: PurchaseOrder
        const st = db.update((s) => {
          order = reverseLastReceipt(s, id)
        })
        return poView(order, st)
      },
    },

    stock: {
      async overview() {
        const st = db.read()
        const s0 = stateOf(st)
        const rows = buildRows(s0, now())
        return {
          lowCount: lowRows(rows).length,
          expiringCount: expiringLots(st.lots, st.movements, st.stockItems, now()).length,
          valueCents: stockValueCents(st),
          rows: rows.sort((a, b) => a.name.localeCompare(b.name)),
        }
      },
      async getItem(id): Promise<StockItemView | null> {
        const st = db.read()
        const it = st.stockItems.find((x) => x.id === id)
        if (!it) return null
        const row = buildRows(stateOf(st), now()).find((r) => r.itemId === id)!
        const res = reservedByItem(st.orders, st.reservations).get(id)
        const fefo = lotsFefo(st.lots, st.movements, id)
        const product = products.find((p) => p.id === id)
        const sale = st.sales.find((x) => x.itemId === id)
        return {
          ...row,
          unit: it.unit,
          unitCostCents: fefo[0]?.unitCostCents ?? it.lastCostCents,
          priceCents: sale ? sale.priceCents : product?.priceCents ?? null,
          published: sale ? (it.itemType === 'raw_material' ? null : sale.published) : product ? product.available : null,
          reservedOrders: res?.orders ?? 0,
          reservedManual: res?.manual ?? 0,
          lots: fefo.map((l, n) => ({ id: l.id, code: l.code, expiresAt: l.expiresAt, balance: l.balance, daysLeft: l.expiresAt ? daysUntil(l.expiresAt, now()) : null, isNext: n === 0 })),
          producing: st.productionOrders.filter((o) => o.itemId === id && o.status === 'in_progress').map((o) => ({ id: o.id, qty: o.plannedQty, endsAt: o.endsAt })),
        }
      },
      async movements(itemId) {
        const st = db.read()
        const it = st.stockItems.find((x) => x.id === itemId)
        if (!it) return null
        const list = st.movements.filter((m) => m.itemId === itemId).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
        let saldo = 0
        const rows: MovementView[] = list.map((m) => {
          saldo += m.qty
          return {
            id: m.id,
            description: m.description ?? (m.type === 'purchase_in' ? `Compra · ${m.ref}` : m.ref),
            at: m.at,
            lotCode: st.lots.find((l) => l.id === m.lotId)?.code ?? null,
            by: m.by ?? null,
            qty: m.qty,
            balanceAfter: saldo,
            reversed: st.movements.some((x) => x.reversalOf === m.id),
            reversalOf: m.reversalOf ?? null,
          }
        })
        return { name: itemLabel(it), physical: saldo, rows: rows.reverse() }
      },
      async adjust(input) {
        let out!: { movementId: string; costCents: number; physicalBefore: number; physicalAfter: number; lotCode: string; itemName: string }
        db.update((s) => {
          const before = itemBalance(s.movements, input.itemId)
          const m = adjust(s, { ...input, now: now() })
          const lot = s.lots.find((l) => l.id === input.lotId)!
          const it = s.stockItems.find((x) => x.id === input.itemId)!
          out = { movementId: m.id, costCents: input.qty * lot.unitCostCents, physicalBefore: before, physicalAfter: itemBalance(s.movements, input.itemId), lotCode: lot.code, itemName: itemLabel(it) }
        })
        return out
      },
      async undoMovement(movementId, by) {
        db.update((s) => {
          reverse(s, movementId, by, now())
        })
      },
      async countAreas() {
        const { stockItems } = db.read()
        const names: Record<string, string> = { laticinios: 'Queijos e laticínios', carnes: 'Carnes e embutidos', farinhas: 'Farinhas e grãos', doces: 'Doces' }
        const areas = Object.entries(names).map(([id, name]) => ({ id, name, count: stockItems.filter((i) => i.categoryId === id).length })).filter((a) => a.count > 0)
        return [...areas, { id: 'all', name: 'Tudo', count: stockItems.length }]
      },
      async countItems(areaId) {
        const st = db.read()
        return st.stockItems
          .filter((i) => areaId === 'all' || i.categoryId === areaId)
          .map((i) => {
            const lot = lotsFefo(st.lots, st.movements, i.id)[0]
            return { itemId: i.id, name: itemLabel(i), system: itemBalance(st.movements, i.id), unitCostCents: lot?.unitCostCents ?? i.lastCostCents ?? 0 }
          })
          .sort((a, b) => a.name.localeCompare(b.name))
      },
      async applyCount(lines, by) {
        let result = { batchId: null as string | null, adjustments: 0, deltaUnits: 0, deltaCostCents: 0 }
        db.update((s) => {
          const r = applyCount(s, lines, by, now())
          result = { batchId: r.movements.length ? r.batchId : null, adjustments: new Set(r.movements.map((m) => m.itemId)).size, deltaUnits: r.deltaUnits, deltaCostCents: r.deltaCostCents }
        })
        return result
      },
      async undoCount(batchId, by) {
        db.update((s) => {
          undoCount(s, batchId, by, now())
        })
      },
    },

    production: {
      async listOrders() {
        const st = db.read()
        return st.productionOrders.map((o) => orderView(o, st)).sort((a, b) => a.id.localeCompare(b.id))
      },
      async getOrder(id) {
        const st = db.read()
        const o = st.productionOrders.find((x) => x.id === id)
        return o ? orderView(o, st) : null
      },
      async listRecipes() {
        const st = db.read()
        return st.recipes.map((r) => recipeView(r.id, st)!)
      },
      async getRecipe(id) {
        return recipeView(id, db.read())
      },
      async recipeOptions() {
        const st = db.read()
        const label = (i: StockItem) => itemLabel(i)
        return { products: st.stockItems.filter((i) => i.itemType === 'finished').map((i) => ({ id: i.id, label: label(i) })), inputs: st.stockItems.map((i) => ({ id: i.id, label: label(i) })) }
      },
      async saveRecipe(id, input) {
        if (Object.keys(validateRecipe(input)).length) throw new Error('invalid')
        let savedId = id ?? ''
        db.update((st) => {
          const item = st.stockItems.find((i) => i.id === input.itemId)
          if (!item || item.itemType !== 'finished') throw new Error('invalid')
          const recipe = {
            itemId: input.itemId, yieldPerBatch: input.yieldPerBatch, batchLabel: input.batchLabel.trim() || 'fornada', shelfLifeDays: input.shelfLifeDays,
            lines: input.lines.filter((l) => l.itemId).map((l) => ({ itemId: l.itemId, qtyPerBatch: l.qtyPerBatch })), overheadCents: input.overheadCents, method: input.method, lotPrefix: input.lotPrefix.trim().toUpperCase(),
          }
          if (id) {
            const cur = st.recipes.find((r) => r.id === id)
            if (!cur) throw new Error('not_found')
            if (cur.itemId !== input.itemId) throw new Error('invalid')
            Object.assign(cur, recipe)
          } else {
            if (st.recipes.some((r) => r.itemId === input.itemId)) throw new Error('duplicate')
            savedId = `ft-${slugify(item.name)}`
            for (let n = 2; st.recipes.some((r) => r.id === savedId); n++) savedId = `ft-${slugify(item.name)}-${n}`
            st.recipes.push({ id: savedId, ...recipe })
          }
        })
        return recipeView(savedId, db.read())!
      },
      async check(recipeId, batches) {
        const st = db.read()
        const r = st.recipes.find((x) => x.id === recipeId)
        if (!r) throw new ProductionError('not_found')
        const rows = buildRows(stateOf(st), now())
        const row = (id: string) => rows.find((x) => x.itemId === id)
        const c = checkInputs(r, batches, (id) => row(id)?.available ?? 0, (id) => row(id)?.incomingToday ?? 0)
        return {
          missingAny: c.missingAny,
          coveredByIncoming: c.coveredByIncoming,
          lines: c.lines.map((l) => {
            const it = st.stockItems.find((i) => i.id === l.itemId)!
            return { itemId: l.itemId, name: it.name, needText: formatContent(l.need, it), haveText: formatContent(l.have, it), missingText: formatContent(l.missing, it), missing: l.missing, incomingToday: l.incomingToday }
          }),
        }
      },
      async createOrder(input) {
        let created!: ProductionOrder
        let reservedText = ''
        const st = db.update((s) => {
          const r = s.recipes.find((x) => x.id === input.recipeId)
          if (!r || !(input.batches >= 1)) throw new ProductionError('invalid_input')
          if (input.destination.kind === 'order') {
            const oid = input.destination.orderId
            if (!s.orders.some((o) => o.id === oid)) throw new ProductionError('invalid_input', 'order')
          }
          const rows = buildRows(stateOf(s), now())
          const id = nextOrderId(s.productionOrders.map((o) => o.id))
          const reservationIds: string[] = []
          const parts: string[] = []
          for (const n of needs(r, input.batches)) {
            const it = s.stockItems.find((i) => i.id === n.itemId)!
            const have = rows.find((x) => x.itemId === n.itemId)?.available ?? 0
            const qty = Math.min(n.qty, Math.max(0, have))
            if (qty > 0) {
              const rid = `rsv-${s.reservations.reduce((a, x) => Math.max(a, Number(x.id.slice(4)) || 0), 0) + 1 + reservationIds.length}`
              s.reservations.push({ id: rid, itemId: n.itemId, qty, ref: id })
              reservationIds.push(rid)
              parts.push(`${formatContent(qty, it)} de ${it.name.toLowerCase()}`)
            }
          }
          reservedText = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}` : parts[0] ?? ''
          const t = now().toISOString()
          created = {
            id, recipeId: r.id, itemId: r.itemId, batches: input.batches, plannedQty: r.yieldPerBatch * input.batches,
            status: input.startNow ? 'in_progress' : 'planned', destination: input.destination, startsAt: input.startsAt, endsAt: null,
            startedAt: input.startNow ? t : null, doneAt: null, goodQty: null, lotCode: null, expiresAt: null, costPerUnitCents: null,
            lotId: null, movementIds: [], reservationIds,
          }
          s.productionOrders.push(created)
        })
        return { order: orderView(created, st), reservedText }
      },
      async undoCreate(id) {
        db.update((s) => {
          const o = s.productionOrders.find((x) => x.id === id)
          if (!o) throw new ProductionError('not_found')
          if (o.status === 'done') throw new ProductionError('invalid_state')
          s.reservations = s.reservations.filter((r) => !o.reservationIds.includes(r.id))
          s.productionOrders = s.productionOrders.filter((x) => x.id !== id)
        })
      },
      async start(id) {
        let order!: ProductionOrder
        const st = db.update((s) => {
          const o = s.productionOrders.find((x) => x.id === id)
          if (!o) throw new ProductionError('not_found')
          if (o.status !== 'planned') throw new ProductionError('invalid_state')
          o.status = 'in_progress'
          o.startedAt = now().toISOString()
          order = o
        })
        return orderView(order, st)
      },
      async finishDefaults(id): Promise<FinishDefaults | null> {
        const st = db.read()
        const o = st.productionOrders.find((x) => x.id === id)
        const r = o && st.recipes.find((x) => x.id === o.recipeId)
        if (!o || !r) return null
        const costOf = costOfItem(st)
        const finishedLots = st.lots.filter((l) => l.itemId === o.itemId)
        const expires = new Date(now().getFullYear(), now().getMonth(), now().getDate() + r.shelfLifeDays, 12).toISOString()
        return {
          plannedQty: o.plannedQty,
          costPlannedCents: unitCostCents(r, costOf),
          suggestedLot: suggestLotCode(r.lotPrefix, finishedLots),
          suggestedExpiresAt: expires,
          overheadCents: r.overheadCents * o.batches,
          consumption: needs(r, o.batches).map((n) => {
            const it = st.stockItems.find((i) => i.id === n.itemId)!
            const per = it.content?.qty ?? 1
            const unit = it.content?.unit ?? 'un'
            return { itemId: n.itemId, name: it.name, unit, planned: Math.round(n.qty * per * 100) / 100, perUnit: per, step: unit === 'ml' ? 5 : unit === 'kg' ? 0.1 : 1, decimals: unit === 'kg' ? 1 : 0, unitCostCents: costOf(n.itemId) }
          }),
        }
      },
      async finish(id, input) {
        let result!: ReturnType<typeof finishOrder>
        let names: Array<{ name: string; qtyText: string }> = []
        const st = db.update((s) => {
          const o = s.productionOrders.find((x) => x.id === id)
          const r = o && s.recipes.find((x) => x.id === o.recipeId)
          if (!o || !r) throw new ProductionError('not_found')
          result = finishOrder(s, o, r, input, now())
          const i = s.productionOrders.findIndex((x) => x.id === id)
          s.productionOrders[i] = result.order
          // A reserva dos insumos termina: o consumo real já saiu do estoque.
          s.reservations = s.reservations.filter((x) => !o.reservationIds.includes(x.id))
          names = input.consumption.filter((c) => c.qty > 0).map((c) => {
            const it = s.stockItems.find((x) => x.id === c.itemId)!
            return { name: it.name, qtyText: formatContent(c.qty, it) }
          })
        })
        const it = st.stockItems.find((x) => x.id === result.order.itemId)!
        const order = orderView(result.order, st)
        return {
          order,
          entered: { itemName: itemLabel(it), lotCode: result.order.lotCode!, expiresAt: result.order.expiresAt, qty: result.order.goodQty! },
          consumed: names,
          lossQty: result.order.plannedQty - result.order.goodQty!,
          costPerUnitCents: result.order.costPerUnitCents!,
        }
      },
      async undoFinish(id) {
        let order!: ProductionOrder
        const st = db.update((s) => {
          const i = s.productionOrders.findIndex((x) => x.id === id)
          if (i < 0) throw new ProductionError('not_found')
          const back = undoFinish(s, s.productionOrders[i])
          s.productionOrders[i] = back
          order = back
        })
        return orderView(order, st)
      },
    },

    finance: {
      async overview() {
        const st = db.read()
        const t = now()
        const accounts = accountsOf(st)
        const total = accounts.reduce((a, x) => a + x.balanceCents, 0)
        const attention = financeAttention(st, t)
        return { totalCents: total, accounts, attention, forecast: forecast(st.entries, total, t) }
      },
      async entries() {
        const st = db.read()
        const t = now()
        const view = (dir: 'payable' | 'receivable') => st.entries.filter((e) => e.direction === dir && entryOpen(e)).sort((a, b) => a.dueAt.localeCompare(b.dueAt)).map((e) => entryView(e, t))
        const tot = financeTotals(st.entries)
        return { payables: view('payable'), receivables: view('receivable'), payableTotalCents: tot.payableCents, receivableTotalCents: tot.receivableCents }
      },
      async getEntry(id) {
        const st = db.read()
        const e = st.entries.find((x) => x.id === id)
        return e ? { entry: entryView(e, now()), accounts: accountsOf(st) } : null
      },
      async pay(id, input) {
        let out!: ReturnType<typeof payEntry>
        const st = db.update((s) => {
          out = payEntry(s, id, input, now())
        })
        return { entry: entryView(out.entry, now()), accountName: accountName[input.accountId], balanceAfter: out.balanceAfter, next: out.next ? entryView(out.next, now()) : null, transactionId: out.transactionId, ...(st ? {} : {}) }
      },
      async undoPay(transactionId) {
        db.update((s) => {
          undoPayment(s, transactionId, now())
        })
      },
      async setOpeningBalance(accountId, cents) {
        db.update((st) => {
          if (!(cents >= 0)) throw new FinanceError('invalid_amount')
          if (st.transactions.some((t) => t.accountId === accountId && t.kind === 'opening')) throw new Error('already_set')
          if (cents > 0) addTransaction(st, { at: now().toISOString(), accountId, amountCents: cents, kind: 'opening', title: 'Saldo inicial', note: 'Informado ao começar a usar o sistema' })
        })
      },
      async ledger() {
        const st = db.read()
        const t = now()
        // Últimos 7 dias, como no quadro.
        const rows = ledger(st.transactions).filter((r) => daysFromToday(r.at, t) >= -7)
        return { rows, ...ledgerTotals(rows) }
      },
    },

    dashboard: {
      async get(): Promise<Dashboard> {
        const { orders } = db.read()
        const t = now()
        const sameDay = (iso: string) => {
          const d = new Date(iso)
          return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
        }
        const today = orders.filter((o) => sameDay(o.createdAt) && o.status !== 'cancelled')
        const online = today.filter((o) => o.channel === 'online')
        const onlineCents = online.reduce((a, o) => a + o.totalCents, 0)
        const open = orders.filter((o) => stageOf(o) !== null)
        const fresh = open.filter((o) => stageOf(o) === 'new').sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        const minutes = fresh.length ? Math.max(0, Math.round((t.getTime() - new Date(fresh[0].createdAt).getTime()) / 60_000)) : 0
        const attention: Dashboard['attention'] = []
        if (fresh.length > 0) {
          attention.push({
            id: 'new-orders',
            icon: 'pedidos',
            title: fresh.length === 1 ? '1 pedido novo' : `${fresh.length} pedidos novos`,
            detail: `Aguardando aceite · o mais antigo há ${minutes} min`,
            href: '/gestao/pedidos',
          })
        }
        for (const a of financeAttention(db.read(), t)) {
          attention.push(
            a.tag === 'Atrasado'
              ? { id: `late-${a.id}`, icon: 'alerta', title: `${a.title} atrasado`, detail: `${a.detail.split(' · ')[0]} · ${formatBRL(a.amountCents)}`, href: a.href }
              : { id: 'due-today', icon: 'financeiro', title: a.title, detail: `${formatBRL(a.amountCents)} · ${a.detail}`, href: a.href },
          )
        }
        const stockState = stateOf(db.read())
        const expiring = expiringLots(stockState.lots, stockState.movements, stockState.stockItems, t)
        if (expiring.length > 0) {
          const names = [...new Set(expiring.map((x) => x.item.name))]
          attention.push({ id: 'lots', icon: 'validade', title: `${expiring.length} ${expiring.length === 1 ? 'lote vence' : 'lotes vencem'} em até 7 dias`, detail: names.join(', '), href: '/gestao/estoque?filtro=vencendo' })
        }
        const low = lowRows(buildRows(stockState, t))
        if (low.length > 0) {
          const first = low.slice(0, 2).map((r) => r.name.replace(/ \d+ ?(g|kg|ml|L)$/i, ''))
          const more = low.length - first.length
          attention.push({ id: 'low', icon: 'estoque', title: `${low.length} ${low.length === 1 ? 'item com estoque baixo' : 'itens com estoque baixo'}`, detail: more > 0 ? `${first.join(', ')} e mais ${more}` : first.join(', '), href: '/gestao/estoque?filtro=baixo' })
        }
        return {
          salesToday: {
            totalCents: onlineCents + todayCounter(db.read(), t).cents,
            count: online.length + todayCounter(db.read(), t).count,
            yesterdayUntilNowCents: db.read().yesterdayUntilNowCents ?? dashboardSeed.yesterdayUntilNowCents,
            counter: { count: todayCounter(db.read(), t).count, cents: todayCounter(db.read(), t).cents },
            online: { count: online.length, cents: onlineCents },
          },
          attention,
          today: {
            // "Em aberto" = o que pede ação da casa (novos e em preparo); prontos e em rota já saíram da bancada.
            openOrders: {
              count: open.filter((o) => ['new', 'preparing'].includes(stageOf(o) ?? '')).length,
              newCount: open.filter((o) => stageOf(o) === 'new').length,
              preparingCount: open.filter((o) => stageOf(o) === 'preparing').length,
            },
            inProduction: (() => {
              const going = db.read().productionOrders.filter((o) => o.status === 'in_progress')
              const names = [...new Set(going.map((o) => db.read().stockItems.find((i) => i.id === o.itemId)?.name ?? ''))]
              return { count: going.length, detail: names.join(' · ') }
            })(),
            payableToday: (() => {
              const due = db.read().entries.filter((e) => e.direction === 'payable' && entryOpen(e) && standingOf(e, t).standing === 'today')
              return { cents: due.reduce((a, e) => a + remaining(e), 0), count: due.length }
            })(),
            receivableWeek: (() => {
              const rec = db.read().entries.filter((e) => e.direction === 'receivable' && entryOpen(e) && daysFromToday(e.dueAt, t) <= 7)
              return { cents: rec.reduce((a, e) => a + remaining(e), 0), detail: 'cartões e fiado' }
            })(),
          },
        }
      },
    },

    catalog: {
      async list() {
        const st = db.read()
        return st.stockItems.map((i) => {
          const sale = st.sales.find((s) => s.itemId === i.id) ?? defaultSale(i.id)
          return { id: i.id, label: itemLabel(i), kind: kindOf(i), channel: channelLabel(i, sale), priceCents: sale.soldByWeight && sale.weightPriceCents ? sale.weightPriceCents : sale.priceCents, soldByWeight: sale.soldByWeight }
        })
      },
      async get(id) {
        const st = db.read()
        return productDetail(st, id)
      },
      async save(id, input: ProductInput) {
        if (Object.keys(validateProduct(input)).length) throw new Error('invalid')
        const unit = db.read().stockItems.find((x) => x.id === id)?.unit ?? ''
        if (input.soldByWeight && input.itemType !== 'raw_material' && unitKg(unit) == null) throw new Error('invalid')
        let out: ProductDetail | null = null
        db.update((st) => {
          const i = st.stockItems.findIndex((x) => x.id === id)
          if (i < 0) throw new Error('not_found')
          let si = st.sales.findIndex((s) => s.itemId === id)
          if (si < 0) { st.sales.push(defaultSale(id)); si = st.sales.length - 1 }
          const r = applyProduct(st.stockItems[i], st.sales[si], input)
          st.stockItems[i] = r.item
          st.sales[si] = r.sale
          out = productDetail(st, id)
        })
        return out as unknown as ProductDetail
      },
      async create(input: ProductInput) {
        if (Object.keys(validateProduct(input)).length) throw new Error('invalid')
        const { name, unit } = splitNewLabel(input.name)
        if (input.soldByWeight && input.itemType !== 'raw_material' && unitKg(unit) == null) throw new Error('invalid')
        let id = ''
        db.update((st) => {
          const base = slugify(`${name} ${unit}`) || 'item'
          id = base
          for (let n = 2; st.stockItems.some((x) => x.id === id); n++) id = `${base}-${n}`
          const item = { id, name, unit, itemType: input.itemType, origin: null, categoryId: input.categoryId, minStock: 0, tracksExpiry: false, supplierId: null, lastCostCents: null } as StockItem
          const r = applyProduct(item, defaultSale(id), { ...input, name: unit ? `${name} ${unit}` : name })
          st.stockItems.push(r.item)
          st.sales.push(r.sale)
        })
        return productDetail(db.read(), id)!
      },
      async categories() {
        return categoryRows(db.read())
      },
      async addCategory(name) {
        const st0 = db.read()
        const err = checkNewCategory(name, st0.categories)
        if (err) throw new Error(err)
        let row: CategoryRow | null = null
        db.update((st) => {
          st.categories.push({ id: slugify(name), name: name.trim() })
          row = categoryRows(st).find((c) => c.id === slugify(name)) ?? null
        })
        return row as unknown as CategoryRow
      },
    },

    customers: {
      async list(query = '') {
        const st = db.read()
        return listCustomers(st.customers, st.orders, st.entries, now(), query)
      },
      async get(id) {
        const st = db.read()
        const nameOf = (pid: string) => { const it = st.stockItems.find((i) => i.id === pid); return it?.name ?? products.find((p) => p.id === pid)?.name ?? pid }
        return customerDetail(id, st.customers, st.orders, st.entries, now(), nameOf)
      },
      async saveNotes(id, notes) {
        db.update((st) => {
          const known = st.customers.find((c) => customerId(c.phone) === id)
          if (known) { known.notes = notes; return }
          const o = st.orders.find((x) => customerId(x.contact.phone) === id)
          if (!o) throw new Error('not_found')
          st.customers.push({ phone: o.contact.phone, name: o.contact.name, since: null, notes, channelNote: null, baseline: { orders: 0, spentCents: 0, products: {} } })
        })
      },
    },

    deliveries: {
      async overview() {
        const st = db.read()
        return { rows: dispatchRows(st.orders, st.deliveries), couriers: courierRows(st.couriers, st.deliveries) }
      },
      async getAssign(orderId) {
        const st = db.read()
        const o = st.orders.find((x) => x.id === orderId)
        if (!o || o.fulfillment !== 'delivery') return null
        const rec = openRecordOf(st.deliveries, orderId)
        const district = o.address?.district ?? ''
        const addr = o.address ? `${o.address.street}, ${o.address.number}${o.address.complement ? ` · ${o.address.complement}` : ''}` : ''
        const km = kmLabel(district)
        const items = o.items.reduce((s, i) => s + i.qty, 0)
        const pay = o.payment.paid ? `pago no ${paymentLabel[o.payment.method]}` : `${paymentLabel[o.payment.method].toLowerCase()} ao receber`
        const optionId = rec ? (rec.courierId ?? 'partners') : ''
        return {
          orderId, customer: o.contact.name, statusLabel: o.status === 'ready_for_delivery' ? 'Pronto' : stageLabel(o),
          address: [addr, district].filter(Boolean).join(' · '),
          summary: [km, `${items} ${items === 1 ? 'item' : 'itens'}`, pay].filter(Boolean).join(' · '),
          ready: o.status === 'ready_for_delivery' || !!rec,
          options: assignOptions(st.couriers, st.deliveries.filter((r) => r.orderId !== orderId)),
          current: rec ? { ...assignmentOf(rec), optionId } : null,
        }
      },
      async assign(orderId, optionId) {
        let out = null as ReturnType<typeof assignDelivery> | null
        db.update((st) => {
          out = assignDelivery(st.orders, st.deliveries, st.couriers, orderId, optionId, now())
          st.deliveries.push(out.record)
        })
        return (out as unknown as ReturnType<typeof assignDelivery>).assignment
      },
      async getCourier(id) {
        const c = db.read().couriers.find((x) => x.id === id)
        return c ? { id: c.id, name: c.name, kind: c.kind, phone: c.phone, vehicle: c.vehicle } : null
      },
      async saveCourier(id, input) {
        if (Object.keys(validateCourier(input)).length) throw new Error('invalid')
        let savedId = id ?? ''
        db.update((st) => {
          const digits = (t: string) => t.replace(/\D/g, '')
          if (st.couriers.some((c) => c.id !== id && digits(c.phone) === digits(input.phone))) throw new Error('duplicate')
          const fields = { name: input.name.trim(), kind: input.kind, phone: input.phone.trim(), vehicle: input.vehicle.trim() }
          if (id) {
            const cur = st.couriers.find((c) => c.id === id)
            if (!cur) throw new Error('not_found')
            Object.assign(cur, fields)
          } else {
            const base = slugify(fields.name) || 'entregador'
            savedId = base
            for (let n = 2; st.couriers.some((c) => c.id === savedId); n++) savedId = `${base}-${n}`
            st.couriers.push({ id: savedId, available: true, pixKey: '', ...fields })
          }
        })
        const saved = db.read().couriers.find((c) => c.id === savedId)!
        return courierRows(db.read().couriers, db.read().deliveries).find((r) => r.id === savedId) ?? { id: saved.id, name: saved.name, initial: saved.name.charAt(0), detail: 'Parceiro · avulso', tag: { label: 'Parceiro', tone: 'neutral' as const } }
      },
      async undoAssign(orderId) {
        db.update((st) => {
          st.deliveries = unassign(st.deliveries, orderId)
        })
      },
    },

    reports: {
      async hub() {
        const st = db.read()
        const t = now()
        const days = salesByDay(st.salesHistory, st.orders, todayCounter(st, t), periodStart('month', t), t)
        const lotCost = (m: { lotId: string | null; itemId: string }) => st.lots.find((l) => l.id === m.lotId)?.unitCostCents ?? st.stockItems.find((i) => i.id === m.itemId)?.lastCostCents ?? 0
        const hub = buildHub(days, monthLosses(st.movements, lotCost, t), monthProduction(st.productionOrders, t), monthOutflowCents(st.transactions, t))
        return { ...hub, bestSeller: hub.bestSeller ? { name: productName(st, hub.bestSeller.productId), qty: hub.bestSeller.qty } : null }
      },
      async sales(period) {
        const st = db.read()
        const t = now()
        const r = salesReport(salesByDay(st.salesHistory, st.orders, todayCounter(st, t), periodStart(period, t), t), period)
        return { ...r, top: r.top.map((x) => ({ ...x, name: productName(st, x.productId) })) }
      },
    },

    settings: {
      async overview() {
        const { team } = db.read()
        return {
          people: team.length,
          roles: rolesInUse(team),
          deliveryFeeCents: storefront.deliveryFeeCents,
          paymentLabels: [...storefront.payments.payNow, ...storefront.payments.payOnReceipt].map((p) => p.label),
        }
      },
      async getHouse() {
        return db.read().house
      },
      async saveHouse(house) {
        const clean = cleanHouse(house)
        if (Object.keys(validateHouse(clean)).length) throw new Error('invalid')
        db.update((st) => {
          st.house = clean
        })
        return clean
      },
      async team() {
        return db.read().team
      },
      async setManagerPin(pin) {
        if (!PIN_RULE.test(pin)) throw new Error('invalid')
        customPin = pin
      },
      async invite(email, role) {
        let member = null as TeamMember | null
        db.update((st) => {
          const err = checkInvite(email, role, st.team)
          if (err) throw new Error(err)
          const e = email.trim().toLowerCase()
          member = { id: `u-${e}`, name: e.split('@')[0], email: e, role, note: 'Convite pendente', pending: true }
          st.team.push(member)
          // D21: o convite é só registrado; nenhuma mensagem é enviada.
          st.outbox.push({ id: `msg-${st.outbox.length + 1}`, to: e, text: `Convite para a equipe da casa como ${role}`, at: now().toISOString(), kind: 'invite' })
        })
        return member as unknown as TeamMember
      },
    },

    pos: {
      async overview() {
        const st = db.read()
        const s = currentSession(st)
        const last = lastClosed(st)
        return {
          session: s ? sessionView(s) : null,
          lastClose: last ? { at: last.closedAt!, differenceCents: (last.countedCents ?? 0) - (last.expectedCents ?? 0) } : null,
          pendingSales: st.posSales.filter((x) => x.pending).length,
        }
      },
      async openSession(openingCents, by) {
        let out = null as CashSession | null
        db.update((st) => {
          if (currentSession(st)) throw new Error('session_open')
          if (!(openingCents >= 0)) throw new PosError('invalid_amount')
          const id = `cx-${st.cashSessions.length + 1}`
          out = { id, openedAt: now().toISOString(), openedBy: by, openingCents, baseline: { count: 0, cashCents: 0, pixCents: 0, cardCents: 0 }, movements: [], status: 'open', closedAt: null, closedBy: null, countedCents: null, expectedCents: null }
          st.cashSessions.push(out)
        })
        return sessionView(out as unknown as CashSession)
      },
      async catalog() {
        const st = db.read()
        const rows = buildRows(stateOf(st), now())
        const products = st.stockItems.flatMap((i) => {
          const sale = st.sales.find((x) => x.itemId === i.id)
          if (i.itemType === 'raw_material' || !sale || sale.priceCents == null) return []
          const row = rows.find((r) => r.itemId === i.id)
          const avail = Math.max(0, row?.available ?? 0)
          const perKg = sale.soldByWeight && sale.weightPriceCents != null && unitKg(i.unit) != null
          return [{
            id: i.id, name: i.name, unit: i.unit,
            priceCents: perKg ? sale.weightPriceCents! : sale.priceCents,
            perKg,
            stockText: perKg ? formatKgShort(unitsToKg(avail, i.unit)) : `${Math.round(avail * 100) / 100} un`,
            low: row?.level === 'low', out: avail <= 0, categoryId: i.categoryId, favorite: sale.favoritePos, availableUnits: avail,
          }]
        })
        const used = new Set(products.map((p) => p.categoryId))
        return { products, categories: st.categories.filter((c) => !c.internal && used.has(c.id)).map((c) => ({ id: c.id, name: c.name })) }
      },
      async checkout(input, by) {
        let out = null as PosSale | null
        db.update((st) => {
          const session = currentSession(st)
          if (!session) throw new PosError('no_session')
          if (input.lines.length === 0) throw new PosError('empty_cart')
          const t = now()
          const rows = buildRows(stateOf(st), t)
          const lines: SaleLine[] = input.lines.map((cl) => {
            const it = st.stockItems.find((x) => x.id === cl.itemId)
            const sale = st.sales.find((x) => x.itemId === cl.itemId)
            const info: PriceInfo | undefined = it && sale && sale.priceCents != null && it.itemType !== 'raw_material' ? { name: it.name, unit: it.unit, priceCents: sale.priceCents, weightPriceCents: sale.soldByWeight ? sale.weightPriceCents : null } : undefined
            return priceLine(cl, info)
          })
          // Estoque disponível por item (o mesmo item pode estar em mais de uma linha, por exemplo pesagens).
          const need = new Map<string, number>()
          for (const l of lines) need.set(l.itemId, (need.get(l.itemId) ?? 0) + l.stockUnits)
          for (const [itemId, units] of need) if (units > (rows.find((r) => r.itemId === itemId)?.available ?? 0) + 1e-9) throw new PosError('insufficient_stock', itemId)
          const subtotal = subtotalOf(lines)
          const cents = input.discount ? discountCents(input.discount.kind, subtotal) : 0
          const discount = input.discount && cents > 0 ? { kind: input.discount.kind, cents, reason: input.discount.reason } : null
          const total = subtotal - (discount?.cents ?? 0)
          assertPaid(total, input.payments)
          const id = nextSaleId(st.posSales.map((s) => s.id))
          const movementIds: string[] = []
          for (const l of lines) {
            for (const take of pickLots(st.lots, st.movements, l.itemId, l.stockUnits)) {
              const mid = nextMovementId(st)
              st.movements.push({ id: mid, itemId: l.itemId, lotId: take.lot.id, type: 'sale_out', qty: -take.qty, at: t.toISOString(), ref: id, description: 'Venda no balcão', by })
              movementIds.push(mid)
              l.lots.push({ lotCode: take.lot.code, qty: take.qty })
            }
          }
          const cash = cashNetOf(input.payments)
          const pix = input.payments.filter((p) => p.method === 'pix').reduce((a, p) => a + p.cents, 0)
          if (cash > 0) addTransaction(st, { at: t.toISOString(), accountId: 'cash', amountCents: cash, kind: 'sale', title: `Venda ${id} · dinheiro`, note: 'Balcão' })
          if (pix > 0) addTransaction(st, { at: t.toISOString(), accountId: 'bank', amountCents: pix, kind: 'sale', title: `Venda ${id} · Pix`, note: 'Balcão' })
          out = { id, sessionId: session.id, at: t.toISOString(), by, lines, subtotalCents: subtotal, discount, totalCents: total, payments: input.payments, changeCents: changeOf(input.payments), status: 'completed', cancel: null, movementIds, ...(input.offline ? { pending: true } : {}) }
          st.posSales.push(out)
        })
        return out as unknown as PosSale
      },
      async sales(filter = 'all') {
        const st = db.read()
        const session = currentSession(st) ?? lastClosed(st)
        const mine = session ? st.posSales.filter((s) => s.sessionId === session.id) : []
        const totals = session ? sessionTotals(session, st.posSales) : { count: 0, totalCents: 0 }
        const rows = mine.sort((a, b) => b.at.localeCompare(a.at)).map(saleRow).filter((r) => filter === 'all' || r.filters.includes(filter)).slice(0, 6)
        return { rows, count: totals.count, totalCents: totals.totalCents, session: session ? sessionView(session) : null }
      },
      async getSale(id) {
        return db.read().posSales.find((s) => s.id === id) ?? null
      },
      async cancelSale(id, pin) {
        let out = null as PosSale | null
        db.update((st) => {
          const s = st.posSales.find((x) => x.id === id)
          if (!s) throw new PosError('not_found')
          if (s.status === 'cancelled') throw new PosError('already_cancelled')
          const approver = Object.entries(MOCK_MANAGER_PINS).find(([, v]) => v.pin === pin) ?? (customPin && pin === customPin ? (['custom', { pin: customPin, name: 'Gestor', roleLabel: 'Gestor' }] as const) : undefined)
          if (!approver) throw new PosError('invalid_pin')
          const t = now()
          // Os itens voltam ao lote de onde saíram.
          for (const l of s.lines) {
            for (const back of l.lots) {
              const lot = st.lots.find((x) => x.itemId === l.itemId && x.code === back.lotCode)
              if (!lot) continue
              st.movements.push({ id: nextMovementId(st), itemId: l.itemId, lotId: lot.id, type: 'adjustment', qty: back.qty, at: t.toISOString(), ref: s.id, description: `Venda ${s.id} cancelada · volta ao estoque`, by: approver[1].name })
            }
          }
          const cash = cashNetOf(s.payments)
          const pix = s.payments.filter((p) => p.method === 'pix').reduce((a, p) => a + p.cents, 0)
          if (cash > 0) addTransaction(st, { at: t.toISOString(), accountId: 'cash', amountCents: -cash, kind: 'sale', title: `Venda ${s.id} cancelada · dinheiro`, note: 'Balcão' })
          if (pix > 0) addTransaction(st, { at: t.toISOString(), accountId: 'bank', amountCents: -pix, kind: 'sale', title: `Venda ${s.id} cancelada · Pix`, note: 'Balcão' })
          s.status = 'cancelled'
          s.cancel = { at: t.toISOString(), by: s.by, approvedBy: `${approver[1].name} (${approver[1].roleLabel})` }
          out = s
        })
        return out as unknown as PosSale
      },
      async cash() {
        const st = db.read()
        const s = currentSession(st) ?? lastClosed(st)
        return s ? cashView(st, s) : null
      },
      async addMovement(kind, cents, reason, by) {
        let out = null as CashView | null
        db.update((st) => {
          const s = currentSession(st)
          if (!s) throw new PosError('no_session')
          validateMovement(kind, cents, expectedCash(s, st.posSales))
          const t = now().toISOString()
          s.movements.push({ id: `cm-${s.movements.length + 1}`, at: t, kind, cents, reason, by })
          if (kind === 'sangria' && reason === 'Levar ao banco') {
            const transferId = `tr-${st.transactions.length + 1}`
            addTransaction(st, { at: t, accountId: 'cash', amountCents: -cents, kind: 'transfer', title: 'Sangria do caixa', note: 'Caixa → banco · transferência entre contas', transferId })
            addTransaction(st, { at: t, accountId: 'bank', amountCents: cents, kind: 'transfer', title: 'Sangria do caixa', note: 'Caixa → banco · transferência entre contas', transferId })
          } else {
            addTransaction(st, { at: t, accountId: 'cash', amountCents: kind === 'sangria' ? -cents : cents, kind: 'manual', title: `${kind === 'sangria' ? 'Sangria' : 'Suprimento'} · ${reason}`, note: 'Caixa do balcão' })
          }
          out = cashView(st, s)
        })
        return out as unknown as CashView
      },
      async closeSession(countedCents, by) {
        let out = null as CashView | null
        db.update((st) => {
          const s = currentSession(st)
          if (!s) throw new PosError('no_session')
          if (!(countedCents >= 0)) throw new PosError('invalid_amount')
          const expected = expectedCash(s, st.posSales)
          const diff = cashDifference(countedCents, expected)
          const t = now().toISOString()
          s.status = 'closed'
          s.closedAt = t
          s.closedBy = by
          s.countedCents = countedCents
          s.expectedCents = expected
          // A diferença acerta o saldo do caixa no financeiro: o que está na gaveta é o que foi contado.
          s.differenceTxId = diff !== 0 ? addTransaction(st, { at: t, accountId: 'cash', amountCents: diff, kind: 'manual', title: `Diferença do caixa · ${diff > 0 ? 'sobra' : 'falta'}`, note: 'Fechamento do caixa' }) : null
          out = cashView(st, s)
        })
        return out as unknown as CashView
      },
      async reopenSession() {
        let out = null as CashView | null
        db.update((st) => {
          if (currentSession(st)) throw new Error('session_open')
          const s = lastClosed(st)
          if (!s) throw new PosError('no_session')
          const diff = (s.countedCents ?? 0) - (s.expectedCents ?? 0)
          if (diff !== 0) addTransaction(st, { at: now().toISOString(), accountId: 'cash', amountCents: -diff, kind: 'manual', title: 'Diferença do caixa desfeita', note: 'Caixa reaberto para corrigir' })
          s.status = 'open'
          s.closedAt = null
          s.closedBy = null
          s.countedCents = null
          s.expectedCents = null
          s.differenceTxId = null
          out = cashView(st, s)
        })
        return out as unknown as CashView
      },
      async sendReceipt(saleId, phone) {
        db.update((st) => {
          if (!st.posSales.some((s) => s.id === saleId)) throw new PosError('not_found')
          // D21: o comprovante é só registrado; nenhuma mensagem sai.
          st.outbox.push({ id: `msg-${st.outbox.length + 1}`, to: phone, text: `Comprovante da venda ${saleId}`, at: now().toISOString(), kind: 'receipt' })
        })
      },
      async syncPending() {
        let n = 0
        db.update((st) => {
          for (const s of st.posSales) if (s.pending) { s.pending = false; n += 1 }
        })
        return n
      },
    },

    courier: {
      codeLength: 4,
      async requestCode(phone) {
        if (!courierByPhone(db.read(), phone)) throw new DeliveryError('not_found')
        // D21: o código não é enviado por WhatsApp. Em desenvolvimento, a tela mostra o código de teste.
      },
      async verify(phone, code) {
        const c = courierByPhone(db.read(), phone)
        if (!c) throw new DeliveryError('not_found')
        if (code !== MOCK_COURIER_CODE) throw new Error('invalid_code')
        return c
      },
      async profile(id) {
        return db.read().couriers.find((c) => c.id === id) ?? null
      },
      async setAvailable(id, available) {
        let out = null as Courier | null
        db.update((st) => {
          const c = st.couriers.find((x) => x.id === id)
          if (!c) throw new DeliveryError('not_found')
          c.available = available
          out = c
        })
        return out as unknown as Courier
      },
      async savePix(id, key) {
        let out = null as Courier | null
        db.update((st) => {
          const c = st.couriers.find((x) => x.id === id)
          if (!c) throw new DeliveryError('not_found')
          c.pixKey = key.trim()
          out = c
        })
        return out as unknown as Courier
      },
      async list(id) {
        const st = db.read()
        const c = st.couriers.find((x) => x.id === id)
        if (!c) throw new DeliveryError('not_found')
        const seen = visibleTo(c, st.orders, st.deliveries)
        return {
          profile: c,
          available: seen.available.map((s) => courierCard(c, s.order, s.record)),
          mine: seen.mine.map((m) => courierCard(c, m.order, m.record)),
        }
      },
      async get(id, orderId) {
        const st = db.read()
        const c = st.couriers.find((x) => x.id === id)
        return c ? courierDetail(st, c, orderId) : null
      },
      async take(id, orderId) {
        return courierMutate(id, orderId, (c, o, st) => { courierTake(c, o, st.deliveries, now()) })
      },
      async accept(id, orderId) {
        return courierMutate(id, orderId, (c, _o, st) => { courierAccept(c, openRecordOf(st.deliveries, orderId), now()) })
      },
      async depart(id, orderId) {
        return courierMutate(id, orderId, (c, o, st) => { courierDepart(c, o, openRecordOf(st.deliveries, orderId), now()) })
      },
      async confirm(id, orderId, code) {
        return courierMutate(id, orderId, (c, o, st) => { courierConfirm(c, o, openRecordOf(st.deliveries, orderId), code, now()) })
      },
      async problem(id, orderId, reason, note) {
        return courierMutate(id, orderId, (c, o, st) => { reportProblem(c, o, openRecordOf(st.deliveries, orderId), reason, note, now()) })
      },
      async undoProblem(id, orderId) {
        return courierMutate(id, orderId, (c, o, st) => {
          const rec = [...st.deliveries].filter((r) => r.orderId === orderId && r.status === 'returned').sort((a, b) => b.at.localeCompare(a.at))[0]
          courierUndoProblem(c, o, rec, st.deliveries)
        })
      },
      async history(id) {
        const st = db.read()
        const c = st.couriers.find((x) => x.id === id)
        if (!c) throw new DeliveryError('not_found')
        return { ...historyOf(c, st.deliveries, now()), courierName: c.name }
      },
    },
  }
}
