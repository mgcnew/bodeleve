import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useServices } from '@/services'

export function usePosOverview() {
  const { admin } = useServices()
  return useQuery({ networkMode: 'always', queryKey: ['pos', 'overview'], queryFn: () => admin.pos.overview() })
}

export function usePosCatalog() {
  const { admin } = useServices()
  return useQuery({ networkMode: 'always', queryKey: ['pos', 'catalog'], queryFn: () => admin.pos.catalog() })
}

export function usePosSales(filter: 'all' | 'cash' | 'pix' | 'card') {
  const { admin } = useServices()
  return useQuery({ networkMode: 'always', queryKey: ['pos', 'sales', filter], queryFn: () => admin.pos.sales(filter) })
}

export function usePosSale(id: string | undefined) {
  const { admin } = useServices()
  return useQuery({ networkMode: 'always', queryKey: ['pos', 'sale', id], queryFn: () => admin.pos.getSale(id!), enabled: !!id })
}

export function usePosCash() {
  const { admin } = useServices()
  return useQuery({ networkMode: 'always', queryKey: ['pos', 'cash'], queryFn: () => admin.pos.cash() })
}

/**
 * Os dados do balcão vêm do aparelho (e, com o Supabase, de uma cópia local): a consulta roda mesmo sem conexão,
 * em vez de ficar parada esperando a rede (networkMode 'always').
 */
/** Depois de vender, cancelar ou mexer no caixa, tudo o que o balcão mostra (e Início, Estoque e Financeiro) muda. */
export function useInvalidatePos() {
  const client = useQueryClient()
  return () => client.invalidateQueries()
}

/** Conexão do aparelho. Vendas feitas sem ela ficam marcadas e seguem quando voltar (H-I89). */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
