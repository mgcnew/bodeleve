import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Db } from './client'
import { createSupabaseRealtime } from './realtime'

function fakeClient() {
  const handlers: Array<{ table: string; cb: () => void }> = []
  const log = { subscribed: 0, removed: 0 }
  const channel = {
    on: (_t: string, f: { table: string }, cb: () => void) => { handlers.push({ table: f.table, cb }); return channel },
    subscribe: () => { log.subscribed++; return channel },
  }
  const client = { channel: () => channel, removeChannel: () => { log.removed++ } } as unknown as Db
  return { client, handlers, log }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('atualização ao vivo sobre o banco', () => {
  it('junta as mudanças próximas, avisa por assunto e esquece o cache de leitura antes', () => {
    const { client, handlers } = fakeClient()
    const onEvent = vi.fn()
    const rt = createSupabaseRealtime(client, { onEvent, pollMs: 60_000 })
    const got: string[][] = []
    const off = rt.onChange((t) => got.push(t))
    expect(handlers.map((h) => h.table)).toEqual(['orders', 'deliveries', 'stock_movements', 'cash_sessions', 'cash_movements'])
    handlers[0].cb(); handlers[0].cb(); handlers[2].cb()
    vi.advanceTimersByTime(300)
    expect(onEvent).toHaveBeenCalledTimes(1)
    expect(got).toEqual([['orders', 'stock']])
    off()
  })

  it('abre um canal só, solta quando o último sai e relê de tempos em tempos', () => {
    const { client, log } = fakeClient()
    const rt = createSupabaseRealtime(client, { pollMs: 1000 })
    const got: string[][] = []
    const a = rt.onChange((t) => got.push(t))
    const b = rt.onChange(() => undefined)
    expect(log.subscribed).toBe(1)
    vi.advanceTimersByTime(1300)
    expect(got).toEqual([['orders']])
    a()
    expect(log.removed).toBe(0)
    b()
    expect(log.removed).toBe(1)
    vi.advanceTimersByTime(5000)
    expect(got).toHaveLength(1)
  })
})
