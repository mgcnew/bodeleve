import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/services'
import type { Product } from '@/domain/types'

/** Leituras da loja. Cada uma tem estado de carregando e de erro tratados nas telas. */

export function useCategories() {
  const { catalog } = useServices()
  return useQuery({ queryKey: ['categories'], queryFn: () => catalog.listCategories() })
}

export function useProducts(filter?: { categoryId?: string; origin?: Product['origin']; query?: string }) {
  const { catalog } = useServices()
  return useQuery({ queryKey: ['products', filter ?? {}], queryFn: () => catalog.listProducts(filter) })
}

export function useProduct(id: string | undefined) {
  const { catalog } = useServices()
  return useQuery({ queryKey: ['product', id], queryFn: () => catalog.getProduct(id!), enabled: !!id })
}

export function useHomeSections() {
  const { catalog } = useServices()
  return useQuery({ queryKey: ['home-sections'], queryFn: () => catalog.getHomeSections() })
}

export function useStoreContent() {
  const { content } = useServices()
  return useQuery({ queryKey: ['store-content'], queryFn: () => content.getStoreContent() })
}

export function useOrders() {
  const { orders } = useServices()
  return useQuery({ queryKey: ['orders'], queryFn: () => orders.listOrders() })
}

export function useOrder(id: string | undefined) {
  const { orders } = useServices()
  return useQuery({ queryKey: ['order', id], queryFn: () => orders.getOrder(id!), enabled: !!id })
}

/** Todos os produtos, para montar a sacola (preço e nome vêm do catálogo, não do que foi guardado no aparelho). */
export function useAllProducts() {
  return useProducts()
}
