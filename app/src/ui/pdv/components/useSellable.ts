import { useMemo } from 'react'
import type { Item } from '@/domain/backoffice'
import { balanceOf } from '@/services/gestao/stock'
import { useStockContext } from '@/services/gestao/useBackoffice'

export type Sellable = { item: Item; available: number; low: boolean }

/** Itens à venda no balcão com o saldo disponível de cada um */
export function useSellable() {
  const ctx = useStockContext()
  return useMemo<Sellable[]>(
    () =>
      ctx.items
        .filter((i) => i.itemType !== 'raw_material' && i.priceCents !== null)
        .map((item) => {
          const available = balanceOf(item.id, ctx).available
          return { item, available, low: available < item.minStock }
        }),
    [ctx],
  )
}
