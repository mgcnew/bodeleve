import { storefront } from '@/config/storefront'
import { homeSections as sectionTemplates, content as contentTemplate } from '@/mocks/seed'
import { DESCRIPTION_PLACEHOLDER } from '@/domain/catalog'
import { hoursText } from '@/domain/settings'
import type { Address, Category, HomeSection, Order, OrderStatus, PaymentMethod, PlaceOrderInput, Product, StoreContent, TimeWindow } from '@/domain/types'
import type { AreaService, CatalogService, ContentService, OrderService } from '@/services/types'
import type { Db } from './client'
import { unwrap } from './client'

/**
 * Loja pública sobre o Supabase. O visitante não lê tabela: usa as funções `store_*`, `place_order` e `track_order*`
 * (preço, taxa e total são calculados no servidor). Sem conta, os pedidos do aparelho ficam guardados aqui (número + celular),
 * e é com esse par que o banco devolve o acompanhamento (D6, H-L12).
 */

type Json = Record<string, unknown>
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>

export type StoreOptions = { client: Db; slug: string; storage?: Storage | null }

const KEY = 'bodeleve.store.orders.v1'
type Known = { number: string; phone: string }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const digits = (s: string) => s.replace(/\D/g, '')
/** O banco guarda "14:52"; as telas mostram "14h52". */
const clock = (s: string) => s.replace(/(\d{1,2}):(\d{2})/g, '$1h$2')

function windowsOf(info: Json | null, fulfillment: 'delivery' | 'pickup'): TimeWindow[] {
  const fromDb = info?.[fulfillment === 'delivery' ? 'delivery_windows' : 'pickup_windows']
  if (Array.isArray(fromDb) && fromDb.length > 0) return fromDb as TimeWindow[]
  return [...(fulfillment === 'delivery' ? storefront.deliveryWindows : storefront.pickupWindows)]
}

export function toProduct(r: { slug: string; name: string; unit: string; price_cents: number; origin: string | null; category_slug: string | null; description: string; details: unknown }): Product {
  const d = (r.details ?? {}) as Record<string, unknown>
  const text = (k: string, empty: string) => (typeof d[k] === 'string' && (d[k] as string).trim() ? (d[k] as string) : empty)
  return {
    id: r.slug,
    name: r.name,
    unit: r.unit,
    priceCents: Number(r.price_cents),
    origin: (r.origin ?? 'resale') as Product['origin'],
    categoryId: r.category_slug ?? '',
    available: true,
    details: {
      description: r.description?.trim() ? r.description : DESCRIPTION_PLACEHOLDER,
      conservation: text('conservation', '[COMO CONSERVAR]'),
      validity: text('validity', '[PRAZO DE VALIDADE]'),
      ingredients: text('ingredients', '[INGREDIENTES]'),
    },
  }
}

export function toOrder(j: Json, windows: TimeWindow[]): Order {
  const a = (j.address ?? null) as Record<string, string> | null
  const address: Address | null = a
    ? { cep: a.cep ?? '', street: a.street ?? '', number: a.number ?? '', complement: a.complement ?? '', district: a.district ?? '', reference: a.reference ?? '' }
    : null
  const w = (j.window ?? {}) as Partial<TimeWindow>
  const window: TimeWindow = w.label ? (w as TimeWindow) : (windows.find((x) => x.id === w.id) ?? windows[0])
  const pay = (j.payment ?? {}) as { method?: PaymentMethod; paid?: boolean; change_for_cents?: number | null }
  const steps = (j.step_times ?? {}) as Record<string, string>
  return {
    id: String(j.number),
    channel: 'online',
    createdAt: String(j.created_at),
    status: j.status as OrderStatus,
    fulfillment: j.fulfillment as Order['fulfillment'],
    items: ((j.items ?? []) as Array<Record<string, unknown>>).map((i) => ({
      productId: String(i.slug ?? ''),
      name: String(i.name),
      unit: String(i.unit ?? ''),
      unitPriceCents: Number(i.unit_price_cents),
      qty: Number(i.qty),
    })),
    subtotalCents: Number(j.subtotal_cents),
    deliveryFeeCents: Number(j.delivery_fee_cents),
    totalCents: Number(j.total_cents),
    contact: j.contact as Order['contact'],
    address,
    window,
    payment: { method: pay.method ?? 'pix', changeForCents: pay.change_for_cents ?? null, paid: Boolean(pay.paid) },
    deliveryCode: String(j.delivery_code ?? ''),
    etaLabel: j.eta_label ? clock(String(j.eta_label)) : null,
    courierName: (j.courier_name as string | null) ?? null,
    stepTimes: Object.fromEntries(Object.entries(steps).map(([k, v]) => [k, clock(v)])) as Order['stepTimes'],
  }
}

