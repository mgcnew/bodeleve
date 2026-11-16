// Catálogo da loja. Hoje lê os mocks; com o Supabase configurado passa a ler
// `products` e `categories` (RLS já libera os publicados para quem não tem conta).
import { normalize, type Category, type Product, type ProductOrigin } from '@/domain/catalog'
import { categories, products } from '@/mocks/catalog'
import { delay } from './delay'

export async function listCategories(): Promise<Category[]> {
  await delay()
  return categories
}

export async function getCategory(id: string): Promise<Category | null> {
  await delay()
  return categories.find((c) => c.id === id) ?? null
}

export async function listProducts(filter: { categoryId?: string; origin?: ProductOrigin } = {}): Promise<Product[]> {
  await delay()
  return products.filter(
    (p) =>
      (!filter.categoryId || p.categoryId === filter.categoryId) && (!filter.origin || p.origin === filter.origin),
  )
}

export async function listPopular(): Promise<Product[]> {
  await delay()
  return products
    .filter((p) => p.popularRank !== null)
    .sort((a, b) => (a.popularRank ?? 0) - (b.popularRank ?? 0))
}

export async function getProduct(id: string): Promise<Product | null> {
  await delay()
  return products.find((p) => p.id === id) ?? null
}

export async function searchProducts(query: string): Promise<Product[]> {
  await delay(120)
  const q = normalize(query.trim())
  if (!q) return []
  return products.filter((p) => normalize(p.name).includes(q))
}

export async function countByCategory(): Promise<Record<string, number>> {
  await delay()
  return products.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoryId] = (acc[p.categoryId] ?? 0) + 1
    return acc
  }, {})
}
