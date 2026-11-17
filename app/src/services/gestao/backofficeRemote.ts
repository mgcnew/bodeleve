// Estoque, lotes, fornecedores e compras no banco. As telas continuam lendo os stores da Gestão;
// com o Supabase ligado eles são caches alimentados aqui, e as ações chamam as funções do banco
// (`stock_adjust`, `stock_count_apply`, `create_purchase_order`, `receive_purchase`...), que fazem a
// baixa pelo lote, a conta a pagar e a trilha de auditoria.
import type { Item, ItemType, Lot, Movement, Purchase, StockUnit, Supplier } from '@/domain/backoffice'
import type { ProductOrigin } from '@/domain/catalog'
import { supabase } from '@/lib/supabase'
import { itemsStore, purchasesStore, stockStore, suppliersStore } from './backoffice'

const one = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] : v) ?? null
const units: StockUnit[] = ['un', 'kg', 'L', 'ml']
const origins: Record<string, ProductOrigin> = { house: 'house_made', brand: 'bodeleve_brand', resale: 'third_party' }

// ---------- estabelecimento ----------
let establishmentId: string | null = null
export async function getEstablishmentId() {
  if (establishmentId) return establishmentId
  const { data, error } = await supabase!.from('memberships').select('establishment_id').eq('status', 'active').limit(1).maybeSingle()
  if (error || !data) throw new Error('sem acesso')
  establishmentId = data.establishment_id as string
  return establishmentId
}

// ---------- leitura ----------
type ProductRow = {
  id: string
  slug: string
  name: string
  unit: string | null
  item_type: ItemType
  origin: 'house' | 'brand' | 'resale' | null
  min_stock: number | null
  tracks_expiry: boolean | null
  supplier_id: string | null
  last_cost_cents: number | null
  price_cents: number | null
  sold_by_weight: boolean | null
  is_published: boolean | null
  is_favorite_pos: boolean | null
  description: string | null
  details: { size?: string } | null
  categories: { slug?: string } | { slug?: string }[] | null
}

const mapItem = (r: ProductRow): Item => ({
  id: r.slug,
  dbId: r.id,
  name: r.details?.size ? `${r.name} ${r.details.size}` : r.name,
  unit: units.includes(r.unit as StockUnit) ? (r.unit as StockUnit) : 'un',
  itemType: r.item_type,
  origin: r.item_type === 'raw_material' ? null : r.origin ? origins[r.origin] : 'third_party',
  categoryId: one(r.categories)?.slug ?? '',
  minStock: Number(r.min_stock ?? 0),
  costCents: Number(r.last_cost_cents ?? 0),
  priceCents: r.price_cents === null ? null : Number(r.price_cents),
  supplierId: r.supplier_id,
  tracksLots: !!r.tracks_expiry,
  soldByWeight: !!r.sold_by_weight,
  published: !!r.is_published,
  favoritePos: !!r.is_favorite_pos,
  description: r.description ?? undefined,
})

const paymentCodes: Record<string, string> = {
  boleto14: 'Boleto, 14 dias após receber',
  pix_on_delivery: 'Pix na entrega',
  cash_on_delivery: 'Dinheiro na entrega',
}

let loading: Promise<void> | null = null

