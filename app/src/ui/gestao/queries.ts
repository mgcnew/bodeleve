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
