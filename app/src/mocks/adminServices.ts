import { transition } from '@/domain/orderFlow'
import { stageOf } from '@/domain/orders'
import type { Order } from '@/domain/types'
import { adjust, applyCount, buildRows, expiringLots, lowRows, reverse, stockValueCents, undoCount, reservedByItem, type StockState } from '@/domain/stock'
import { products } from './seed'
import type { AdminOrder, AdminServices, Dashboard, MovementView, PurchaseSuggestion, PurchaseView, StockItemView, SupplierView } from '@/services/types'
import { daysUntil, itemBalance, lotsFefo, nextLot } from '@/domain/inventory'
import { orderTotal, paymentTerms, purchaseMessage, receivedTotal, suggestQty, isOpen, type PurchaseOrder } from '@/domain/purchasing'
import { closeShortOrder, receive, reverseLastReceipt } from '@/domain/receiving'
import { adminUsers, dashboardSeed, MOCK_ADMIN_PASSWORD } from './adminSeed'
import type { MockDb, MockState } from './db'
import { customersSeed, hhmm } from './seedOrders'

const norm = (s: string) => s.trim().toLowerCase()

const stateOf = (st: MockState): StockState => ({
  stockItems: st.stockItems, lots: st.lots, movements: st.movements, orders: st.orders, reservations: st.reservations, purchaseOrders: st.purchaseOrders,
})

const sameDay = (iso: string, t: Date) => {
  const d = new Date(iso)
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

export function createAdminServices({ db, now }: { db: MockDb; now: () => Date }): AdminServices {
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
      openPayablesCents: st.payables.filter((p) => p.supplierId === id && !p.paidAt).reduce((a, p) => a + p.amountCents, 0),
      products: st.stockItems.filter((i) => i.supplierId === id).map((i) => ({ itemId: i.id, name: `${i.name} ${i.unit}`, lastCostCents: i.lastCostCents })),
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
            return { itemId: i.id, name: `${i.name} ${i.unit}`, balance: r.available, min: i.minStock, level: r.level, lastCostCents: i.lastCostCents ?? 0, suggestedQty: suggestQty(r.available, i.minStock) }
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
              return { itemId: it.id, name: `${it.name} ${it.unit}`, qty: l.qty, unitCostCents: it.lastCostCents ?? 0, receivedQty: 0 }
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
        return { name: `${it.name} ${it.unit}`, physical: saldo, rows: rows.reverse() }
      },
      async adjust(input) {
        let out!: { movementId: string; costCents: number; physicalBefore: number; physicalAfter: number; lotCode: string; itemName: string }
        db.update((s) => {
          const before = itemBalance(s.movements, input.itemId)
          const m = adjust(s, { ...input, now: now() })
          const lot = s.lots.find((l) => l.id === input.lotId)!
          const it = s.stockItems.find((x) => x.id === input.itemId)!
          out = { movementId: m.id, costCents: input.qty * lot.unitCostCents, physicalBefore: before, physicalAfter: itemBalance(s.movements, input.itemId), lotCode: lot.code, itemName: `${it.name} ${it.unit}` }
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
            return { itemId: i.id, name: `${i.name} ${i.unit}`, system: itemBalance(st.movements, i.id), unitCostCents: lot?.unitCostCents ?? i.lastCostCents ?? 0 }
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
        attention.push(...dashboardSeed.alerts) // contas: valores de exemplo até o Financeiro (lote 5)
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
            inProduction: dashboardSeed.inProduction,
            payableToday: dashboardSeed.payableToday,
            receivableWeek: dashboardSeed.receivableWeek,
          },
        }
      },
    },
  }
}