export function createSupabaseStore({ client, slug, storage }: StoreOptions): { catalog: CatalogService; orders: OrderService; content: ContentService; area: AreaService } {
  const store: Storage | null = storage === undefined ? (typeof localStorage === 'undefined' ? null : localStorage) : storage
  const readKnown = (): Known[] => {
    try {
      const raw = store?.getItem(KEY)
      return raw ? (JSON.parse(raw) as Known[]) : []
    } catch {
      return []
    }
  }
  const remember = (k: Known) => {
    try {
      const all = [k, ...readKnown().filter((x) => x.number !== k.number)].slice(0, 50)
      store?.setItem(KEY, JSON.stringify(all))
    } catch {
      /* sem armazenamento: o pedido continua valendo, só não aparece na lista deste aparelho */
    }
  }

  let infoCache: Promise<Json | null> | null = null
  const info = (): Promise<Json | null> =>
    (infoCache ??= (async () => {
      const r = await client.rpc('store_info', { p_slug: slug })
      return r.error ? null : ((r.data as Json | null) ?? null)
    })())

  const catalogRows = () => client.rpc('store_catalog', { p_slug: slug }).then((r) => unwrap(r) ?? [])
  const products = async (): Promise<Product[]> => (await catalogRows()).map(toProduct)

  const catalog: CatalogService = {
    async listCategories() {
      const rows = unwrap(await client.rpc('store_categories', { p_slug: slug })) ?? []
      return rows.map((c): Category => ({ id: c.slug, name: c.name }))
    },
    async listProducts(filter = {}) {
      const q = filter.query ? norm(filter.query.trim()) : ''
      return (await products()).filter(
        (p) => (!filter.categoryId || p.categoryId === filter.categoryId) && (!filter.origin || p.origin === filter.origin) && (!q || norm(p.name).includes(q)),
      )
    },
    async getProduct(id) {
      return (await products()).find((p) => p.id === id) ?? null
    },
    async getHomeSections() {
      // As seções são configuração (H-L3): os textos vêm do modelo; os produtos, do que está publicado.
      const list = await products()
      const byOrigin = (o: Product['origin']) => list.filter((p) => p.origin === o).map((p) => p.id)
      const sections: HomeSection[] = sectionTemplates.map((s) => ({
        ...s,
        productIds: s.id === 'casa' ? byOrigin('house') : s.id === 'marca' ? byOrigin('brand') : s.id === 'pedidos' ? list.slice(0, 4).map((p) => p.id) : [],
      }))
      return sections.filter((s) => s.productIds.length > 0)
    },
  }

  const orders: OrderService = {
    async placeOrder(input: PlaceOrderInput) {
      const payload = {
        items: input.items.map((i) => ({ slug: i.productId, qty: i.qty })),
        fulfillment: input.fulfillment,
        contact: { name: input.contact.name, phone: input.contact.phone },
        address: input.fulfillment === 'delivery' ? input.address : null,
        windowId: input.windowId,
        payment: { method: input.payment.method, changeForCents: input.payment.changeForCents },
      }
      const j = unwrap(await client.rpc('place_order', { p_slug: slug, p_order: payload })) as Json
      const order = toOrder(j, windowsOf(await info(), input.fulfillment))
      remember({ number: order.id, phone: input.contact.phone })
      return order
    },
    async listOrders() {
      const known = readKnown()
      const byPhone = new Map<string, string[]>()
      for (const k of known) byPhone.set(k.phone, [...(byPhone.get(k.phone) ?? []), k.number])
      const i = await info()
      const found: Order[] = []
      for (const [phone, numbers] of byPhone) {
        const rows = unwrap(await client.rpc('track_orders', { p_slug: slug, p_numbers: numbers, p_phone: phone })) as Json[] | null
        for (const j of rows ?? []) found.push(toOrder(j, windowsOf(i, (j.fulfillment as 'delivery' | 'pickup') ?? 'delivery')))
      }
      return found.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async getOrder(id) {
      const k = readKnown().find((x) => x.number === id)
      if (!k) return null
      const j = unwrap(await client.rpc('track_order', { p_slug: slug, p_number: k.number, p_phone: k.phone })) as Json | null
      return j ? toOrder(j, windowsOf(await info(), (j.fulfillment as 'delivery' | 'pickup') ?? 'delivery')) : null
    },
  }

  const content: ContentService = {
    async getStoreContent(): Promise<StoreContent> {
      // O que a gestão preencher em "A casa" vale; o que estiver vazio continua como marcador entre colchetes.
      const i = await info()
      const hours = (i?.hours ?? {}) as { weekdays?: string; saturday?: string; sunday?: string }
      return {
        ...contentTemplate,
        address: (i?.address as string) || contentTemplate.address,
        whatsapp: (i?.whatsapp as string) || contentTemplate.whatsapp,
        hours: hoursText({ weekdays: hours.weekdays ?? '', saturday: hours.saturday ?? '', sunday: hours.sunday ?? '' }) || contentTemplate.hours,
      }
    },
  }

  // Área de entrega (Q6) ainda não foi definida pelo dono: a regra continua a de exemplo, com a taxa vinda da casa.
  const area: AreaService = {
    async checkCep(cep) {
      const d = digits(cep)
      if (d.startsWith('99')) return { covered: false }
      const fee = Number(((await info())?.delivery_fee_cents as number | undefined) ?? storefront.deliveryFeeCents)
      return { covered: true, feeCents: fee, street: '', district: '' }
    },
  }

  return { catalog, orders, content, area }
}
