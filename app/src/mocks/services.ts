import { storefront } from '@/config/storefront'
import { buildLines, computeTotals } from '@/domain/bag'
import type { Order, OrderStatus, PlaceOrderInput } from '@/domain/types'
import type { Services } from '@/services/types'
import { categories, content, homeSections, products, seedOrders } from './seed'

/**
 * Implementação SIMULADA dos serviços (D19: sem banco). Nada sai do navegador: não envia mensagem, não cobra.
 * Pedidos feitos aqui ficam no localStorage deste aparelho (H-L12).
 */

const ORDERS_KEY = 'bodeleve.mock.orders'
/** Código de teste do login (o envio real por WhatsApp depende de P8). */
export const MOCK_LOGIN_CODE = '1234'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>

function readPlaced(store: Storage | null): Order[] {
  try {
    const raw = store?.getItem(ORDERS_KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

function randomCode(length: number): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => String(b % 10)).join('')
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

export type MockOptions = {
  storage?: Storage | null
  /** Pedidos de exemplo dos quadros (1042, 1017, 0988). Ligado em desenvolvimento. */
  withSeedOrders?: boolean
  now?: () => Date
  code?: () => string
}

export function createMockServices(opts: MockOptions = {}): Services {
  const storage = opts.storage === undefined ? (typeof localStorage === 'undefined' ? null : localStorage) : opts.storage
  const withSeed = opts.withSeedOrders ?? false
  const now = opts.now ?? (() => new Date())
  const makeCode = opts.code ?? (() => randomCode(storefront.deliveryCodeLength))

  const allOrders = (): Order[] => [...readPlaced(storage), ...(withSeed ? seedOrders : [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    catalog: {
      async listCategories() {
        return categories
      },
      async listProducts(filter = {}) {
        const q = filter.query ? norm(filter.query.trim()) : ''
        return products.filter(
          (p) =>
            (!filter.categoryId || p.categoryId === filter.categoryId) &&
            (!filter.origin || p.origin === filter.origin) &&
            (!q || norm(p.name).includes(q)),
        )
      },
      async getProduct(id) {
        return products.find((p) => p.id === id) ?? null
      },
      async getHomeSections() {
        return homeSections
      },
    },

    orders: {
      async placeOrder(input: PlaceOrderInput) {
        const lines = buildLines(Object.fromEntries(input.items.map((i) => [i.productId, i.qty])), products)
        if (lines.length === 0) throw new Error('empty_order')
        if (lines.some((l) => !l.product.available)) throw new Error('unavailable_item')
        // O "servidor" refaz preços e total; o que o cliente mandou de valor é ignorado.
        const totals = computeTotals(lines, input.fulfillment, storefront.deliveryFeeCents)
        const windows = input.fulfillment === 'delivery' ? storefront.deliveryWindows : storefront.pickupWindows
        const window = windows.find((w) => w.id === input.windowId) ?? windows[0]
        const existing = [...readPlaced(storage), ...seedOrders]
        const nextId = Math.max(1042, ...existing.map((o) => Number(o.id) || 0)) + 1
        const created = now()
        const status: OrderStatus = 'received'
        const order: Order = {
          id: String(nextId).padStart(4, '0'),
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
          payment: input.payment,
          deliveryCode: makeCode(),
          etaLabel: null,
          courierName: null,
          stepTimes: { received: hhmm(created) },
        }
        storage?.setItem(ORDERS_KEY, JSON.stringify([order, ...readPlaced(storage)]))
        return order
      },
      async listOrders() {
        return allOrders()
      },
      async getOrder(id) {
        return allOrders().find((o) => o.id === id) ?? null
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
  }
}
