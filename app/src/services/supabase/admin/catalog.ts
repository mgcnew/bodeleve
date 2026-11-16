import { channelLabel, checkNewCategory, kindOf, parseMinStock, slugify, splitLabel, splitNewLabel, validateProduct, type ProductInput } from '@/domain/catalog'
import { DESCRIPTION_PLACEHOLDER } from '@/domain/catalog'
import type { ItemOrigin, ItemType } from '@/domain/inventory'
import { itemLabel } from '@/domain/inventory'
import { unitCostCents, type Recipe } from '@/domain/production'
import { unitKg } from '@/domain/units'
import type { CatalogAdminService, CategoryRow, ProductDetail, ProductRow } from '@/services/types'
import type { Database } from '../database.types'
import type { AdminContext } from './context'


type ProductRowDb = Database['public']['Tables']['products']['Row']

const COLUMNS = 'id, name, unit, item_type, origin, category_id, min_stock, tracks_expiry, last_cost_cents, price_cents, weight_price_cents, is_published, is_favorite_pos, sold_by_weight, description'

/** Texto da escolha de tipo/origem no banco para o que as telas conhecem. */
const asType = (t: string) => t as ItemType
const asOrigin = (o: string | null) => (o as ItemOrigin | null)

const moneyOrNull = (n: number | null) => (n == null ? null : Number(n))

