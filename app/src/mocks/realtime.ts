import type { RealtimeService, RealtimeTopic } from '@/services/types'
import type { MockDb } from './db'

const snapshot = (db: MockDb): Record<RealtimeTopic, string> => {
  const st = db.read()
  return {
    orders: JSON.stringify(st.orders),
    deliveries: JSON.stringify([st.deliveries, st.couriers]),
    stock: JSON.stringify([st.movements, st.lots]),
    cash: JSON.stringify([st.cashSessions, st.posSales]),
  }
}

/**
 * Realtime SIMULADO: o banco simulado fica no armazenamento do navegador, e o navegador avisa as outras abas quando ele muda
 * (evento `storage`). Compara o antes e o depois para dizer o que mudou. Sem armazenamento (testes), só reage a eventos disparados à mão.
 */
export function createMockRealtime(db: MockDb): RealtimeService {
  const listeners = new Set<(topics: RealtimeTopic[]) => void>()
  let last: Record<RealtimeTopic, string> | null = null
  const handle = () => {
    const next = snapshot(db)
    const prev = last ?? next
    last = next
    const changed = (Object.keys(next) as RealtimeTopic[]).filter((k) => next[k] !== prev[k])
    if (changed.length) listeners.forEach((l) => l(changed))
  }
  return {
    onChange(listener) {
      if (typeof window === 'undefined') return () => undefined
      if (listeners.size === 0) {
        last = snapshot(db)
        window.addEventListener('storage', handle)
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) window.removeEventListener('storage', handle)
      }
    },
  }
}
