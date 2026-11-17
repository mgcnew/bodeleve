// Pedidos da gestão no banco. As telas continuam lendo `staffOrdersStore`; com o Supabase ligado
// ele é um cache alimentado aqui (busca, Realtime e atualização a cada 15 s) e as ações chamam
// as funções `order_*` do banco, que fazem a baixa por lote, a conferência e o aviso ao cliente.
import type { StaffOrder, StaffOrderItem, StaffOrderStatus } from '@/domain/staffOrder'
import { refreshCouriers, refreshPeople } from './peopleRemote'
import { supabase } from '@/lib/supabase'
import { staffOrdersStore } from './orders'

type Row = {
  id: string
  number: string
  fulfillment: 'delivery' | 'pickup' | 'counter'
  status: string
  customer_id: string | null
  contact_name: string
  contact_phone: string
  address: { street?: string; number?: string; complement?: string; district?: string } | null
  delivery_window: { label?: string; detail?: string } | null
  delivery_fee_cents: number
  payment_method: string
  payment_paid: boolean
  delivery_code: string | null
  courier_name: string | null
  created_at: string
  customers: { since?: string } | { since?: string }[] | null
  order_items: {
    id: string
    product_id: string | null
    name: string
    unit: string | null
    qty: number
    unit_price_cents: number
    lots: { code?: string; lot_code?: string; expires_at?: string; expiry?: string }[] | null
    products: { slug?: string } | { slug?: string }[] | null
  }[]
  deliveries: { status: string; courier_id: string | null; couriers: { name: string } | { name: string }[] | null }[] | null
}

const statusMap: Record<string, StaffOrderStatus | null> = {
  received: 'new',
  preparing: 'separating',
  ready_for_delivery: 'ready',
  ready_for_pickup: 'ready',
  out_for_delivery: 'en_route',
  delivered: 'delivered',
  picked_up: 'delivered',
  completed: 'delivered',
  cancelled: null,
}

const paymentLabels: Record<string, string> = { pix: 'Pix', card_on_delivery: 'Cartão na entrega', cash: 'Dinheiro na entrega', debit: 'Débito', credit: 'Crédito' }
const one = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] : v) ?? null

/** `checked` é só estado da tela (conferência item a item); vem do que já estava no cache */
function toStaff(r: Row, previous: StaffOrder | undefined): StaffOrder | null {
  const status = statusMap[r.status]
  if (!status) return null
  const items: StaffOrderItem[] = r.order_items.map((i) => {
    const lot = i.lots?.[0]
    return {
      productId: one(i.products)?.slug ?? i.id,
      name: i.name,
      qtyLabel: `${i.qty} ${i.unit ?? 'un'}`,
      quantity: Number(i.qty),
      unitPriceCents: Number(i.unit_price_cents),
      lot: lot?.code ?? lot?.lot_code ?? null,
      lotExpiry: lot?.expires_at ?? lot?.expiry ?? null,
    }
  })
  // a entrega que ainda vale: a última não entregue nem devolvida
  const delivery = (r.deliveries ?? []).find((d) => !['delivered', 'returned'].includes(d.status)) ?? null
  const courierOf = one(delivery?.couriers)?.name ?? null
  const a = r.address
  return {
    id: r.id,
    number: r.number,
    createdAt: r.created_at,
    status,
    customer: { id: r.customer_id ?? r.id, name: r.contact_name, phone: r.contact_phone, since: one(r.customers)?.since ?? r.created_at, orderCount: 1 },
    fulfillment: r.fulfillment === 'pickup' ? 'pickup' : 'delivery',
    address: a ? { line1: [`${a.street ?? ''}, ${a.number ?? ''}`, a.complement].filter(Boolean).join(' · '), line2: a.district ?? '' } : null,
    windowLabel: [r.delivery_window?.label, r.delivery_window?.detail].filter(Boolean).join(' · '),
    items,
    checked: previous && previous.items.length === items.length ? previous.checked : items.map(() => status !== 'new' && status !== 'separating'),
    feeCents: Number(r.delivery_fee_cents),
    paymentLabel: paymentLabels[r.payment_method] ?? r.payment_method,
    paid: r.payment_paid,
    courierName: r.courier_name ?? (delivery && delivery.status !== 'published' ? courierOf : null),
    deliveryCode: r.delivery_code ?? '',
    deliveryNote:
      delivery?.status === 'published'
        ? 'publicado para parceiros'
        : delivery?.status === 'reserved'
          ? `reservado para ${courierOf ?? 'o entregador'}`
          : delivery?.status === 'assigned'
            ? `atribuído a ${courierOf ?? 'o entregador'}`
            : undefined,
    courierStage: delivery?.status === 'accepted' ? 'accepted' : undefined,
    // a função do banco confere pelos ids dos produtos, na mesma ordem dos itens
    itemIds: r.order_items.map((i) => i.product_id ?? ''),
  }
}

const SELECT =
  'id, number, fulfillment, status, customer_id, contact_name, contact_phone, address, delivery_window, delivery_fee_cents, payment_method, payment_paid, delivery_code, courier_name, created_at, customers(since), order_items(id, product_id, name, unit, qty, unit_price_cents, lots, products(slug)), deliveries(status, courier_id, couriers(name))'

let loading: Promise<void> | null = null
let rerun: Promise<void> | null = null

export async function refreshStaffOrders(): Promise<void> {
  if (!supabase) return
  if (loading) {
    // uma busca em andamento pode ter começado antes da ação que pediu esta: refaz logo depois dela
    rerun ??= loading.catch(() => undefined).then(() => {
      rerun = null
      return refreshStaffOrders()
    })
    return rerun
  }
  loading = (async () => {
    const { data, error } = await supabase!.from('orders').select(SELECT).order('created_at', { ascending: false }).limit(200)
    if (error || !data) return
    const before = new Map(staffOrdersStore.get().map((o) => [o.id, o]))
    const next = (data as unknown as Row[]).map((r) => toStaff(r, before.get(r.id))).filter((o): o is StaffOrder => o !== null)
    staffOrdersStore.set(next)
  })().finally(() => {
    loading = null
  })
  return loading
}

/** Começa a manter o cache em dia; devolve a função que para */
export function startStaffSync() {
  if (!supabase) return () => undefined
  void refreshStaffOrders()
  void refreshPeople()
  const timer = setInterval(() => {
    void refreshStaffOrders()
    void refreshPeople()
  }, 15_000)
  const channel = supabase
    .channel('gestao-pedidos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => void refreshStaffOrders())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => {
      void refreshStaffOrders()
      void refreshCouriers()
    })
    .subscribe()
  return () => {
    clearInterval(timer)
    void supabase!.removeChannel(channel)
  }
}

async function call(fn: string, args: Record<string, unknown>) {
  const { error } = await supabase!.rpc(fn, args)
  if (error) throw error
  await refreshStaffOrders()
}

export const remoteAccept = (id: string) => call('order_accept', { p_order: id })
export const remoteMarkReady = (id: string, checkedItemIds: string[]) => call('order_mark_ready', { p_order: id, p_checked: checkedItemIds })
export const remoteUndoReady = (id: string) => call('order_undo_ready', { p_order: id })
export const remoteCompletePickup = (id: string) => call('order_complete_pickup', { p_order: id })
