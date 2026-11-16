import { customerDetail, customerId, listCustomers, type CustomerRecord } from '@/domain/customers'
import type { FinancialEntry } from '@/domain/finance'
import type { CustomerAdminService } from '@/services/types'
import type { AdminContext } from './context'
import { toOrder } from './orders'

type OrderWithItems = Parameters<typeof toOrder>[0]
const ORDERS = '*, order_items(product_id, name, unit, qty, unit_price_cents)'
const monthYear = (d: string | null) => (d ? `${d.slice(5, 7)}/${d.slice(0, 4)}` : null)

/** Clientes sobre o Supabase: o cadastro vem de `customers` (criado a cada pedido) e o histórico, dos pedidos da loja e do balcão. */
export function createSupabaseCustomers(ctx: AdminContext): CustomerAdminService {
  const { client } = ctx

  async function load() {
    const est = await ctx.establishment()
    const [cs, os, fiado] = await Promise.all([
      client.from('customers').select('phone, name, since, notes, channel_note, baseline_orders, baseline_spent_cents, baseline_products').eq('establishment_id', est),
      client.from('orders').select(ORDERS).eq('establishment_id', est).neq('status', 'cancelled').order('created_at', { ascending: false }).limit(2000),
      client.from('financial_entries').select('id, description, amount_cents, paid_cents, due_at, paid_at, tag, direction').eq('establishment_id', est).eq('direction', 'receivable').eq('tag', 'Fiado').is('paid_at', null),
    ])
    if (cs.error) throw new Error(cs.error.message)
    const records: CustomerRecord[] = (cs.data ?? []).map((c) => ({
      phone: c.phone, name: c.name, since: monthYear(c.since), notes: c.notes, channelNote: c.channel_note,
      baseline: { orders: Number(c.baseline_orders), spentCents: Number(c.baseline_spent_cents), products: (c.baseline_products ?? {}) as Record<string, number> },
    }))
    const orders = ((os.data ?? []) as unknown as OrderWithItems[]).filter((o) => o.contact_phone).map(toOrder)
    const entries = (fiado.data ?? []).map((e) => ({ id: e.id, direction: e.direction, description: e.description, amountCents: Number(e.amount_cents), paidCents: Number(e.paid_cents), dueAt: e.due_at, paidAt: e.paid_at, tag: e.tag })) as unknown as FinancialEntry[]
    return { est, records, orders, entries }
  }

  return {
    async list(query = '') {
      const { records, orders, entries } = await load()
      return listCustomers(records, orders, entries, new Date(), query)
    },
    async get(id) {
      const { est, records, orders, entries } = await load()
      const { data: prods } = await client.from('products').select('id, name, unit').eq('establishment_id', est)
      const names = new Map((prods ?? []).map((p) => [p.id, p.unit ? `${p.name} ${p.unit}` : p.name]))
      return customerDetail(id, records, orders, entries, new Date(), (pid) => names.get(pid) ?? pid)
    },
    async saveNotes(id, notes) {
      const est = await ctx.establishment()
      const { data } = await client.from('customers').select('id, phone').eq('establishment_id', est)
      const known = (data ?? []).find((c) => customerId(c.phone) === id)
      if (!known) throw new Error('not_found')
      const { error } = await client.from('customers').update({ notes }).eq('id', known.id)
      if (error) throw new Error(error.message)
    },
  }
}