export async function refreshBackoffice() {
  if (!supabase) return
  if (loading) return loading
  loading = (async () => {
    const [prods, lots, moves, sups, pos] = await Promise.all([
      supabase!.from('products').select('id, slug, name, unit, item_type, origin, min_stock, tracks_expiry, supplier_id, last_cost_cents, price_cents, sold_by_weight, is_published, is_favorite_pos, description, details, categories(slug)').eq('is_active', true).order('name'),
      supabase!.from('product_lots').select('id, product_id, code, expires_at, unit_cost_cents, received_at'),
      supabase!.from('stock_movements').select('id, product_id, lot_id, type, qty, at, ref, description, created_by_name').order('at', { ascending: false }).limit(1000),
      supabase!.from('suppliers').select('id, name, supplies, phone, email, tax_id, lead_time_days, payment_terms, created_at, contact_name').eq('active', true).order('name'),
      supabase!.from('purchase_orders').select('id, number, supplier_id, status, payment_term, expected_at, sent_at, received_at, purchase_order_items(id, product_id, qty, unit_cost_cents, received_qty)').order('created_at', { ascending: false }).limit(200),
    ])
    if (prods.error || !prods.data) return
    const productRows = prods.data as unknown as ProductRow[]
    const items = productRows.map(mapItem)
    const slugOf = new Map(productRows.map((r) => [r.id, r.slug]))
    const nameOf = new Map(items.map((i) => [i.dbId, i.name]))

    const lotList: Lot[] = ((lots.data ?? []) as { id: string; product_id: string; code: string; expires_at: string | null; unit_cost_cents: number | null; received_at: string }[]).map((l) => ({
      id: l.id,
      itemId: slugOf.get(l.product_id) ?? '',
      code: l.code,
      expiry: l.expires_at,
      unitCostCents: Number(l.unit_cost_cents ?? 0),
      createdAt: l.received_at,
    }))
    const movements: Movement[] = ((moves.data ?? []) as { id: string; product_id: string; lot_id: string | null; type: Movement['type']; qty: number; at: string; ref: string | null; description: string | null; created_by_name: string | null }[]).map((m) => ({
      id: m.id,
      itemId: slugOf.get(m.product_id) ?? '',
      lotId: m.lot_id,
      type: m.type,
      qty: Number(m.qty),
      at: m.at,
      note: m.description ?? '',
      by: m.created_by_name ?? 'Sistema',
      ref: m.ref,
    }))

    const suppliers: Supplier[] = ((sups.data ?? []) as { id: string; name: string; supplies: string | null; phone: string | null; email: string | null; tax_id: string | null; lead_time_days: number | null; payment_terms: string | null; created_at: string; contact_name: string | null }[]).map((s) => ({
      id: s.id,
      name: s.name,
      categories: s.supplies ?? '',
      contactName: s.contact_name ?? '',
      phone: s.phone ?? '',
      email: s.email || '[E-MAIL]',
      document: s.tax_id || '[CNPJ OU CPF]',
      since: String(new Date(s.created_at).getFullYear()),
      paymentTerms: s.payment_terms ?? '',
      paymentDays: Number(/(\d+)\s*dias?/.exec(s.payment_terms ?? '')?.[1] ?? 0),
      leadTime: s.lead_time_days ? `${s.lead_time_days} dias` : '',
    }))

    const purchases: Purchase[] = ((pos.data ?? []) as { id: string; number: string; supplier_id: string; status: Purchase['status']; payment_term: string | null; expected_at: string | null; sent_at: string | null; received_at: string | null; purchase_order_items: { id: string; product_id: string; qty: number; unit_cost_cents: number | null; received_qty: number | null }[] }[]).map((p) => ({
      id: p.id,
      number: p.number,
      supplierId: p.supplier_id,
      status: p.status,
      sentAt: p.sent_at,
      expectedAt: p.expected_at ?? p.sent_at ?? new Date().toISOString(),
      receivedAt: p.received_at,
      paymentTerms: paymentCodes[p.payment_term ?? ''] ?? p.payment_term ?? '',
      items: p.purchase_order_items.map((i) => ({
        itemId: slugOf.get(i.product_id) ?? '',
        name: nameOf.get(i.product_id) ?? '',
        qty: Number(i.qty),
        unitCostCents: Number(i.unit_cost_cents ?? 0),
        receivedQty: Number(i.received_qty ?? 0),
        lineId: i.id,
      })),
    }))

    itemsStore.set(items)
    stockStore.set({ lots: lotList, movements })
    suppliersStore.set(suppliers)
    purchasesStore.set(purchases)
  })().finally(() => {
    loading = null
  })
  return loading
}

/** Mantém o cache em dia: busca ao abrir, a cada 20 s e depois de cada ação */
export function startBackofficeSync() {
  if (!supabase) return () => undefined
  void refreshBackoffice()
  const timer = setInterval(() => void refreshBackoffice(), 20_000)
  return () => clearInterval(timer)
}

async function rpc<T>(fn: string, args: Record<string, unknown>) {
  const { data, error } = await supabase!.rpc(fn, args)
  if (error) throw error
  await refreshBackoffice()
  return data as T
}

const dbIdOf = (slug: string) => {
  const id = itemsStore.get().find((i) => i.id === slug)?.dbId
  if (!id) throw new Error('not_found')
  return id
}

