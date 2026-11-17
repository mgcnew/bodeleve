// Entregadores e atribuição de entregas no banco. A gestão lê `couriers` e as entregas em andamento
// (`deliveries`) e atribui com `delivery_assign` / `delivery_unassign`, que só aceitam pedido pronto,
// entregador próprio da casa e uma entrega ativa por pedido.
import type { Courier } from '@/domain/backoffice'
import { supabase } from '@/lib/supabase'
import { couriersStore } from './people'
import { refreshStaffOrders } from './ordersRemote'

type CourierRow = { id: string; name: string; kind: 'own' | 'partner'; available: boolean }
type ActiveDelivery = { courier_id: string | null; status: string; orders: { number: string } | { number: string }[] | null }

const one = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] : v) ?? null

let loading: Promise<void> | null = null
let rerun: Promise<void> | null = null

export async function refreshCouriers(): Promise<void> {
  if (!supabase) return
  if (loading) {
    rerun ??= loading.catch(() => undefined).then(() => {
      rerun = null
      return refreshCouriers()
    })
    return rerun
  }
  loading = (async () => {
    const [cs, ds] = await Promise.all([
      supabase!.from('couriers').select('id, name, kind, available').order('name'),
      supabase!.from('deliveries').select('courier_id, status, orders(number)').in('status', ['reserved', 'assigned', 'accepted', 'en_route']),
    ])
    if (cs.error || !cs.data) return
    const active = ((ds.data ?? []) as unknown as ActiveDelivery[]).filter((d) => d.courier_id)
    const rows = cs.data as CourierRow[]

    const own: Courier[] = rows
      .filter((c) => c.kind === 'own')
      .map((c) => {
        const mine = active.filter((d) => d.courier_id === c.id)
        const route = mine.find((d) => d.status === 'en_route')
        const waiting = mine.filter((d) => d.status !== 'en_route').map((d) => `#${one(d.orders)?.number ?? ''}`)
        if (route) return { id: c.id, name: c.name, kind: 'own', status: 'en_route', note: `em rota com #${one(route.orders)?.number ?? ''}${waiting.length ? ` · depois ${waiting.join(', ')}` : ''}` }
        if (!c.available) return { id: c.id, name: c.name, kind: 'own', status: 'offline', note: 'indisponível' }
        return { id: c.id, name: c.name, kind: 'own', status: 'available', note: waiting.length ? `com ${waiting.join(', ')} para sair` : 'na loja' }
      })
    const online = rows.filter((c) => c.kind === 'partner' && c.available).length
    const partners: Courier[] = rows.some((c) => c.kind === 'partner')
      ? [{ id: 'parceiros', name: 'Parceiros', kind: 'partner', status: 'online', note: `${online} com o app aberto agora` }]
      : []
    couriersStore.set([...own, ...partners])
  })().finally(() => {
    loading = null
  })
  return loading
}

async function afterChange() {
  await Promise.all([refreshStaffOrders(), refreshCouriers()])
}

/** `courierId` nulo publica a entrega para os parceiros */
export async function remoteAssign(orderId: string, courierId: string | null) {
  const { error } = await supabase!.rpc('delivery_assign', { p_order: orderId, p_courier: courierId })
  if (error) throw error
  await afterChange()
}

export async function remoteUnassign(orderId: string) {
  const { error } = await supabase!.rpc('delivery_unassign', { p_order: orderId })
  if (error) throw error
  await afterChange()
}

export function deliveryErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  if (msg.includes('already_assigned')) return 'Este pedido já tem um entregador. A tela foi atualizada.'
  if (msg.includes('not_ready')) return 'O pedido ainda não está pronto para sair.'
  if (msg.includes('no_assignment')) return 'Não há envio para desfazer, ou o entregador já saiu com o pedido.'
  if (msg.includes('forbidden')) return 'Seu papel não permite esta ação.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}
