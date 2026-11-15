import { useMemo } from 'react'
import { storefront } from '@/config/storefront'
import { buildLines, computeTotals } from '@/domain/bag'
import { useBag } from '@/store/bag'
import { useAllProducts } from './queries'

/** Sacola com preços do catálogo e totais. `isPending` enquanto o catálogo carrega. */
export function useBagSummary() {
  const items = useBag((b) => b.items)
  const fulfillment = useBag((b) => b.fulfillment)
  const products = useAllProducts()
  return useMemo(() => {
    const lines = buildLines(items, products.data ?? [])
    const totals = computeTotals(lines, fulfillment, storefront.deliveryFeeCents)
    // Mesmo antes do catálogo carregar, a contagem vem do que está guardado no aparelho.
    const rawCount = Object.values(items).reduce((a, n) => a + n, 0)
    return { lines, totals, fulfillment, isPending: products.isPending, rawCount }
  }, [items, fulfillment, products.data, products.isPending])
}