// ---------- ações de estoque ----------
export type UndoToken = { kind: 'movements'; ids: string[] } | { kind: 'count'; id: string }

export async function remoteAdjust(input: { itemId: string; lotId: string | null; kind: 'loss' | 'internal' | 'correction'; qty: number; reason: string }): Promise<UndoToken> {
  if (!input.lotId) throw new Error('no_lot')
  const id = await rpc<string>('stock_adjust', {
    p_product: dbIdOf(input.itemId),
    p_lot: input.lotId,
    p_qty: Math.abs(input.qty),
    p_kind: input.kind,
    p_reason: input.reason,
    p_add: input.qty > 0,
  })
  return { kind: 'movements', ids: [id] }
}

export async function remoteCount(counts: { itemId: string; counted: number }[]): Promise<{ token: UndoToken | null; changed: number }> {
  const res = await rpc<{ count_id: string; changed_products: number }>('stock_count_apply', {
    p_establishment: await getEstablishmentId(),
    p_lines: counts.map((c) => ({ product_id: dbIdOf(c.itemId), counted: c.counted })),
  })
  return { token: { kind: 'count', id: res.count_id }, changed: res.changed_products }
}

export async function remoteUndoStock(token: UndoToken) {
  if (token.kind === 'count') return void (await rpc<number>('stock_count_undo', { p_count: token.id }))
  for (const id of token.ids) await rpc<string>('stock_reverse', { p_movement: id })
}

// ---------- ações de compras ----------
export const purchasePaymentCodes: Record<string, string> = {
  'Boleto, 14 dias após receber': 'boleto14',
  'Pix na entrega': 'pix_on_delivery',
  'Dinheiro na entrega': 'cash_on_delivery',
}

export async function remoteCreatePurchase(input: { supplierId: string; expectedAt: string; payment: string; items: { itemId: string; qty: number }[]; message: string }) {
  const code = purchasePaymentCodes[input.payment]
  if (!code) throw new Error('invalid_payment')
  return rpc<{ id: string; number: string }>('create_purchase_order', {
    p_establishment: await getEstablishmentId(),
    p_supplier: input.supplierId,
    p_expected: input.expectedAt,
    p_payment: code,
    p_items: input.items.map((i) => ({ product_id: dbIdOf(i.itemId), qty: i.qty })),
    p_message: input.message,
  })
}

export async function remoteReceive(purchaseId: string, lines: { lineId: string; qty: number; lot: string; expiresAt: string | null }[], dueAt: string, paymentLabel: string) {
  return rpc<{ receipt_id: string; total_cents: number; entry_id: string; closed: boolean }>('receive_purchase', {
    p_po: purchaseId,
    p_lines: lines.filter((l) => l.qty > 0).map((l) => ({ item_id: l.lineId, qty: l.qty, lot: l.lot, expires_at: l.expiresAt })),
    p_close_short: false,
    p_due_at: dueAt,
    p_payment_label: paymentLabel,
  })
}

export const remoteUndoReceipt = (receiptId: string) => rpc<void>('undo_receipt', { p_receipt: receiptId })
export const remoteClosePurchase = (purchaseId: string) => rpc<void>('close_purchase_short', { p_po: purchaseId })

/** Mensagem para o que o banco recusa (`raise exception`) */
export function backofficeErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg.includes('insufficient')) return 'O lote não tem saldo suficiente para essa saída.'
  if (msg.includes('no_lot')) return 'Este item não tem lote com saldo. Receba uma compra ou conte o estoque primeiro.'
  if (msg.includes('expiry_required')) return `Informe a validade de ${msg.split(':')[1] ?? 'um item'} para receber.`
  if (msg.includes('over_received')) return 'A quantidade passa do que falta receber neste pedido.'
  if (msg.includes('not_receivable')) return 'Este pedido já foi recebido ou encerrado.'
  if (msg.includes('product_lots_product_id_code_key') || msg.includes('duplicate key')) return 'Já existe um lote com esse código para este item. Troque o código do lote.'
  if (msg.includes('forbidden')) return 'Seu papel não permite esta ação.'
  if (msg.includes('empty_order')) return 'Escolha a quantidade de pelo menos um item.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}
