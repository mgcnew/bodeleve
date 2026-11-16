// Pedidos da loja no banco: `place_order` cria (preço e taxa são calculados no servidor) e
// `track_order` acompanha pelo número e pelo celular informado, sem exigir conta (H-L12).
import { STORE_SLUG } from '@/config/hypotheses'
import type { Order, OrderStatus } from '@/domain/order'
import { readJSON, writeJSON } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { NewOrder } from './orders'

const KEY = 'bodeleve.pedidos.remotos'
type Saved = { number: string; phone: string }

const saved = () => readJSON<Saved[]>(KEY, [])

type Public = {
  number: string
  status: string
  fulfillment: 'delivery' | 'pickup' | 'counter'
  created_at: string
  contact: { name: string; phone: string }
  address: { street?: string; number?: string; complement?: string; district?: string; cep?: string; reference?: string } | null
  window: { id?: string; label?: string; detail?: string } | null
  delivery_fee_cents: number
  payment: { method: 'pix' | 'card_on_delivery' | 'cash' | 'debit' | 'credit'; change_for_cents: number | null }
  delivery_code: string
  eta_label: string | null
  courier_name: string | null
  step_times: Record<string, string> | null
  items: { slug: string | null; name: string; qty: number; unit_price_cents: number }[]
}

const statusMap: Record<string, OrderStatus> = {
  received: 'received',
  preparing: 'preparing',
  ready_for_delivery: 'preparing',
  out_for_delivery: 'out_for_delivery',
  ready_for_pickup: 'ready_for_pickup',
  delivered: 'delivered',
  picked_up: 'picked_up',
  completed: 'delivered',
  cancelled: 'cancelled',
}

/** "14h52" do banco → data de hoje com essa hora (o design só mostra a hora) */
function timeToIso(label: string, createdAt: string) {
  const m = /^(\d{1,2})h(\d{2})$/.exec(label)
  if (!m) return createdAt
  const d = new Date(createdAt)
  d.setHours(Number(m[1]), Number(m[2]), 0, 0)
  return d.toISOString()
}

export function fromPublic(p: Public): Order {
  const status = statusMap[p.status] ?? 'received'
  const times: Order['statusTimes'] = {}
  for (const [k, v] of Object.entries(p.step_times ?? {})) {
    const s = statusMap[k]
    if (s && v) times[s] = timeToIso(v, p.created_at)
  }
  return {
    id: p.number,
    number: p.number,
    createdAt: p.created_at,
    status,
    statusTimes: times,
    fulfillment: p.fulfillment === 'pickup' ? 'pickup' : 'delivery',
    address: p.address
      ? { cep: p.address.cep ?? '', street: p.address.street ?? '', number: p.address.number ?? '', complement: p.address.complement ?? '', district: p.address.district ?? '', reference: p.address.reference ?? '' }
      : null,
    windowLabel: [p.window?.label, p.window?.detail].filter(Boolean).join(' · '),
    estimatedAt: null,
    etaLabel: p.eta_label,
    courierNote: p.courier_name ? `com ${p.courier_name}` : null,
    payment: p.payment.method === 'cash' ? 'cash' : p.payment.method === 'pix' ? 'pix' : 'card_on_delivery',
    changeForCents: p.payment.change_for_cents,
    contact: p.contact,
    items: p.items.map((i) => ({ productId: i.slug ?? '', name: i.name, quantity: i.qty, unitPriceCents: i.unit_price_cents })),
    feeCents: p.delivery_fee_cents,
    deliveryCode: p.delivery_code,
  }
}

/** Códigos de erro das funções (`raise exception`) viram mensagens para a pessoa */
export function orderErrorMessage(e: unknown) {
  const code = String((e as { message?: string })?.message ?? '')
  if (code.startsWith('out_of_stock:')) return `${code.split(':')[1]} acabou. Tire da sacola ou diminua a quantidade.`
  if (code === 'unknown_product') return 'Algum produto da sacola saiu do catálogo. Confira a sacola e tente de novo.'
  if (code === 'invalid_address') return 'Confira o endereço: rua, número e bairro são obrigatórios.'
  if (code === 'invalid_contact') return 'Confira o nome e o celular com DDD.'
  return 'Não foi possível enviar o pedido. Nada foi cobrado. Tente de novo.'
}

export async function createRemoteOrder(input: NewOrder, windowId: string): Promise<Order> {
  const { data, error } = await supabase!.rpc('place_order', {
    p_slug: STORE_SLUG,
    p_order: {
      contact: input.contact,
      fulfillment: input.fulfillment,
      address: input.address,
      windowId,
      payment: { method: input.payment, changeForCents: input.changeForCents },
      items: input.items.map((i) => ({ slug: i.productId, qty: i.quantity })),
    },
  })
  if (error) throw error
  const order = fromPublic(data as Public)
  writeJSON(KEY, [{ number: order.number, phone: input.contact.phone }, ...saved().filter((s) => s.number !== order.number)])
  return order
}

async function track(s: Saved): Promise<Order | null> {
  const { data, error } = await supabase!.rpc('track_order', { p_slug: STORE_SLUG, p_number: s.number, p_phone: s.phone })
  if (error || !data) return null
  return fromPublic(data as Public)
}

export async function listRemoteOrders(): Promise<Order[]> {
  const found = await Promise.all(saved().map(track))
  return found.filter((o): o is Order => o !== null)
}

export async function getRemoteOrder(number: string): Promise<Order | null> {
  const s = saved().find((x) => x.number === number)
  return s ? track(s) : null
}
