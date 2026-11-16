import { transition } from '@/domain/orderFlow'
import { stageOf } from '@/domain/orders'
import type { Order } from '@/domain/types'
import type { TeamMember } from '@/domain/settings'
import { adjust, applyCount, buildRows, expiringLots, lowRows, reverse, stockValueCents, undoCount, reservedByItem, type StockState } from '@/domain/stock'
import { products } from './seed'
import { applyProduct, channelLabel, checkNewCategory, defaultSale, kindOf, slugify, validateProduct, type ProductInput } from '@/domain/catalog'
import { customerDetail, customerId, listCustomers } from '@/domain/customers'
import { productCost } from './catalogView'
import { checkInvite, cleanHouse, rolesInUse, validateHouse } from '@/domain/settings'
import { storefront } from '@/config/storefront'
import { buildHub, monthLosses, monthOutflowCents, monthProduction, periodStart, salesByDay, salesReport } from '@/domain/reports'
import { todayCounterSeed } from './reportsSeed'
import { assign as assignDelivery, assignmentOf, assignOptions, courierRows, dispatchRows, kmLabel, unassign } from '@/domain/deliveries'
import { paymentLabel } from '@/config/storefront'
import { formatBRL } from '@/lib/format'
import { batchCostCents, checkInputs, finishOrder, formatContent, marginPercent, needs, nextOrderId, ProductionError, suggestLotCode, undoFinish, unitCostCents, type ProductionOrder } from '@/domain/production'
import type { AccountView, AdminOrder, CategoryRow, ProductDetail, AdminServices, Dashboard, EntryView, FinanceOverview, FinishDefaults, MovementView, ProductionOrderView, PurchaseSuggestion, PurchaseView, RecipeView, StockItemView, SupplierView } from '@/services/types'
import { daysUntil, itemBalance, itemLabel, lotsFefo, nextLot } from '@/domain/inventory'
import { orderTotal, paymentTerms, purchaseMessage, receivedTotal, suggestQty, isOpen, type PurchaseOrder } from '@/domain/purchasing'
import { closeShortOrder, receive, reverseLastReceipt } from '@/domain/receiving'
import { accountName, balanceOf, daysFromToday, forecast, isOpen as entryOpen, ledger, ledgerTotals, payEntry, remaining, standingOf, totals as financeTotals, undoPayment, type FinancialEntry } from '@/domain/finance'
import { adminUsers, dashboardSeed, MOCK_ADMIN_PASSWORD } from './adminSeed'
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
  (['bank', 'cash'] as const).map((id) => ({ id, name: accountName[id], balanceCents: balanceOf(st.transactions, id) }))

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

const stageLabel = (o: Order) => (o.status === 'received' ? 'Novo' : o.status === 'preparing' ? 'Em preparo' : 'Pronto')

const productDetail = (st: MockState, id: string): ProductDetail | null => {
  const i = st.stockItems.find((x) => x.id === id)
  if (!i) return null
  const sale = st.sales.find((s) => s.itemId === id) ?? defaultSale(id)
  const cost = productCost(st, i)
  return {
    id, label: itemLabel(i), unit: i.unit, name: itemLabel(i), categoryId: i.categoryId, itemType: i.itemType, origin: i.origin,
    priceCents: sale.priceCents, minStock: `${i.minStock} un`, published: sale.published, favoritePos: sale.favoritePos,
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
    const price = products.find((p) => p.id === r.itemId)?.priceCents ?? null
    return {
      id: r.id, itemId: r.itemId, name: itemLabel(item), itemType: item.itemType, origin: item.origin,
      yieldPerBatch: r.yieldPerBatch, batchLabel: r.batchLabel, shelfLifeDays: r.shelfLifeDays,
      unitCostCents: unit, batchCostCents: batchCostCents(r, costOf), priceCents: price, marginPercent: price ? marginPercent(price, unit) : null,
      overheadCents: r.overheadCents, method: r.method, lotPrefix: r.lotPrefix,
      lines: r.lines.map((l) => {
        const it = st.stockItems.find((i) => i.id === l.itemId)!
        return { itemId: l.itemId, name: it.name, qtyText: formatContent(l.qtyPerBatch, it), costCents: Math.round(l.qtyPerBatch * costOf(l.itemId)) }
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
        return {
          ...row,
          unit: it.unit,
          unitCostCents: fefo[0]?.unitCostCents ?? it.lastCostCents,
          priceCents: product?.priceCents ?? null,
          published: product ? product.available : null,
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
            totalCents: onlineCents + dashboardSeed.counterSales.cents,
            count: online.length + dashboardSeed.counterSales.count,
            yesterdayUntilNowCents: dashboardSeed.yesterdayUntilNowCents,
            counter: dashboardSeed.counterSales,
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
          return { id: i.id, label: itemLabel(i), kind: kindOf(i), channel: channelLabel(i, sale), priceCents: sale.priceCents, soldByWeight: sale.soldByWeight }
        })
      },
      async get(id) {
        const st = db.read()
        return productDetail(st, id)
      },
      async save(id, input: ProductInput) {
        if (Object.keys(validateProduct(input)).length) throw new Error('invalid')
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
        return { rows: dispatchRows(st.orders, st.deliveries), couriers: courierRows(st.deliveries) }
      },
      async getAssign(orderId) {
        const st = db.read()
        const o = st.orders.find((x) => x.id === orderId)
        if (!o || o.fulfillment !== 'delivery') return null
        const rec = st.deliveries.find((r) => r.orderId === orderId)
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
          options: assignOptions(st.deliveries.filter((r) => r.orderId !== orderId)),
          current: rec ? { ...assignmentOf(rec), optionId } : null,
        }
      },
      async assign(orderId, optionId) {
        let out = null as ReturnType<typeof assignDelivery> | null
        db.update((st) => {
          out = assignDelivery(st.orders, st.deliveries, orderId, optionId, now())
          st.deliveries.push(out.record)
        })
        return (out as unknown as ReturnType<typeof assignDelivery>).assignment
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
        const days = salesByDay(st.salesHistory, st.orders, todayCounterSeed, periodStart('month', t), t)
        const lotCost = (m: { lotId: string | null; itemId: string }) => st.lots.find((l) => l.id === m.lotId)?.unitCostCents ?? st.stockItems.find((i) => i.id === m.itemId)?.lastCostCents ?? 0
        const hub = buildHub(days, monthLosses(st.movements, lotCost, t), monthProduction(st.productionOrders, t), monthOutflowCents(st.transactions, t))
        return { ...hub, bestSeller: hub.bestSeller ? { name: productName(st, hub.bestSeller.productId), qty: hub.bestSeller.qty } : null }
      },
      async sales(period) {
        const st = db.read()
        const t = now()
        const r = salesReport(salesByDay(st.salesHistory, st.orders, todayCounterSeed, periodStart(period, t), t), period)
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
  }
}
