// Estoque, lotes, fornecedores e compras no banco. As telas continuam lendo os stores da Gestão;
// com o Supabase ligado eles são caches alimentados aqui, e as ações chamam as funções do banco
// (`stock_adjust`, `stock_count_apply`, `create_purchase_order`, `receive_purchase`...), que fazem a
// baixa pelo lote, a conta a pagar e a trilha de auditoria.
import { markLoaded } from '@/services/firstLoad'
import type { Item, ItemType, Lot, Movement, ProductionOrder, Purchase, Recipe, StockUnit, Supplier } from '@/domain/backoffice'
import type { ProductOrigin } from '@/domain/catalog'
import { supabase } from '@/lib/supabase'
import { itemsStore, productionStore, purchasesStore, recipesStore, stockStore, suppliersStore } from './backoffice'

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
  weight_price_cents: number | null
  photo_url: string | null
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
  // por peso, o preço mostrado e cobrado no PDV é o do quilo
  priceCents: r.sold_by_weight && r.weight_price_cents !== null ? Number(r.weight_price_cents) : r.price_cents === null ? null : Number(r.price_cents),
  supplierId: r.supplier_id,
  tracksLots: !!r.tracks_expiry,
  soldByWeight: !!r.sold_by_weight,
  published: !!r.is_published,
  favoritePos: !!r.is_favorite_pos,
  description: r.description ?? undefined,
  photoUrl: r.photo_url,
})

const paymentCodes: Record<string, string> = {
  boleto14: 'Boleto, 14 dias após receber',
  pix_on_delivery: 'Pix na entrega',
  cash_on_delivery: 'Dinheiro na entrega',
}

type RecipeRow = {
  id: string
  product_id: string
  yield_per_batch: number
  batch_label: string | null
  shelf_life_days: number | null
  overhead_cents: number | null
  method: string | null
  lot_prefix: string | null
  recipe_items: { product_id: string; qty_per_batch: number }[]
}

type ProductionRow = {
  id: string
  number: string
  recipe_id: string
  product_id: string
  batches: number
  planned_qty: number
  status: ProductionOrder['status']
  starts_at: string
  ends_at: string | null
  done_at: string | null
  good_qty: number | null
  lot_id: string | null
  cost_per_unit_cents: number | null
  destination_order_id: string | null
  production_consumptions: { product_id: string; qty: number }[]
}

let loading: Promise<void> | null = null
let rerun: Promise<void> | null = null

