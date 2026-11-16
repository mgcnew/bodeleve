import type { RealtimeService, RealtimeTopic } from '@/services/types'
import type { Db } from './client'

const TABLES: Array<[string, RealtimeTopic]> = [
  ['orders', 'orders'], ['deliveries', 'deliveries'], ['stock_movements', 'stock'], ['cash_sessions', 'cash'], ['cash_movements', 'cash'],
]

/**
 * Atualização ao vivo pelo Realtime do Supabase: pedido novo, mudança de status, entrega e caixa chegam sem recarregar.
 * O Realtime só entrega o que a pessoa pode ler (as políticas do banco valem). Quem não lê as tabelas (quem acompanha o pedido sem conta, o entregador
 * que vê as entregas livres) recebe também uma releitura periódica enquanto a página está aberta.
 */
export function createSupabaseRealtime(client: Db, opts: { onEvent?: () => void; pollMs?: number; debounceMs?: number } = {}): RealtimeService {
  const listeners = new Set<(topics: RealtimeTopic[]) => void>()
  const pending = new Set<RealtimeTopic>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let poll: ReturnType<typeof setInterval> | undefined
  let channel: ReturnType<Db['channel']> | null = null

  const flush = () => {
    timer = undefined
    const topics = [...pending]
    pending.clear()
    opts.onEvent?.()
    listeners.forEach((l) => l(topics))
  }
  const push = (topic: RealtimeTopic) => {
    pending.add(topic)
    if (!timer) timer = setTimeout(flush, opts.debounceMs ?? 250)
  }

  const start = () => {
    channel = client.channel('bodeleve-live')
    for (const [table, topic] of TABLES) channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => push(topic))
    channel.subscribe()
    poll = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') push('orders')
    }, opts.pollMs ?? 45_000)
  }
  const stop = () => {
    if (channel) void client.removeChannel(channel)
    channel = null
    clearInterval(poll)
    clearTimeout(timer)
    timer = undefined
    pending.clear()
  }

  return {
    onChange(listener) {
      if (listeners.size === 0) start()
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) stop()
      }
    },
  }
}
