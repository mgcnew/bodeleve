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
