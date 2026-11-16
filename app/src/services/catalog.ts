// Catálogo da loja. Hoje lê os mocks; com o Supabase configurado passa a ler
// `products` e `categories` (RLS já libera os publicados para quem não tem conta).
import { normalize, type Category, type Product, type ProductOrigin } from '@/domain/catalog'
import { products as mockProducts } from '@/mocks/catalog'
import { itemsStore, productionStore, purchasesStore, stockStore } from './gestao/backoffice'
import { staffOrdersStore } from './gestao/orders'
import { categoriesStore } from './gestao/people'
import { balanceOf } from './gestao/stock'
import { delay } from './delay'
import { remoteCategories, remoteEnabled, remoteProducts } from './catalogRemote'

/**
 * O catálogo da loja vem dos textos de exemplo (mocks) e, para cada item que existe na gestão,
 * usa o que a gestão decide: preço, publicado e disponibilidade pelo estoque.
 */
async function productsNow(): Promise<Product[]> {
  return remoteEnabled() ? remoteProducts() : liveProducts()
}

function liveProducts(): Product[] {
  const ctx = { movements: stockStore.get().movements, orders: staffOrdersStore.get(), purchases: purchasesStore.get(), production: productionStore.get() }
  const items = itemsStore.get()
  return mockProducts.flatMap((p) => {
    const item = items.find((i) => i.id === p.id)
    if (!item) return [p]
    if (!item.published) return []
    const inStock = balanceOf(item.id, ctx).available > 0
    return [{ ...p, priceCents: item.priceCents ?? p.priceCents, origin: item.origin ?? p.origin, categoryId: item.categoryId, available: p.available && inStock, description: item.description ?? p.description }]
  })
}

export async function listCategories(): Promise<Category[]> {
  if (remoteEnabled()) return remoteCategories()
  await delay()
  return categoriesStore.get()
}

export async function getCategory(id: string): Promise<Category | null> {
  if (remoteEnabled()) return (await remoteCategories()).find((c) => c.id === id) ?? null
  await delay()
  return categoriesStore.get().find((c) => c.id === id) ?? null
}

export async function listProducts(filter: { categoryId?: string; origin?: ProductOrigin } = {}): Promise<Product[]> {
  const all = await productsNow()
  return all.filter(
    (p) =>
      (!filter.categoryId || p.categoryId === filter.categoryId) && (!filter.origin || p.origin === filter.origin),
  )
}

export async function listPopular(): Promise<Product[]> {
  const all = await productsNow()
  return all
    .filter((p) => p.popularRank !== null)
    .sort((a, b) => (a.popularRank ?? 0) - (b.popularRank ?? 0))
}

export async function getProduct(id: string): Promise<Product | null> {
  const all = await productsNow()
  return all.find((p) => p.id === id) ?? null
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = normalize(query.trim())
  if (!q) return []
  const all = await productsNow()
  return all.filter((p) => normalize(p.name).includes(q))
}

export async function countByCategory(): Promise<Record<string, number>> {
  const all = await productsNow()
  return all.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoryId] = (acc[p.categoryId] ?? 0) + 1
    return acc
  }, {})
}
