import type { Period } from '@/domain/reports'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServices } from '@/services'

export function useAdminDashboard() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => admin.dashboard.get() })
}

export function useAdminOrders() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'orders'], queryFn: () => admin.orders.listOpen() })
}

export function useAdminOrder(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'order', id], queryFn: () => admin.orders.get(id!), enabled: !!id })
}

/** Depois de mexer num pedido, a lista, o pedido e o início (contagens) precisam ser lidos de novo. */
export function useOrderAction(id: string) {
  const { admin } = useServices()
  const client = useQueryClient()
  const done = () => Promise.all([
    client.invalidateQueries({ queryKey: ['admin', 'orders'] }),
    client.invalidateQueries({ queryKey: ['admin', 'order', id] }),
    client.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
    client.invalidateQueries({ queryKey: ['orders'] }),
    client.invalidateQueries({ queryKey: ['order', id] }),
  ])
  return {
    accept: useMutation({ mutationFn: () => admin.orders.accept(id), onSuccess: done }),
    markReady: useMutation({ mutationFn: (checked: string[]) => admin.orders.markReady(id, checked), onSuccess: done }),
    undoReady: useMutation({ mutationFn: () => admin.orders.undoReady(id), onSuccess: done }),
  }
}

// ───────── Compras e fornecedores ─────────

export function usePurchases() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'purchases'], queryFn: () => admin.purchasing.listOrders() })
}

export function usePurchase(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'purchase', id], queryFn: () => admin.purchasing.getOrder(id!), enabled: !!id })
}

export function useSuppliers() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'suppliers'], queryFn: () => admin.purchasing.listSuppliers() })
}

export function useSupplier(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'supplier', id], queryFn: () => admin.purchasing.getSupplier(id!), enabled: !!id })
}

export function useSuggestions(supplierId: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'suggest', supplierId], queryFn: () => admin.purchasing.suggest(supplierId!), enabled: !!supplierId })
}

/** Compras mexem em pedidos, estoque (lotes) e contas: relê o que depende disso. */
export function useInvalidatePurchasing() {
  const client = useQueryClient()
  return () =>
    Promise.all(['purchases', 'purchase', 'suppliers', 'supplier', 'suggest', 'dashboard'].map((k) => client.invalidateQueries({ queryKey: ['admin', k] })))
}

// ───────── Estoque ─────────

export function useStockOverview() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'stock'], queryFn: () => admin.stock.overview() })
}

export function useStockItem(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'stock-item', id], queryFn: () => admin.stock.getItem(id!), enabled: !!id })
}

export function useStockMovements(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'stock-movements', id], queryFn: () => admin.stock.movements(id!), enabled: !!id })
}

export function useCountAreas() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'count-areas'], queryFn: () => admin.stock.countAreas() })
}

export function useCountItems(areaId: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'count-items', areaId], queryFn: () => admin.stock.countItems(areaId!), enabled: !!areaId })
}

/** Mexer no estoque muda saldos, sugestões de compra, separação de pedidos e o Início. */
export function useInvalidateStock() {
  const client = useQueryClient()
  return () =>
    Promise.all(['stock', 'stock-item', 'stock-movements', 'count-items', 'suggest', 'dashboard', 'order', 'orders'].map((k) => client.invalidateQueries({ queryKey: ['admin', k] })))
}

// ───────── Produção ─────────

export function useProductionOrders() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'production'], queryFn: () => admin.production.listOrders() })
}

export function useProductionOrder(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'production-order', id], queryFn: () => admin.production.getOrder(id!), enabled: !!id })
}

export function useRecipes() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'recipes'], queryFn: () => admin.production.listRecipes() })
}

export function useRecipe(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'recipe', id], queryFn: () => admin.production.getRecipe(id!), enabled: !!id })
}

export function useFinishDefaults(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'finish-defaults', id], queryFn: () => admin.production.finishDefaults(id!), enabled: !!id })
}

/** Produção mexe em ordens, saldos e lotes do estoque e no Início. */
export function useInvalidateProduction() {
  const client = useQueryClient()
  return () =>
    Promise.all(['production', 'production-order', 'recipes', 'recipe', 'finish-defaults', 'stock', 'stock-item', 'stock-movements', 'suggest', 'dashboard', 'count-items'].map((k) => client.invalidateQueries({ queryKey: ['admin', k] })))
}

// ───────── Financeiro ─────────

export function useFinanceOverview() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'finance'], queryFn: () => admin.finance.overview() })
}

export function useFinanceEntries() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'finance-entries'], queryFn: () => admin.finance.entries() })
}

export function useFinanceEntry(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'finance-entry', id], queryFn: () => admin.finance.getEntry(id!), enabled: !!id })
}

export function useLedger() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'ledger'], queryFn: () => admin.finance.ledger() })
}

/** Pagar conta mexe em saldos, contas, lançamentos, fornecedores e no Início. */
export function useInvalidateFinance() {
  const client = useQueryClient()
  return () =>
    Promise.all(['finance', 'finance-entries', 'finance-entry', 'ledger', 'dashboard', 'suppliers', 'supplier'].map((k) => client.invalidateQueries({ queryKey: ['admin', k] })))
}

export function useProducts() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'products'], queryFn: () => admin.catalog.list() })
}

export function useProduct(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'product', id], queryFn: () => admin.catalog.get(id!), enabled: !!id })
}

export function useCategoryRows() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'categories'], queryFn: () => admin.catalog.categories() })
}

/** Mudar produto ou categoria muda também o que a loja mostra. */
export function useInvalidateCatalog() {
  const client = useQueryClient()
  return () => client.invalidateQueries()
}

export function useCustomers(query: string) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'customers', query], queryFn: () => admin.customers.list(query) })
}

export function useCustomer(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'customer', id], queryFn: () => admin.customers.get(id!), enabled: !!id })
}

export function useDeliveries() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'deliveries'], queryFn: () => admin.deliveries.overview() })
}

export function useAssignView(orderId: string | undefined) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'assign', orderId], queryFn: () => admin.deliveries.getAssign(orderId!), enabled: !!orderId })
}

export function useInvalidateDeliveries() {
  const client = useQueryClient()
  return () => Promise.all(['deliveries', 'assign', 'dashboard', 'orders'].map((k) => client.invalidateQueries({ queryKey: ['admin', k] })))
}

export function useReportsHub() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'reports-hub'], queryFn: () => admin.reports.hub() })
}

export function useSalesReport(period: Period) {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'sales-report', period], queryFn: () => admin.reports.sales(period) })
}

export function useSettingsOverview() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'settings'], queryFn: () => admin.settings.overview() })
}

export function useHouse() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'house'], queryFn: () => admin.settings.getHouse() })
}

export function useTeam() {
  const { admin } = useServices()
  return useQuery({ queryKey: ['admin', 'team'], queryFn: () => admin.settings.team() })
}
