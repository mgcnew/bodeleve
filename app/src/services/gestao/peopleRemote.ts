// Entregadores e atribuição de entregas no banco. A gestão lê `couriers` e as entregas em andamento
// (`deliveries`) e atribui com `delivery_assign` / `delivery_unassign`, que só aceitam pedido pronto,
// entregador próprio da casa e uma entrega ativa por pedido.
import type { Courier, Customer, Item, TeamMember } from '@/domain/backoffice'
import type { Category } from '@/domain/catalog'
import { supabase } from '@/lib/supabase'
import { getEstablishmentId, refreshBackoffice } from './backofficeRemote'
import type { Role } from '@/permissions/roles'
import { categoriesStore, courierRegistryStore, couriersStore, customersStore, establishmentStore, teamStore } from './people'
import { refreshStaffOrders } from './ordersRemote'

type CourierRow = { id: string; name: string; kind: 'own' | 'partner'; available: boolean; phone: string; vehicle: string; active: boolean }
type ActiveDelivery = { courier_id: string | null; status: string; orders: { number: string } | { number: string }[] | null }

const one = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] : v) ?? null

let loading: Promise<void> | null = null
let rerun: Promise<void> | null = null

export async function refreshCouriers(): Promise<void> {
  if (!supabase) return
  if (loading) {
    rerun ??= loading.catch(() => undefined).then(() => {
      rerun = null
      return refreshCouriers()
    })
    return rerun
  }
  loading = (async () => {
    const [cs, ds] = await Promise.all([
      supabase!.from('couriers').select('id, name, kind, available, phone, vehicle, active').order('name'),
      supabase!.from('deliveries').select('courier_id, status, orders(number)').in('status', ['reserved', 'assigned', 'accepted', 'en_route']),
    ])
    if (cs.error || !cs.data) return
    const active = ((ds.data ?? []) as unknown as ActiveDelivery[]).filter((d) => d.courier_id)
    const all = cs.data as CourierRow[]
    courierRegistryStore.set(all.map((c) => ({ id: c.id, name: c.name, kind: c.kind, phone: c.phone, vehicle: c.vehicle, active: c.active })))
    const rows = all.filter((c) => c.active)

    const own: Courier[] = rows
      .filter((c) => c.kind === 'own')
      .map((c) => {
        const mine = active.filter((d) => d.courier_id === c.id)
        const route = mine.find((d) => d.status === 'en_route')
        const waiting = mine.filter((d) => d.status !== 'en_route').map((d) => `#${one(d.orders)?.number ?? ''}`)
        if (route) return { id: c.id, name: c.name, kind: 'own', status: 'en_route', note: `em rota com #${one(route.orders)?.number ?? ''}${waiting.length ? ` · depois ${waiting.join(', ')}` : ''}` }
        if (!c.available) return { id: c.id, name: c.name, kind: 'own', status: 'offline', note: 'indisponível' }
        return { id: c.id, name: c.name, kind: 'own', status: 'available', note: waiting.length ? `com ${waiting.join(', ')} para sair` : 'na loja' }
      })
    const online = rows.filter((c) => c.kind === 'partner' && c.available).length
    const partners: Courier[] = rows.some((c) => c.kind === 'partner')
      ? [{ id: 'parceiros', name: 'Parceiros', kind: 'partner', status: 'online', note: `${online} com o app aberto agora` }]
      : []
    couriersStore.set([...own, ...partners])
  })().finally(() => {
    loading = null
  })
  return loading
}

async function afterChange() {
  await Promise.all([refreshStaffOrders(), refreshCouriers()])
}

/** `courierId` nulo publica a entrega para os parceiros */
export async function remoteAssign(orderId: string, courierId: string | null) {
  const { error } = await supabase!.rpc('delivery_assign', { p_order: orderId, p_courier: courierId })
  if (error) throw error
  await afterChange()
}

export async function remoteUnassign(orderId: string) {
  const { error } = await supabase!.rpc('delivery_unassign', { p_order: orderId })
  if (error) throw error
  await afterChange()
}

export function deliveryErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg.includes('already_assigned')) return 'Este pedido já tem um entregador. A tela foi atualizada.'
  if (msg.includes('not_ready')) return 'O pedido ainda não está pronto para sair.'
  if (msg.includes('no_assignment')) return 'Não há envio para desfazer, ou o entregador já saiu com o pedido.'
  if (msg.includes('forbidden')) return 'Seu papel não permite esta ação.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}

// ---------- categorias ----------
type CategoryRow = { id: string; slug: string; name: string; is_internal: boolean | null }

