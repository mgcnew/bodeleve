import { storefront } from '@/config/storefront'
import type { Address, Order, OrderStatus, PaymentMethod, TimeWindow } from '@/domain/types'
import type { AdminOrder, AdminOrderService } from '@/services/types'
import { unwrap } from '../client'
import type { Database } from '../database.types'
import type { AdminContext } from './context'

type OrderDb = Database['public']['Tables']['orders']['Row'] & { order_items: Array<{ product_id: string | null; name: string; unit: string; qty: number; unit_price_cents: number }> }

const OPEN: OrderStatus[] = ['received', 'preparing', 'ready_for_delivery', 'ready_for_pickup', 'out_for_delivery']
const COLUMNS = '*, order_items(product_id, name, unit, qty, unit_price_cents)'
const clock = (s: string) => s.replace(/(\d{1,2}):(\d{2})/g, '$1h$2')

function windowOf(o: OrderDb): TimeWindow {
  const w = (o.delivery_window ?? {}) as Partial<TimeWindow>
  if (w.label) return w as TimeWindow
  const list: TimeWindow[] = o.fulfillment === 'delivery' ? [...storefront.deliveryWindows] : [...storefront.pickupWindows]
  return list.find((x) => x.id === w.id) ?? list[0]
}

/** Pedido da loja como as telas da Gestão conhecem. O identificador do item é o do produto no banco (é com ele que o pedido é conferido). */
export function toOrder(o: OrderDb): Order {
  const a = (o.address ?? null) as Record<string, string> | null
  const address: Address | null = a ? { cep: a.cep ?? '', street: a.street ?? '', number: a.number ?? '', complement: a.complement ?? '', district: a.district ?? '', reference: a.reference ?? '' } : null
  const steps = (o.step_times ?? {}) as Record<string, string>
  return {
    id: o.number, channel: o.channel, createdAt: o.created_at, status: o.status as OrderStatus, fulfillment: o.fulfillment as Order['fulfillment'],
    items: [...o.order_items].sort((x, y) => x.name.localeCompare(y.name)).map((i) => ({ productId: i.product_id ?? '', name: i.name, unit: i.unit, unitPriceCents: Number(i.unit_price_cents), qty: Number(i.qty) })),
    subtotalCents: Number(o.subtotal_cents), deliveryFeeCents: Number(o.delivery_fee_cents), totalCents: Number(o.total_cents),
    contact: { name: o.contact_name, phone: o.contact_phone }, address, window: windowOf(o),
    payment: { method: (o.payment_method ?? 'pix') as PaymentMethod, changeForCents: o.change_for_cents == null ? null : Number(o.change_for_cents), paid: o.payment_paid },
    deliveryCode: o.delivery_code ?? '', etaLabel: o.eta_label ? clock(o.eta_label) : null, courierName: o.courier_name,
    stepTimes: Object.fromEntries(Object.entries(steps).map(([k, v]) => [k, clock(v)])) as Order['stepTimes'],
  }
}

export function createSupabaseOrdersAdmin(ctx: AdminContext): AdminOrderService {
  const { client } = ctx

  async function decorate(rows: OrderDb[]): Promise<AdminOrder[]> {
    if (rows.length === 0) return []
    // Lote sugerido: o que vence primeiro (H-G11).
    const products = [...new Set(rows.flatMap((r) => r.order_items.map((i) => i.product_id).filter((x): x is string => !!x)))]
    const nextLot = new Map<string, { code: string; expiresAt: string | null }>()
    if (products.length) {
      const { data } = await client.from('lot_balances').select('product_id, code, expires_at, received_at, balance').in('product_id', products).gt('balance', 0)
        .order('expires_at', { ascending: true, nullsFirst: false }).order('received_at', { ascending: true })
      for (const l of data ?? []) if (l.product_id && l.code && !nextLot.has(l.product_id)) nextLot.set(l.product_id, { code: l.code, expiresAt: l.expires_at })
    }
    const ids = [...new Set(rows.map((r) => r.customer_id).filter((x): x is string => !!x))]
    const customers = new Map<string, { since: string | null; baseline: number }>()
    const placed = new Map<string, number>()
    if (ids.length) {
      const { data: cs } = await client.from('customers').select('id, since, baseline_orders').in('id', ids)
      for (const c of cs ?? []) customers.set(c.id, { since: c.since, baseline: Number(c.baseline_orders) })
      const { data: os } = await client.from('orders').select('customer_id').in('customer_id', ids).neq('status', 'cancelled')
      for (const o of os ?? []) if (o.customer_id) placed.set(o.customer_id, (placed.get(o.customer_id) ?? 0) + 1)
    }
    return rows.map((r) => {
      const c = r.customer_id ? customers.get(r.customer_id) : undefined
      return {
        ...toOrder(r),
        items: toOrder(r).items.map((i) => ({ ...i, lot: nextLot.get(i.productId) ?? null })),
        customerSince: c?.since ?? null,
        customerOrderCount: (c?.baseline ?? 0) + (r.customer_id ? placed.get(r.customer_id) ?? 0 : 0),
      }
    })
  }

  async function uuidOf(number: string): Promise<string> {
    const est = await ctx.establishment()
    const { data } = await client.from('orders').select('id').eq('establishment_id', est).eq('number', number).eq('channel', 'online').maybeSingle()
    if (!data) throw new Error('not_found')
    return data.id
  }

  async function get(number: string): Promise<AdminOrder | null> {
    const est = await ctx.establishment()
    const { data, error } = await client.from('orders').select(COLUMNS).eq('establishment_id', est).eq('number', number).eq('channel', 'online').maybeSingle()
    if (error) throw new Error(error.message)
    return data ? (await decorate([data as unknown as OrderDb]))[0] : null
  }

  return {
    async listOpen() {
      const est = await ctx.establishment()
      const { data, error } = await client.from('orders').select(COLUMNS).eq('establishment_id', est).eq('channel', 'online').in('status', OPEN).order('created_at', { ascending: true })
      if (error) throw new Error(error.message)
      return decorate((data ?? []) as unknown as OrderDb[])
    },
    get,
    async accept(number) {
      unwrap(await client.rpc('order_accept', { p_order: await uuidOf(number) }))
      return (await get(number))!
    },
    async markReady(number, checkedProductIds) {
      unwrap(await client.rpc('order_mark_ready', { p_order: await uuidOf(number), p_checked: checkedProductIds }))
      return (await get(number))!
    },
    async undoReady(number) {
      unwrap(await client.rpc('order_undo_ready', { p_order: await uuidOf(number) }))
      return (await get(number))!
    },
  }
}