export async function refreshBackoffice(): Promise<void> {
  if (!supabase) return
  if (loading) {
    // uma busca em andamento pode ter começado antes da ação que pediu esta: refaz logo depois dela
    rerun ??= loading.catch(() => undefined).then(() => {
      rerun = null
      return refreshBackoffice()
    })
    return rerun
  }
  loading = (async () => {
    const [prods, lots, moves, sups, pos, recs, ops] = await Promise.all([
      supabase!.from('products').select('id, slug, name, unit, item_type, origin, min_stock, tracks_expiry, supplier_id, last_cost_cents, price_cents, weight_price_cents, sold_by_weight, is_published, is_favorite_pos, description, photo_url, details, categories(slug)').eq('is_active', true).order('name'),
      supabase!.from('product_lots').select('id, product_id, code, expires_at, unit_cost_cents, received_at'),
      supabase!.from('stock_movements').select('id, product_id, lot_id, type, qty, at, ref, description, created_by_name').order('at', { ascending: false }).limit(1000),
      supabase!.from('suppliers').select('id, name, supplies, phone, email, tax_id, lead_time_days, payment_terms, created_at, contact_name').eq('active', true).order('name'),
      supabase!.from('purchase_orders').select('id, number, supplier_id, status, payment_term, expected_at, sent_at, received_at, purchase_order_items(id, product_id, qty, unit_cost_cents, received_qty)').order('created_at', { ascending: false }).limit(200),
      supabase!.from('recipes').select('id, product_id, yield_per_batch, batch_label, shelf_life_days, overhead_cents, method, lot_prefix, recipe_items(product_id, qty_per_batch)').order('created_at'),
      supabase!.from('production_orders').select('id, number, recipe_id, product_id, batches, planned_qty, status, starts_at, ends_at, done_at, good_qty, lot_id, cost_per_unit_cents, destination_order_id, production_consumptions(product_id, qty)').order('created_at', { ascending: false }).limit(200),
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

    const recipes: Recipe[] = ((recs.data ?? []) as unknown as RecipeRow[]).map((r) => ({
      id: r.id,
      productId: slugOf.get(r.product_id) ?? '',
      yieldQty: Number(r.yield_per_batch),
      batchLabel: r.batch_label || 'fornada',
      shelfLifeDays: Number(r.shelf_life_days ?? 0),
      lines: r.recipe_items.map((i) => ({ itemId: slugOf.get(i.product_id) ?? '', qty: Number(i.qty_per_batch) })),
      indirectCostCents: Number(r.overhead_cents ?? 0),
      prepNotes: r.method || '[MODO DE PREPARO DA CASA]',
      lotPrefix: r.lot_prefix ?? '',
    }))
    const lotCodeOf = new Map(lotList.map((l) => [l.id, l.code]))
    // `destination_order_id` não tem chave estrangeira no banco; os números vêm de uma busca à parte
    const productionRows = (ops.data ?? []) as unknown as ProductionRow[]
    const destinationIds = [...new Set(productionRows.map((p) => p.destination_order_id).filter((x): x is string => !!x))]
    const orderNumbers = new Map<string, string>()
    if (destinationIds.length) {
      const { data } = await supabase!.from('orders').select('id, number').in('id', destinationIds)
      for (const r of (data ?? []) as { id: string; number: string }[]) orderNumbers.set(r.id, r.number)
    }
    const production: ProductionOrder[] = productionRows.map((p) => {
      const consumed = new Map<string, number>()
      for (const c of p.production_consumptions) consumed.set(c.product_id, (consumed.get(c.product_id) ?? 0) + Number(c.qty))
      const done = p.status === 'done'
      return {
        id: p.id,
        number: p.number,
        recipeId: p.recipe_id,
        productId: slugOf.get(p.product_id) ?? '',
        batches: p.batches,
        plannedQty: Number(p.planned_qty),
        destination: p.destination_order_id ? { kind: 'order', orderNumber: orderNumbers.get(p.destination_order_id) ?? '' } : { kind: 'stock' },
        status: p.status,
        startAt: p.starts_at,
        endAt: p.done_at ?? p.ends_at ?? new Date(new Date(p.starts_at).getTime() + 9 * 3_600_000).toISOString(),
        goodQty: done ? Number(p.good_qty ?? 0) : null,
        lotCode: done && p.lot_id ? lotCodeOf.get(p.lot_id) ?? null : null,
        consumptions: done ? [...consumed].map(([id, qty]) => ({ itemId: slugOf.get(id) ?? '', qty })) : null,
        realUnitCostCents: done ? Number(p.cost_per_unit_cents ?? 0) : null,
      }
    })

    itemsStore.set(items)
    recipesStore.set(recipes)
    productionStore.set(production)
    stockStore.set({ lots: lotList, movements })
    suppliersStore.set(suppliers)
    purchasesStore.set(purchases)
  })().finally(() => {
    loading = null
    markLoaded('backoffice')
  })
  return loading
}

/** Mantém o cache em dia: busca ao abrir, a cada 20 s, depois de cada ação e quando o estoque muda (Realtime) */
export function startBackofficeSync() {
  if (!supabase) return () => undefined
  void refreshBackoffice()
  const timer = setInterval(() => void refreshBackoffice(), 20_000)
  const channel = supabase
    .channel(`backoffice-estoque-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => void refreshBackoffice())
    .subscribe()
  return () => {
    clearInterval(timer)
    void supabase!.removeChannel(channel)
  }
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

// ---------- ações de produção ----------
export async function remoteCreateProduction(input: { recipeId: string; batches: number; destinationOrderId: string | null; startAt: string }) {
  return rpc<{ id: string; number: string }>('create_production_order', {
    p_establishment: await getEstablishmentId(),
    p_recipe: input.recipeId,
    p_batches: input.batches,
    p_destination: input.destinationOrderId,
    p_starts_at: input.startAt,
    p_start_now: false,
  })
}

export const remoteStartProduction = (orderId: string) => rpc<void>('start_production', { p_order: orderId })
export const remoteDeleteProduction = (orderId: string) => rpc<void>('delete_production_order', { p_order: orderId })
export const remoteUndoProduction = (orderId: string) => rpc<void>('undo_finish_production', { p_order: orderId })

export const remoteFinishProduction = (orderId: string, input: { goodQty: number; lotCode: string; expiresAt: string | null; consumptions: { itemId: string; qty: number }[] }) =>
  rpc<{ lot_id: string; lot_code: string; cost_per_unit_cents: number }>('finish_production', {
    p_order: orderId,
    p_good_qty: input.goodQty,
    p_lot_code: input.lotCode,
    p_expires_at: input.expiresAt,
    p_consumption: input.consumptions.map((c) => ({ product_id: dbIdOf(c.itemId), qty: c.qty })),
  })

/** Mensagem para o que o banco recusa (`raise exception`) */
export const RECIPE_NOTES_PLACEHOLDER = '[MODO DE PREPARO DA CASA]'

/** Cria (`recipeId` nulo) ou atualiza a ficha técnica; as linhas antigas são substituídas pelas enviadas */
export async function remoteSaveRecipe(recipeId: string | null, input: { productId: string; yieldQty: number; batchLabel: string; shelfLifeDays: number; lotPrefix: string; indirectCostCents: number; prepNotes: string; lines: { itemId: string; qty: number }[] }) {
  return rpc<string>('save_recipe', {
    p_establishment: await getEstablishmentId(),
    p_recipe: recipeId,
    p_data: {
      product_id: dbIdOf(input.productId),
      yield_per_batch: input.yieldQty,
      batch_label: input.batchLabel,
      shelf_life_days: input.shelfLifeDays,
      lot_prefix: input.lotPrefix,
      overhead_cents: input.indirectCostCents,
      method: input.prepNotes === RECIPE_NOTES_PLACEHOLDER ? '' : input.prepNotes,
      lines: input.lines.map((l) => ({ product_id: dbIdOf(l.itemId), qty_per_batch: l.qty })),
    },
  })
}

export function backofficeErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg.includes('insufficient_input')) return `Não há ${msg.split(':')[1] ?? 'insumo'} suficiente em estoque para concluir. Receba a compra ou ajuste o consumo.`
  if (msg.includes('insufficient')) return 'O lote não tem saldo suficiente para essa saída.'
  if (msg.includes('no_lot')) return 'Este item não tem lote com saldo. Receba uma compra ou conte o estoque primeiro.'
  if (msg.includes('expiry_required')) return `Informe a validade de ${msg.split(':')[1] ?? 'um item'} para receber.`
  if (msg.includes('over_received')) return 'A quantidade passa do que falta receber neste pedido.'
  if (msg.includes('not_receivable')) return 'Este pedido já foi recebido ou encerrado.'
  if (msg.includes('product_lots_product_id_code_key') || msg.includes('duplicate key')) return 'Já existe um lote com esse código para este item. Troque o código do lote.'
  if (msg.includes('lot_already_used')) return 'O lote desta produção já foi usado (vendido ou baixado). Não dá para corrigir o apontamento.'
  if (msg.includes('already_done') || msg.includes('invalid_state')) return 'Esta ordem já mudou de situação. Atualize a tela.'
  if (msg.includes('forbidden')) return 'Seu papel não permite esta ação.'
  if (msg.includes('empty_recipe')) return 'Coloque pelo menos um insumo na ficha.'
  if (msg.includes('invalid_product')) return 'Escolha um produto acabado para a ficha.'
  if (msg.includes('duplicate')) return 'Este produto já tem ficha.'
  if (msg.includes('empty_order')) return 'Escolha a quantidade de pelo menos um item.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}
