// Catálogo público lido do banco pelas funções `store_catalog` e `store_categories`
// (o preço e o que está publicado são decididos no cadastro; a loja só lê).
import { STORE_SLUG } from '@/config/hypotheses'
import type { Category, Product, ProductOrigin } from '@/domain/catalog'
import { supabase } from '@/lib/supabase'

type Row = {
  slug: string
  name: string
  unit: string
  price_cents: number
  origin: 'house' | 'brand' | 'resale' | null
  category_slug: string | null
  description: string | null
  details: { size?: string; storage?: string; shelf_life?: string; ingredients?: string; popular_rank?: number | null } | null
}

const origins: Record<string, ProductOrigin> = { house: 'house_made', brand: 'bodeleve_brand', resale: 'third_party' }

let cache: { at: number; products: Product[]; categories: Category[] } | null = null
const TTL = 20_000

export const remoteEnabled = () => supabase !== null

async function load() {
  if (cache && Date.now() - cache.at < TTL) return cache
  const [cat, prod] = await Promise.all([
    supabase!.rpc('store_categories', { p_slug: STORE_SLUG }),
    supabase!.rpc('store_catalog', { p_slug: STORE_SLUG }),
  ])
  if (cat.error) throw cat.error
  if (prod.error) throw prod.error
  const categories = ((cat.data ?? []) as { slug: string; name: string; position: number }[])
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ id: c.slug, name: c.name }))
  const products = ((prod.data ?? []) as Row[]).map<Product>((r) => ({
    id: r.slug,
    name: r.name,
    sizeLabel: r.details?.size ?? '',
    priceCents: Number(r.price_cents),
    origin: r.origin ? origins[r.origin] : 'third_party',
    categoryId: r.category_slug ?? '',
    popularRank: r.details?.popular_rank ?? null,
    available: true,
    description: r.description ?? '',
    storage: r.details?.storage ?? '',
    shelfLife: r.details?.shelf_life ?? '',
    ingredients: r.details?.ingredients ?? '',
  }))
  cache = { at: Date.now(), products, categories }
  return cache
}

export const remoteProducts = async () => (await load()).products
export const remoteCategories = async () => (await load()).categories
/** limpa o cache depois de uma mudança no cadastro */
export const clearCatalogCache = () => {
  cache = null
}