export async function refreshCategories() {
  if (!supabase) return
  const { data, error } = await supabase.from('categories').select('id, slug, name, is_internal').order('position')
  if (error || !data) return
  const list: Category[] = (data as CategoryRow[]).filter((c) => !c.is_internal).map((c) => ({ id: c.slug, name: c.name }))
  categoriesStore.set(list)
}

const slugify = (name: string) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export async function remoteAddCategory(name: string) {
  const { data: last } = await supabase!.from('categories').select('position').order('position', { ascending: false }).limit(1).maybeSingle()
  const { error } = await supabase!.from('categories').insert({
    establishment_id: await getEstablishmentId(),
    slug: slugify(name) || `cat-${Date.now()}`,
    name,
    position: Number(last?.position ?? 0) + 1,
  })
  if (error) throw error
  await refreshCategories()
}

// ---------- produtos ----------
const originCodes: Record<string, string> = { house_made: 'house', bodeleve_brand: 'brand', third_party: 'resale' }
const DESCRIPTION_PLACEHOLDER = '[DESCRIÇÃO DO PRODUTO]'

/**
 * Grava o cadastro do produto. O nome mostrado junta o tamanho (`details.size`); se o nome mudar, vale o novo
 * e o tamanho antigo sai. Produto "por peso" usa o preço como preço do quilo (`weight_price_cents`), que é o que o
 * PDV cobra: ver "Depende de você" em docs/IMPLEMENTATION.md.
 */
export async function remoteSaveProduct(before: Item, next: Item) {
  const { data: row, error: readError } = await supabase!.from('products').select('details, categories(slug)').eq('id', before.dbId!).single()
  if (readError) throw readError
  const { data: cat } = next.categoryId ? await supabase!.from('categories').select('id').eq('slug', next.categoryId).maybeSingle() : { data: null }
  const raw = next.itemType === 'raw_material'
  const patch: Record<string, unknown> = {
    category_id: cat?.id ?? null,
    item_type: next.itemType,
    min_stock: next.minStock,
    tracks_expiry: next.tracksLots,
    price_cents: raw ? null : next.priceCents,
    weight_price_cents: !raw && next.soldByWeight ? next.priceCents : null,
    is_published: raw ? false : next.published,
    is_favorite_pos: raw ? false : next.favoritePos,
    sold_by_weight: raw ? false : next.soldByWeight,
  }
  if (!raw) patch.origin = originCodes[next.origin ?? 'third_party']
  if (next.description !== before.description && next.description && next.description !== DESCRIPTION_PLACEHOLDER) patch.description = next.description
  if (next.name !== before.name) {
    const details = { ...((row?.details as Record<string, unknown> | null) ?? {}) }
    delete details.size
    patch.name = next.name.trim()
    patch.details = details
  }
  const { error } = await supabase!.from('products').update(patch).eq('id', before.dbId!)
  if (error) throw error
  await refreshBackoffice()
}

/** Cria o produto. O `slug` (endereço na loja) nasce do nome e ganha -2, -3 se já existir. */
export async function remoteCreateProduct(next: Item): Promise<string> {
  const { data: cat } = next.categoryId ? await supabase!.from('categories').select('id').eq('slug', next.categoryId).maybeSingle() : { data: null }
  const raw = next.itemType === 'raw_material'
  const establishment = await getEstablishmentId()
  const base = slugify(next.name) || `produto-${Date.now()}`
  for (let n = 1; n <= 20; n++) {
    const slug = n === 1 ? base : `${base}-${n}`
    const { error } = await supabase!.from('products').insert({
      establishment_id: establishment,
      slug,
      name: next.name.trim(),
      unit: next.unit,
      item_type: next.itemType,
      origin: raw ? null : originCodes[next.origin ?? 'third_party'],
      category_id: cat?.id ?? null,
      min_stock: next.minStock,
      tracks_expiry: next.tracksLots,
      price_cents: raw ? null : next.priceCents,
      weight_price_cents: !raw && next.soldByWeight ? next.priceCents : null,
      is_published: raw ? false : next.published,
      is_favorite_pos: raw ? false : next.favoritePos,
      sold_by_weight: raw ? false : next.soldByWeight,
      description: next.description && next.description !== DESCRIPTION_PLACEHOLDER ? next.description : '',
    })
    if (!error) {
      await refreshBackoffice()
      return slug
    }
    if (error.code !== '23505') throw error
  }
  throw new Error('duplicate')
}

