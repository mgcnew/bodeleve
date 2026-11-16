import { itemsStore, productionStore, purchasesStore, recipesStore, stockStore } from './backoffice'
import { staffOrdersStore } from './orders'
import type { StockContext } from './stock'

/** Tudo o que as telas de estoque precisam para calcular saldos */
export function useStockContext(): StockContext & { items: ReturnType<typeof itemsStore.get>; lots: ReturnType<typeof stockStore.get>['lots'] } {
  const { lots, movements } = stockStore.useStore()
  return {
    items: itemsStore.useStore(),
    lots,
    movements,
    orders: staffOrdersStore.useStore(),
    purchases: purchasesStore.useStore(),
    production: productionStore.useStore(),
    recipes: recipesStore.useStore(),
  }
}
