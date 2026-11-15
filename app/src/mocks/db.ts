import type { Order } from '@/domain/types'
import { buildSeedOrders, DEVICE_SEED_IDS } from './seedOrders'

/**
 * Banco simulado, único para a loja e a gestão: um pedido feito na loja aparece na fila da gestão.
 * Fica no localStorage (D19: sem banco). Lido de novo a cada operação, então duas abas enxergam a mesma coisa.
 */
const KEY = 'bodeleve.mock.db.v1'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>

export type MockState = {
  orders: Order[]
  /** Pedidos feitos neste aparelho (H-L12): é o que a loja lista para quem comprou sem conta. */
  deviceOrderIds: string[]
}

export type MockDb = {
  read(): MockState
  update(change: (state: MockState) => void): MockState
}

export function createDb(opts: { storage: Storage | null; withSeed: boolean; now: () => Date }): MockDb {
  let memory: MockState | null = null

  const initial = (): MockState =>
    opts.withSeed ? { orders: buildSeedOrders(opts.now()), deviceOrderIds: [...DEVICE_SEED_IDS] } : { orders: [], deviceOrderIds: [] }

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
