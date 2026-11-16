import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useServices } from '@/services'
import { useCourierSession } from '@/store/courier'

/** O app do entregador funciona com o que está no aparelho: as consultas não esperam a rede (networkMode 'always'). */
export function useCourierList() {
  const { admin } = useServices()
  const id = useCourierSession((s) => s.courierId)
  return useQuery({ networkMode: 'always', queryKey: ['courier', 'list', id], queryFn: () => admin.courier.list(id!), enabled: !!id, refetchInterval: 15_000 })
}

export function useCourierDelivery(orderId: string | undefined) {
  const { admin } = useServices()
  const id = useCourierSession((s) => s.courierId)
  return useQuery({ networkMode: 'always', queryKey: ['courier', 'delivery', id, orderId], queryFn: () => admin.courier.get(id!, orderId!), enabled: !!id && !!orderId })
}

export function useCourierHistory() {
  const { admin } = useServices()
  const id = useCourierSession((s) => s.courierId)
  return useQuery({ networkMode: 'always', queryKey: ['courier', 'history', id], queryFn: () => admin.courier.history(id!), enabled: !!id })
}

export function useCourierProfile() {
  const { admin } = useServices()
  const id = useCourierSession((s) => s.courierId)
  return useQuery({ networkMode: 'always', queryKey: ['courier', 'profile', id], queryFn: () => admin.courier.profile(id!), enabled: !!id })
}

/** Qualquer passo muda a lista, o detalhe, o histórico e (na gestão) o painel de entregas. */
export function useInvalidateCourier() {
  const client = useQueryClient()
  return () => client.invalidateQueries()
}
