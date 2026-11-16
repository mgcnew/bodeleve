import { cleanHouse, emptyHouse, type House, type TeamMember } from '@/domain/settings'
import type { CashSession, PosSale } from '@/domain/pos'
import type { SalesDay } from '@/domain/reports'
import type { Courier, DeliveryRecord } from '@/domain/deliveries'
import type { CategoryRecord, SaleInfo } from '@/domain/catalog'
import type { CustomerRecord } from '@/domain/customers'
import type { CashTransaction, FinancialEntry } from '@/domain/finance'
import type { Lot, StockItem, StockMovement } from '@/domain/inventory'
import type { PurchaseOrder, Supplier } from '@/domain/purchasing'
import type { Receipt } from '@/domain/receiving'
import type { Order } from '@/domain/types'
import { buildSeedOrders, DEVICE_SEED_IDS } from './seedOrders'
import type { ProductionOrder, Recipe } from '@/domain/production'
import type { Reservation } from '@/domain/stock'
import { adminUsers, teamNotes } from './adminSeed'
import { buildPosSeed } from './posSeed'
import { buildSalesHistory } from './reportsSeed'
import { buildCouriersSeed, buildDeliverySeed } from './deliverySeed'
import { buildCustomersSeed, buildSalesSeed, categoriesSeed } from './catalogSeed'
import { buildFinanceSeed, buildProductionSeed, buildPurchaseSeed, buildStockSeed, recipesSeed, reservationsSeed, suppliersSeed } from './stockSeed'

/**
 * Banco simulado, único para a loja e a gestão: um pedido feito na loja aparece na fila da gestão.
 * Fica no localStorage (D19: sem banco). Lido de novo a cada operação, então duas abas enxergam a mesma coisa.
 */
const KEY = 'bodeleve.mock.db.v9'

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
  /** Contas a pagar e a receber. */
  entries: FinancialEntry[]
  /** Lançamentos de dinheiro nas duas contas (banco e caixa): o saldo é a soma deles. */
  transactions: CashTransaction[]
  receipts: Receipt[]
  /** Reservas feitas à mão; as dos pedidos online são calculadas a partir dos pedidos abertos. */
  reservations: Reservation[]
  recipes: Recipe[]
  productionOrders: ProductionOrder[]
  /** Venda de cada item (preço, loja, favorito no PDV, peso). Vazio = catálogo estático da loja. */
  sales: SaleInfo[]
  categories: CategoryRecord[]
  customers: CustomerRecord[]
  /** Entregas atribuídas (a fila 'para sair' vem dos pedidos). */
  /** Entregadores cadastrados pela casa. */
  couriers: Courier[]
  deliveries: DeliveryRecord[]
  /** Vendas diárias anteriores à base (exemplo, até o PDV existir). */
  salesHistory: SalesDay[]
  /** Sessões de caixa do balcão e vendas feitas nele (PDV). */
  cashSessions: CashSession[]
  posSales: PosSale[]
  /** Vendas de balcão de hoje que não estão em `posSales` (exemplo). Com o banco real começa zerado. */
  counterBase?: { count: number; cents: number; cashCents: number; pixCents: number; cardCents: number; products: Record<string, number> }
  /** Vendas de ontem até esta hora; no modo simulado vale o exemplo. */
  yesterdayUntilNowCents?: number
  house: House
  team: TeamMember[]
  /** Mensagens que o sistema montou mas NÃO enviou (D21): pedido de compra ao fornecedor, comprovantes… */
  outbox: Array<{ id: string; to: string; text: string; at: string; kind: 'purchase_order' | 'invite' | 'receipt' }>
}

export type MockDb = {
  read(): MockState
  update(change: (state: MockState) => void): MockState
}

export function createDb(opts: { storage: Storage | null; withSeed: boolean; now: () => Date }): MockDb {
  let memory: MockState | null = null

  const initial = (): MockState => {
    const empty: MockState = { orders: [], deviceOrderIds: [], suppliers: [], purchaseOrders: [], stockItems: [], lots: [], movements: [], entries: [], transactions: [], receipts: [], reservations: [], recipes: [], productionOrders: [], sales: [], categories: [], customers: [], couriers: [], deliveries: [], salesHistory: [], cashSessions: [], posSales: [], house: emptyHouse, team: [], outbox: [] }
    if (!opts.withSeed) return empty
    const now = opts.now()
    const stock = buildStockSeed(now)
    const pos = buildPosSeed(now)
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
      sales: buildSalesSeed(),
      categories: categoriesSeed,
      customers: buildCustomersSeed(now),
      couriers: buildCouriersSeed(),
      deliveries: buildDeliverySeed(now),
      salesHistory: buildSalesHistory(now),
      cashSessions: pos.sessions,
      posSales: pos.sales,
      house: cleanHouse(emptyHouse),
      team: adminUsers.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, note: teamNotes[u.id] ?? '' })),
      ...buildFinanceSeed(now),
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
