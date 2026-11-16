import { storefront } from '@/config/storefront'
import { buildLines, computeTotals } from '@/domain/bag'
import type { Order, OrderStatus, PlaceOrderInput } from '@/domain/types'
import type { Services } from '@/services/types'
import { createAdminServices } from './adminServices'
import { createDb } from './db'
import { categories as staticCategories, content, homeSections as staticSections, noDetails, products as staticProducts } from './seed'
import { DESCRIPTION_PLACEHOLDER } from '@/domain/catalog'
import type { MockState } from './db'
import type { Product } from '@/domain/types'
import { hhmm } from './seedOrders'

/**
 * Implementação SIMULADA dos serviços (D19: sem banco). Nada sai do navegador: não envia mensagem, não cobra.
 * Pedidos feitos aqui ficam no localStorage deste aparelho (H-L12).
 */

/** Código de teste do login (o envio real por WhatsApp depende de P8). */
export const MOCK_LOGIN_CODE = '1234'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>

function randomCode(length: number): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => String(b % 10)).join('')
}

export type MockOptions = {
  storage?: Storage | null
  /** Pedidos de exemplo dos quadros (1042, 1017, 0988). Ligado em desenvolvimento. */
  withSeedOrders?: boolean
  now?: () => Date
  code?: () => string
}

/**
 * O catálogo da loja é o que a gestão publica (H-I58). Sem o cadastro de venda no banco simulado (testes sem dados de exemplo),
 * vale o catálogo estático. A ordem é a do quadro; o que a gestão publicou depois vem no fim.
 */
function storeCatalog(st: MockState): { products: Product[]; categories: typeof staticCategories; sections: typeof staticSections } {
  if (st.sales.length === 0) return { products: staticProducts, categories: staticCategories, sections: staticSections }
  const order = (id: string) => { const i = staticProducts.findIndex((p) => p.id === id); return i < 0 ? 999 : i }
  const list: Product[] = st.stockItems
    .filter((i) => i.itemType !== 'raw_material')
    .flatMap((i) => {
      const sale = st.sales.find((s) => s.itemId === i.id)
      if (!sale || !sale.published || sale.priceCents == null) return []
      const base = staticProducts.find((p) => p.id === i.id)?.details ?? noDetails
      const description = sale.description === DESCRIPTION_PLACEHOLDER ? base.description : sale.description
      return [{ id: i.id, name: i.name, unit: i.unit, priceCents: sale.priceCents, origin: i.origin ?? 'resale', categoryId: i.categoryId, available: true, details: { ...base, description } }]
    })
    .sort((a, b) => order(a.id) - order(b.id))
  const used = new Set(list.map((p) => p.categoryId))
  const ids = new Set(list.map((p) => p.id))
  return {
    products: list,
    categories: st.categories.filter((c) => !c.internal && used.has(c.id)).map((c) => ({ id: c.id, name: c.name })),
    sections: staticSections.map((s) => ({ ...s, productIds: s.productIds.filter((id) => ids.has(id)) })),
  }
}

export function createMockServices(opts: MockOptions = {}): Services {
  const storage = opts.storage === undefined ? (typeof localStorage === 'undefined' ? null : localStorage) : opts.storage
  const withSeed = opts.withSeedOrders ?? false
  const now = opts.now ?? (() => new Date())
  const makeCode = opts.code ?? (() => randomCode(storefront.deliveryCodeLength))

  const db = createDb({ storage, withSeed, now })
  const deviceOrders = (): Order[] => {
    const { orders, deviceOrderIds } = db.read()
    return orders.filter((o) => deviceOrderIds.includes(o.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  return {
    catalog: {
      async listCategories() {
        return storeCatalog(db.read()).categories
      },
      async listProducts(filter = {}) {
        const q = filter.query ? norm(filter.query.trim()) : ''
        return storeCatalog(db.read()).products.filter(
          (p) =>
            (!filter.categoryId || p.categoryId === filter.categoryId) &&
            (!filter.origin || p.origin === filter.origin) &&
            (!q || norm(p.name).includes(q)),
        )
      },
      async getProduct(id) {
        return storeCatalog(db.read()).products.find((p) => p.id === id) ?? null
      },
      async getHomeSections() {
        return storeCatalog(db.read()).sections
      },
    },

    orders: {
      async placeOrder(input: PlaceOrderInput) {
        const lines = buildLines(Object.fromEntries(input.items.map((i) => [i.productId, i.qty])), storeCatalog(db.read()).products)
        if (lines.length === 0) throw new Error('empty_order')
        if (lines.some((l) => !l.product.available)) throw new Error('unavailable_item')
        // O "servidor" refaz preços e total; o que o cliente mandou de valor é ignorado.
        const totals = computeTotals(lines, input.fulfillment, storefront.deliveryFeeCents)
        const windows = input.fulfillment === 'delivery' ? storefront.deliveryWindows : storefront.pickupWindows
        const window = windows.find((w) => w.id === input.windowId) ?? windows[0]
        const nextId = Math.max(1044, ...db.read().orders.map((o) => Number(o.id) || 0)) + 1
        const created = now()
        const status: OrderStatus = 'received'
        const order: Order = {
          id: String(nextId).padStart(4, '0'),
          channel: 'online',
          createdAt: created.toISOString(),
          status,
          fulfillment: input.fulfillment,
          items: lines.map((l) => ({ productId: l.product.id, name: l.product.name, unit: l.product.unit, unitPriceCents: l.product.priceCents, qty: l.qty })),
          subtotalCents: totals.subtotalCents,
          deliveryFeeCents: totals.deliveryFeeCents,
          totalCents: totals.totalCents,
          contact: input.contact,
          address: input.fulfillment === 'delivery' ? input.address : null,
          window,
          // Sem provedor de pagamento (D21) nada é cobrado: o pedido entra como não pago em qualquer forma.
          payment: { ...input.payment, paid: false },
          deliveryCode: makeCode(),
          etaLabel: null,
          courierName: null,
          stepTimes: { received: hhmm(created) },
        }
        db.update((st) => {
          st.orders.push(order)
          st.deviceOrderIds.push(order.id)
        })
        return order
      },
      async listOrders() {
        return deviceOrders()
      },
      async getOrder(id) {
        return deviceOrders().find((o) => o.id === id) ?? null
      },
    },

    auth: {
      async requestCode() {
        // Simulado: não envia nada. O código de teste é MOCK_LOGIN_CODE.
      },
      async verifyCode(phone, code) {
        if (code !== MOCK_LOGIN_CODE) throw new Error('invalid_code')
        return { phone }
      },
    },

    area: {
      async checkCep(cep) {
        const d = cep.replace(/\D/g, '')
        // Exemplo: CEPs que começam com 99 ficam fora da área, para exercitar o estado "não entregamos aqui" (Q6).
        if (d.startsWith('99')) return { covered: false }
        return { covered: true, feeCents: storefront.deliveryFeeCents, street: 'Rua das Camélias', district: 'Jardim das Flores' }
      },
    },

    content: {
      async getStoreContent() {
        return content
      },
    },

    admin: createAdminServices({ db, now }),
  }
}