/** Tira o produto das telas (loja, balcão, estoque) sem apagar o histórico: marca como inativo */
export async function remoteArchiveProduct(item: Item) {
  const { data, error } = await supabase!.from('products').update({ is_active: false, is_published: false, is_favorite_pos: false }).eq('id', item.dbId!).select('id')
  if (error) throw error
  if (!data?.length) throw Object.assign(new Error('forbidden'), { code: '42501' })
  await refreshBackoffice()
}

export function productErrorMessage(e: unknown) {
  const msg = String((e as { message?: string; code?: string })?.message ?? '')
  const code = String((e as { code?: string })?.code ?? '')
  if (code === '42501' || msg.includes('row-level security')) return 'Seu papel não permite editar produtos.'
  if (msg.includes('price') || code === '23514') return 'Confira o preço e os campos do produto.'
  if (msg.includes('duplicate') || code === '23505') return 'Já existe um registro com esse nome.'
  return 'Não foi possível salvar. Nada foi alterado. Tente de novo.'
}

// ---------- fornecedores ----------
export type SupplierInput = { name: string; categories: string; contactName: string; phone: string; email: string; document: string; leadDays: number | null; paymentTerms: string }

const clean = (v: string) => v.trim() || null
const PLACEHOLDER = /^\[.*\]$/

export async function remoteSaveSupplier(input: SupplierInput, id?: string) {
  const row = {
    name: input.name.trim(),
    supplies: input.categories.trim(),
    contact_name: input.contactName.trim(),
    phone: clean(input.phone),
    email: PLACEHOLDER.test(input.email.trim()) ? null : clean(input.email),
    tax_id: PLACEHOLDER.test(input.document.trim()) ? null : clean(input.document),
    lead_time_days: input.leadDays,
    payment_terms: clean(input.paymentTerms),
  }
  if (id) {
    const { data, error } = await supabase!.from('suppliers').update(row).eq('id', id).select('id')
    if (error) throw error
    if (!data?.length) throw Object.assign(new Error('forbidden'), { code: '42501' })
  } else {
    const { error } = await supabase!.from('suppliers').insert({ ...row, establishment_id: await getEstablishmentId() })
    if (error) throw error
  }
  await refreshBackoffice()
}

/** Fornecedor arquivado some das listas, mas os pedidos antigos continuam com o nome dele */
export async function remoteArchiveSupplier(id: string) {
  const { data, error } = await supabase!.from('suppliers').update({ active: false }).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw Object.assign(new Error('forbidden'), { code: '42501' })
  await refreshBackoffice()
}

export function supplierErrorMessage(e: unknown) {
  const code = String((e as { code?: string })?.code ?? '')
  const msg = String((e as { message?: string })?.message ?? '')
  if (code === '42501' || msg.includes('row-level security') || msg === 'forbidden') return 'Seu papel não permite cadastrar fornecedores.'
  return 'Não foi possível salvar. Nada foi alterado. Tente de novo.'
}

// ---------- cadastro de entregadores ----------
export type CourierInput = { name: string; kind: 'own' | 'partner'; phone: string; vehicle: string }

export async function remoteSaveCourier(input: CourierInput, id?: string) {
  const row = { name: input.name.trim(), kind: input.kind, phone: input.phone.trim(), vehicle: input.vehicle.trim() }
  if (id) {
    const { data, error } = await supabase!.from('couriers').update(row).eq('id', id).select('id')
    if (error) throw error
    if (!data?.length) throw Object.assign(new Error('forbidden'), { code: '42501' })
  } else {
    const { error } = await supabase!.from('couriers').insert({ ...row, establishment_id: await getEstablishmentId() })
    if (error) throw error
  }
  await refreshCouriers()
}

/** Entregador inativo perde o acesso ao app e some da atribuição; o histórico de entregas fica */
export async function remoteSetCourierActive(id: string, active: boolean) {
  const { data, error } = await supabase!.from('couriers').update({ active, available: active ? undefined : false }).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw Object.assign(new Error('forbidden'), { code: '42501' })
  await afterChange()
}

export function courierRegistryErrorMessage(e: unknown) {
  const code = String((e as { code?: string })?.code ?? '')
  const msg = String((e as { message?: string })?.message ?? '')
  if (code === '42501' || msg.includes('row-level security') || msg === 'forbidden') return 'Seu papel não permite cadastrar entregadores.'
  return 'Não foi possível salvar. Nada foi alterado. Tente de novo.'
}

