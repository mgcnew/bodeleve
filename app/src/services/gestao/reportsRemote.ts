// Vendas para os relatórios e o Início: os pedidos não cancelados desde o começo do mês (ou dos últimos 7 dias, o que
// vier antes), buscados em páginas de 1000 linhas. A conta fica em `domain/reports.ts`.
import type { SalesRow } from '@/domain/reports'
import { createStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export const salesRowsStore = createStore<SalesRow[]>('bodeleve.gestao.vendas.remoto', () => [])

const PAGE = 1000
let loading: Promise<void> | null = null
let rerun: Promise<void> | null = null

export async function refreshSales(): Promise<void> {
  if (!supabase) return
  if (loading) {
    rerun ??= loading.catch(() => undefined).then(() => {
      rerun = null
      return refreshSales()
    })
    return rerun
  }
  loading = (async () => {
    const now = new Date()
    const from = new Date(Math.min(new Date(now.getFullYear(), now.getMonth(), 1).getTime(), new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime()))
    const rows: SalesRow[] = []
    for (let start = 0; start < 20 * PAGE; start += PAGE) {
      const { data, error } = await supabase!
        .from('orders')
        .select('created_at, channel, total_cents, payment_method, payments(method, cents), order_items(name, qty, kind, total_cents)')
        .neq('status', 'cancelled')
        .gte('created_at', from.toISOString())
        .order('created_at', { ascending: false })
        .range(start, start + PAGE - 1)
      if (error || !data) return
      rows.push(...(data as unknown as SalesRow[]))
      if (data.length < PAGE) break
    }
    salesRowsStore.set(rows)
  })().finally(() => {
    loading = null
  })
  return loading
}
