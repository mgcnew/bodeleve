import type { StockItem } from '@/domain/inventory'
import { lotsFefo } from '@/domain/inventory'
import { unitCostCents } from '@/domain/production'
import type { MockState } from './db'

/** Custo do produto: da ficha técnica (feito na casa, pelo custo atual dos insumos) ou do último recebimento (revenda). */
export function productCost(st: MockState, item: StockItem): { cents: number | null; source: 'recipe' | 'last_purchase' | null } {
  const recipe = st.recipes.find((r) => r.itemId === item.id)
  if (recipe) {
    const costOf = (id: string) => {
      const it = st.stockItems.find((i) => i.id === id)
      return lotsFefo(st.lots, st.movements, id)[0]?.unitCostCents ?? it?.lastCostCents ?? 0
    }
    return { cents: unitCostCents(recipe, costOf), source: 'recipe' }
  }
  return item.lastCostCents != null ? { cents: item.lastCostCents, source: 'last_purchase' } : { cents: null, source: null }
}