// ---------- clientes ----------
type CustomerRow = { id: string; credit_days: number | null; phone: string; name: string; since: string; notes: string | null; channel_note: string | null; baseline_orders: number | null; baseline_spent_cents: number | null; baseline_products: { name: string; times: number }[] | Record<string, never> | null }
type CustomerOrder = {
  customer_id: string | null
  status: string
  channel: string
  created_at: string
  total_cents: number | null
  address: { street?: string; number?: string; complement?: string; district?: string } | null
  order_items: { name: string; qty: number }[]
}

const lastLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  return d.toDateString() === today.toDateString() ? 'último hoje' : `último ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
}

export async function refreshCustomers() {
  if (!supabase) return
  const [cs, os, owed] = await Promise.all([
    supabase.from('customers').select('id, credit_days, phone, name, since, notes, channel_note, baseline_orders, baseline_spent_cents, baseline_products'),
    supabase.from('orders').select('customer_id, status, channel, created_at, total_cents, address, order_items(name, qty)').not('customer_id', 'is', null).order('created_at', { ascending: false }).limit(1000),
    // o que cada cliente ainda deve: contas a receber em aberto ligadas a ele
    supabase.from('financial_entries').select('customer_id, amount_cents, paid_cents').eq('direction', 'receivable').is('paid_at', null).not('customer_id', 'is', null),
  ])
  const owes = new Map<string, number>()
  for (const e of (owed.data ?? []) as { customer_id: string; amount_cents: number; paid_cents: number }[]) owes.set(e.customer_id, (owes.get(e.customer_id) ?? 0) + Number(e.amount_cents) - Number(e.paid_cents))
  if (cs.error || !cs.data) return
  const orders = ((os.data ?? []) as unknown as CustomerOrder[]).filter((o) => o.status !== 'cancelled')
  const list: Customer[] = (cs.data as unknown as CustomerRow[]).map((c) => {
    const mine = orders.filter((o) => o.customer_id === c.id)
    const items = new Map<string, number>()
    for (const p of Array.isArray(c.baseline_products) ? c.baseline_products : []) items.set(p.name, (items.get(p.name) ?? 0) + Number(p.times))
    for (const o of mine) for (const i of o.order_items) items.set(i.name, (items.get(i.name) ?? 0) + 1)
    const a = mine.find((o) => o.address)?.address
    const counter = mine.length > 0 && mine.every((o) => o.channel === 'pos')
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: a ? [`${a.street ?? ''}, ${a.number ?? ''}`, a.complement].filter(Boolean).join(' · ') + (a.district ? ` — ${a.district}` : '') : '—',
      since: c.since,
      channel: c.channel_note || (counter ? 'compra no balcão' : 'compra pela loja online'),
      orderCount: Number(c.baseline_orders ?? 0) + mine.length,
      totalCents: Number(c.baseline_spent_cents ?? 0) + mine.reduce((n, o) => n + Number(o.total_cents ?? 0), 0),
      fiadoCents: owes.get(c.id) ?? 0,
      creditDays: c.credit_days,
      lastOrderLabel: mine[0] ? lastLabel(mine[0].created_at) : 'sem pedidos',
      topItems: [...items].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([name, times]) => ({ name, times })),
      history: [],
      notes: c.notes ?? '',
    }
  })
  list.sort((x, y) => y.orderCount - x.orderCount || x.name.localeCompare(y.name))
  customersStore.set(list)
}

export async function remoteSaveCustomerNotes(customerId: string, notes: string) {
  const { error } = await supabase!.from('customers').update({ notes }).eq('id', customerId)
  if (error) throw error
}

/** Cliente cadastrado à mão (pelo celular, como a loja faz); celular repetido o banco recusa */
export async function remoteSetCustomerCredit(customerId: string, creditDays: number | null) {
  const { data, error } = await supabase!.from('customers').update({ credit_days: creditDays }).eq('id', customerId).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('forbidden')
  await refreshCustomers()
}

export async function remoteCreateCustomer(input: { name: string; phone: string; notes: string; creditDays?: number | null }) {
  const { error } = await supabase!.from('customers').insert({
    establishment_id: await getEstablishmentId(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    notes: input.notes.trim(),
    since: new Date().toISOString().slice(0, 10),
    channel_note: 'cadastrado na gestão',
    credit_days: input.creditDays ?? null,
  })
  if (error) throw error
  await refreshCustomers()
}

export function customerErrorMessage(e: unknown) {
  const code = String((e as { code?: string })?.code ?? '')
  const msg = String((e as { message?: string })?.message ?? '')
  if (code === '23505') return 'Já existe um cliente com esse celular. Procure na lista pelo número.'
  if (code === '23514') return 'O prazo precisa ser de 1 a 365 dias.'
  if (code === '42501' || msg.includes('row-level security') || msg === 'forbidden') return 'Seu papel não permite alterar clientes.'
  return 'Não foi possível salvar. Nada foi alterado. Tente de novo.'
}

// ---------- a casa ----------
type EstablishmentRow = { name: string; cnpj: string | null; address: string | null; whatsapp: string | null; hours: { weekdays?: string; saturday?: string; sunday?: string } | null }

export async function refreshEstablishment() {
  if (!supabase) return
  const { data, error } = await supabase.from('establishments').select('name, cnpj, address, whatsapp, hours').limit(1).maybeSingle()
  if (error || !data) return
  const r = data as EstablishmentRow
  establishmentStore.set({
    name: r.name,
    cnpj: r.cnpj ?? '',
    address: r.address ?? '',
    whatsapp: r.whatsapp ?? '',
    hours: { weekdays: r.hours?.weekdays ?? '', saturday: r.hours?.saturday ?? '', sunday: r.hours?.sunday ?? '' },
  })
}

/** O banco não dá erro quando a regra de acesso barra a gravação: atualiza zero linhas. Aqui isso vira "forbidden". */
export async function remoteSaveEstablishment(form: ReturnType<typeof establishmentStore.get>) {
  const { data, error } = await supabase!
    .from('establishments')
    .update({ name: form.name.trim(), cnpj: form.cnpj.trim() || null, address: form.address.trim() || null, whatsapp: form.whatsapp.trim() || null, hours: form.hours })
    .eq('id', await getEstablishmentId())
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('forbidden')
  await refreshEstablishment()
}

// ---------- equipe ----------
type MembershipRow = { id: string; email: string | null; display_name: string | null; role: Role; status: 'active' | 'invited' | 'disabled'; note: string | null }

export async function refreshTeam() {
  if (!supabase) return
  const { data, error } = await supabase.from('memberships').select('id, email, display_name, role, status, note').neq('status', 'disabled').order('created_at')
  if (error || !data) return
  const order: Role[] = ['owner', 'manager', 'clerk', 'production', 'courier']
  const list: TeamMember[] = (data as MembershipRow[])
    .map((m) => ({
      id: m.id,
      name: m.display_name || (m.email ?? '').split('@')[0] || 'Sem nome',
      role: m.role,
      detail: m.email || m.note || '',
      pending: m.status === 'invited',
    }))
    .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role))
  teamStore.set(list)
}

/** Registra o convite (status "invited"); o e-mail só sai quando o envio de mensagens estiver ligado (P8) */
export async function remoteInvite(email: string, role: Role) {
  const clean = email.trim().toLowerCase()
  const { data, error } = await supabase!
    .from('memberships')
    .insert({ establishment_id: await getEstablishmentId(), email: clean, display_name: clean.split('@')[0], role, status: 'invited' })
    .select('id')
  if (error) throw error
  if (!data?.length) throw new Error('forbidden')
  await refreshTeam()
}

async function changeMembership(change: () => PromiseLike<{ data: { id: string }[] | null; error: unknown }>) {
  const { data, error } = await change()
  if (error) throw error
  if (!data?.length) throw new Error('forbidden')
  await refreshTeam()
}

export const remoteChangeRole = (id: string, role: Role) => changeMembership(() => supabase!.from('memberships').update({ role }).eq('id', id).select('id'))

/** Tira o acesso sem apagar o histórico (status "disabled"); a pessoa some da lista */
export const remoteDisableMember = (id: string) => changeMembership(() => supabase!.from('memberships').update({ status: 'disabled' }).eq('id', id).select('id'))

/** Convite que ainda não foi aceito: apaga o registro */
export const remoteCancelInvite = (id: string) => changeMembership(() => supabase!.from('memberships').delete().eq('id', id).eq('status', 'invited').select('id'))

export function teamErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  const code = String((e as { code?: string })?.code ?? '')
  if (msg.includes('forbidden') || code === '42501' || msg.includes('row-level security')) return 'Só o dono pode alterar a casa e a equipe.'
  if (code === '23505' || msg.includes('duplicate')) return 'Esse e-mail já está na equipe.'
  return 'Não foi possível salvar. Nada foi alterado. Tente de novo.'
}

/** Categorias, clientes, a casa e a equipe: busca ao abrir e junto com a atualização periódica */
export async function refreshPeople() {
  await Promise.all([refreshCouriers(), refreshCategories(), refreshCustomers(), refreshEstablishment(), refreshTeam()])
}
