import { transition } from '@/domain/orderFlow'
import { stageOf } from '@/domain/orders'
import type { Order } from '@/domain/types'
import type { AdminOrder, AdminServices, Dashboard } from '@/services/types'
import { adminUsers, dashboardSeed, lotsFor, MOCK_ADMIN_PASSWORD } from './adminSeed'
import type { MockDb } from './db'
import { customersSeed, hhmm } from './seedOrders'

const norm = (s: string) => s.trim().toLowerCase()

export function createAdminServices({ db, now }: { db: MockDb; now: () => Date }): AdminServices {
  const toAdmin = (o: Order, all: Order[]): AdminOrder => {
    const lots = lotsFor(now())
    const known = customersSeed[o.contact.phone]
    const placed = all.filter((x) => x.contact.phone === o.contact.phone).length
    return {
      ...o,
      // O lote sugerido é o que vence primeiro (H-G11).
      items: o.items.map((i) => ({ ...i, lot: lots[i.productId]?.[0] ?? null })),
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
        attention.push(...dashboardSeed.alerts)
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
