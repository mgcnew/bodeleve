import type { FinancialEntry } from '@/domain/finance'
import type { Lot, StockItem, StockMovement } from '@/domain/inventory'
import type { PurchaseOrder, Supplier } from '@/domain/purchasing'
import type { Receipt } from '@/domain/receiving'
import type { Order } from '@/domain/types'
import { buildSeedOrders, DEVICE_SEED_IDS } from './seedOrders'
import type { ProductionOrder, Recipe } from '@/domain/production'
import type { Reservation } from '@/domain/stock'
import { buildProductionSeed, buildPurchaseSeed, buildStockSeed, recipesSeed, reservationsSeed, suppliersSeed } from './stockSeed'

/**
 * Banco simulado, único para a loja e a gestão: um pedido feito na loja aparece na fila da gestão.
 * Fica no localStorage (D19: sem banco). Lido de novo a cada operação, então duas abas enxergam a mesma coisa.
 */
const KEY = 'bodeleve.mock.db.v4'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>

export type MockState = {
  orders: Order[]
  /** Pedidos feitos neste aparelho (H-L12): é o que a loja lista para quem comprou sem conta. */
  deviceOrderIds: string[]
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
  stockItems: StockItem[]
  lots: Lot[]
  movements: StockMovement[]
  payables: FinancialEntry[]
  receipts: Receipt[]
  /** Reservas feitas à mão; as dos pedidos online são calculadas a partir dos pedidos abertos. */
  reservations: Reservation[]
  recipes: Recipe[]
  productionOrders: ProductionOrder[]
  /** Mensagens que o sistema montou mas NÃO enviou (D21): pedido de compra ao fornecedor, comprovantes… */
  outbox: Array<{ id: string; to: string; text: string; at: string; kind: 'purchase_order' }>
}

export type MockDb = {
  read(): MockState
  update(change: (state: MockState) => void): MockState
}

export function createDb(opts: { storage: Storage | null; withSeed: boolean; now: () => Date }): MockDb {
  let memory: MockState | null = null

  const initial = (): MockState => {
    const empty: MockState = { orders: [], deviceOrderIds: [], suppliers: [], purchaseOrders: [], stockItems: [], lots: [], movements: [], payables: [], receipts: [], reservations: [], recipes: [], productionOrders: [], outbox: [] }
    if (!opts.withSeed) return empty
    const now = opts.now()
    const stock = buildStockSeed(now)
    return {
      ...empty,
      orders: buildSeedOrders(now),
      deviceOrderIds: [...DEVICE_SEED_IDS],
      suppliers: suppliersSeed,
      purchaseOrders: buildPurchaseSeed(now),
      stockItems: stock.items,
      lots: stock.lots,
      movements: stock.movements,
      reservations: reservationsSeed,
      recipes: recipesSeed,
      productionOrders: buildProductionSeed(now),
    }
  }

  const read = (): MockState => {
    if (opts.storage) {
      try {
        const raw = opts.storage.getItem(KEY)
        if (raw) return JSON.parse(raw) as MockState
      } catch {
        /* cai para o estado inicial */
      }
      const fresh = initial()
      opts.storage.setItem(KEY, JSON.stringify(fresh))
      return fresh
    }
    return (memory ??= initial())
  }

  return {
    read,
    update(change) {
      const state = read()
      change(state)
      if (opts.storage) opts.storage.setItem(KEY, JSON.stringify(state))
      else memory = state
      return state
    },
  }
}
