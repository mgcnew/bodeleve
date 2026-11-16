import { useSyncExternalStore } from 'react'
import { readJSON, writeJSON } from './storage'

/**
 * Estado compartilhado entre telas, guardado no aparelho.
 * Faz o papel do banco enquanto o Supabase não está ligado.
 */
export function createStore<T>(key: string, initial: () => T) {
  let state: T = readJSON<T | null>(key, null) ?? initial()
  const listeners = new Set<() => void>()

  const get = () => state
  const set = (next: T | ((s: T) => T)) => {
    state = typeof next === 'function' ? (next as (s: T) => T)(state) : next
    writeJSON(key, state)
    listeners.forEach((l) => l())
  }
  const subscribe = (l: () => void) => {
    listeners.add(l)
    return () => listeners.delete(l)
  }
  const reset = () => set(initial())

  function useStore(): T {
    return useSyncExternalStore(subscribe, get, get)
  }

  return { get, set, subscribe, reset, useStore }
}