export function createSupabaseCatalogAdmin(ctx: AdminContext): CatalogAdminService {
  const { client } = ctx

  /** Custo de hoje por produto: lote que sai primeiro (FEFO) ou o último custo conhecido. */
  async function currentCosts(ids: string[]): Promise<Map<string, number>> {
    const out = new Map<string, number>()
    if (ids.length === 0) return out
    const { data: lots } = await client
      .from('lot_balances')
      .select('product_id, unit_cost_cents, balance, expires_at, received_at')
      .in('product_id', ids)
      .gt('balance', 0)
      .order('expires_at', { ascending: true, nullsFirst: false })
      .order('received_at', { ascending: true })
    for (const l of lots ?? []) if (l.product_id && !out.has(l.product_id)) out.set(l.product_id, Number(l.unit_cost_cents ?? 0))
    const { data: prods } = await client.from('products').select('id, last_cost_cents').in('id', ids)
    for (const p of prods ?? []) if (!out.has(p.id) && p.last_cost_cents != null) out.set(p.id, Number(p.last_cost_cents))
    return out
  }

  async function costOf(p: ProductRowDb): Promise<{ cents: number | null; source: 'recipe' | 'last_purchase' | null }> {
    const { data: r } = await client.from('recipes').select('id, yield_per_batch, overhead_cents, recipe_items(product_id, qty_per_batch)').eq('product_id', p.id).maybeSingle()
    if (r) {
      const items = r.recipe_items ?? []
      const costs = await currentCosts(items.map((i) => i.product_id))
      const recipe = {
        yieldPerBatch: Number(r.yield_per_batch), overheadCents: Number(r.overhead_cents),
        lines: items.map((i) => ({ itemId: i.product_id, qtyPerBatch: Number(i.qty_per_batch) })),
      } as unknown as Recipe
      return { cents: unitCostCents(recipe, (id) => costs.get(id) ?? 0), source: 'recipe' }
    }
    return p.last_cost_cents != null ? { cents: Number(p.last_cost_cents), source: 'last_purchase' } : { cents: null, source: null }
  }

  async function categoryList() {
    const est = await ctx.establishment()
    const { data } = await client.from('categories').select('id, name, is_internal, position').eq('establishment_id', est).order('position').order('name')
    return data ?? []
  }

  async function detail(id: string): Promise<ProductDetail | null> {
    const { data: p } = await client.from('products').select(COLUMNS).eq('id', id).maybeSingle()
    if (!p) return null
    const cost = await costOf(p as unknown as ProductRowDb)
    const cats = (await categoryList()).filter((c) => !c.is_internal)
    return {
      id: p.id, label: itemLabel({ name: p.name, unit: p.unit }), unit: p.unit, name: itemLabel({ name: p.name, unit: p.unit }), categoryId: p.category_id ?? '',
      itemType: asType(p.item_type), origin: asOrigin(p.origin), priceCents: moneyOrNull(p.price_cents), weightPriceCents: moneyOrNull(p.weight_price_cents),
      minStock: `${Number(p.min_stock)} un`, published: p.is_published, favoritePos: p.is_favorite_pos, soldByWeight: p.sold_by_weight, tracksExpiry: p.tracks_expiry,
      description: p.description?.trim() ? p.description : DESCRIPTION_PLACEHOLDER, costCents: cost.cents, costSource: cost.source,
      categories: cats.map((c) => ({ id: c.id, name: c.name })),
    }
  }

  /** Campos de venda e cadastro do formulário, com as mesmas regras do app: matéria-prima não tem origem, preço, loja nem favorito. */
  const fields = (input: ProductInput, name: string, unit: string) => {
    const raw = input.itemType === 'raw_material'
    return {
      name, unit,
      category_id: input.categoryId || null,
      item_type: input.itemType,
      origin: raw ? null : (input.origin ?? 'resale'),
      min_stock: parseMinStock(input.minStock) ?? 0,
      tracks_expiry: input.tracksExpiry,
      ...(input.itemType !== 'finished' && input.lastCostCents !== undefined ? { last_cost_cents: input.lastCostCents } : {}),
      price_cents: raw ? null : input.priceCents,
      weight_price_cents: raw || !input.soldByWeight ? null : input.weightPriceCents,
      is_published: raw ? false : input.published,
      is_favorite_pos: raw ? false : input.favoritePos,
      sold_by_weight: raw ? false : input.soldByWeight,
      description: input.description.trim() === DESCRIPTION_PLACEHOLDER ? '' : input.description.trim(),
    }
  }

  return {
    async list() {
      const est = await ctx.establishment()
      const { data, error } = await client.from('products').select('id, name, unit, item_type, origin, price_cents, weight_price_cents, is_published, sold_by_weight').eq('establishment_id', est).eq('is_active', true).order('name')
      if (error) throw new Error(error.message)
      return (data ?? []).map((p): ProductRow => {
        const item = { itemType: asType(p.item_type), origin: asOrigin(p.origin) }
        const sale = { priceCents: moneyOrNull(p.price_cents), published: p.is_published, soldByWeight: p.sold_by_weight }
        return {
          id: p.id, label: itemLabel({ name: p.name, unit: p.unit }), kind: kindOf(item), channel: channelLabel(item, sale),
          priceCents: sale.soldByWeight && p.weight_price_cents ? Number(p.weight_price_cents) : sale.priceCents, soldByWeight: sale.soldByWeight,
        }
      })
    },
    get: detail,
    async save(id, input) {
      if (Object.keys(validateProduct(input)).length) throw new Error('invalid')
      const { data: cur } = await client.from('products').select('unit').eq('id', id).maybeSingle()
      if (!cur) throw new Error('not_found')
      const { name, unit } = splitLabel(input.name, cur.unit)
      if (input.soldByWeight && input.itemType !== 'raw_material' && unitKg(unit) == null) throw new Error('invalid')
      const { error } = await client.from('products').update(fields(input, name, unit)).eq('id', id)
      if (error) throw new Error(error.message.includes('check') ? 'invalid' : error.message)
      return (await detail(id))!
    },
    async create(input) {
      if (Object.keys(validateProduct(input)).length) throw new Error('invalid')
      const est = await ctx.establishment()
      const { name, unit } = splitNewLabel(input.name)
      if (input.soldByWeight && input.itemType !== 'raw_material' && unitKg(unit) == null) throw new Error('invalid')
      const base = slugify(`${name} ${unit}`) || 'item'
      for (let n = 1; n <= 20; n++) {
        const slug = n === 1 ? base : `${base}-${n}`
        const { data, error } = await client.from('products').insert({ establishment_id: est, slug, ...fields(input, name, unit) }).select('id').single()
        if (!error) return (await detail(data.id))!
        if (error.code !== '23505') throw new Error(error.message.includes('check') ? 'invalid' : error.message)
      }
      throw new Error('duplicate')
    },
    async categories() {
      const est = await ctx.establishment()
      const cats = (await categoryList()).filter((c) => !c.is_internal)
      const { data: prods } = await client.from('products').select('category_id').eq('establishment_id', est).neq('item_type', 'raw_material').eq('is_active', true)
      const count = new Map<string, number>()
      for (const p of prods ?? []) if (p.category_id) count.set(p.category_id, (count.get(p.category_id) ?? 0) + 1)
      return cats.map((c): CategoryRow => {
        const n = count.get(c.id) ?? 0
        return { id: c.id, name: c.name, products: n, tag: n === 0 ? 'Nova' : 'Na loja' }
      })
    },
    async addCategory(name) {
      const est = await ctx.establishment()
      const existing = await categoryList()
      const err = checkNewCategory(name, existing.map((c) => ({ id: c.id, name: c.name })))
      if (err) throw new Error(err)
      const position = existing.reduce((m, c) => Math.max(m, c.position), 0) + 1
      const { data, error } = await client.from('categories').insert({ establishment_id: est, slug: slugify(name), name: name.trim(), position }).select('id, name').single()
      if (error) throw new Error(error.code === '23505' ? 'duplicate' : error.message)
      return { id: data.id, name: data.name, products: 0, tag: 'Nova' }
    },
  }
}
