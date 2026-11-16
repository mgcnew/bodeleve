import { accountById, courierSessionStore } from '@/services/entregas'

/** O entregador logado (a rota já exige sessão) */
export function useCourier() {
  const session = courierSessionStore.useStore()
  const account = session ? accountById(session.courierId) : null
  return { session, account }
}
