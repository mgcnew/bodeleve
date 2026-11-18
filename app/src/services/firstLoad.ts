// Primeira carga de cada área com o Supabase: enquanto os dados não chegam, as telas mostram esqueleto
// no lugar de "nenhum registro". Sem Supabase (dados de exemplo) a tela já nasce pronta.
import { useEffect, useState, useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase'

const loaded = new Set<string>()
const listeners = new Set<() => void>()
let version = 0

const emit = () => {
  version++
  listeners.forEach((l) => l())
}

/** Chamado quando a primeira busca de uma fonte termina (com sucesso ou não) */
export function markLoaded(key: string) {
  if (loaded.has(key)) return
  loaded.add(key)
  emit()
}

/** Ao sair da conta, a próxima entrada volta a mostrar o esqueleto até chegar o dado novo */
export function resetLoaded() {
  if (loaded.size === 0) return
  loaded.clear()
  emit()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Passa a valer quando todas as fontes chegaram; depois de `maxMs` libera mesmo sem internet */
export function useFirstLoad(keys: string[], maxMs = 8000): boolean {
  useSyncExternalStore(subscribe, () => version)
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), maxMs)
    return () => clearTimeout(t)
  }, [maxMs])
  if (!supabase) return true
  return timedOut || keys.every((k) => loaded.has(k))
}
