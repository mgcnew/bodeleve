// Dados públicos da casa: taxa, janelas de entrega e retirada, endereço, horários e WhatsApp.
// Com o Supabase ligado vêm de `store_info`; sem ele, das hipóteses e dos textos de exemplo.
import { hypotheses, STORE_SLUG } from '@/config/hypotheses'
import { supabase } from '@/lib/supabase'
import { establishment as placeholders } from '@/mocks/establishment'

export type TimeWindow = { id: string; title: string; sub: string }

export type StoreInfo = {
  name: string
  address: string
  whatsapp: string
  hours: { weekdays: string; saturday: string; sunday: string }
  feeCents: number
  deliveryWindows: TimeWindow[]
  pickupWindows: TimeWindow[]
}

export const defaultStoreInfo: StoreInfo = {
  name: placeholders.name,
  address: placeholders.address,
  whatsapp: placeholders.whatsapp,
  hours: { weekdays: '', saturday: '', sunday: '' },
  feeCents: hypotheses.deliveryFee,
  deliveryWindows: hypotheses.deliveryWindows.map((w) => ({ ...w })),
  pickupWindows: hypotheses.pickupWindows.map((w) => ({ ...w })),
}

type RawWindow = { id: string; label: string; detail?: string }
type Raw = {
  name?: string
  address?: string
  whatsapp?: string
  hours?: Partial<StoreInfo['hours']>
  delivery_fee_cents?: number
  delivery_windows?: RawWindow[]
  pickup_windows?: RawWindow[]
}

const windows = (list: RawWindow[] | undefined, fallback: TimeWindow[]) =>
  list && list.length > 0 ? list.map((w) => ({ id: w.id, title: w.label, sub: w.detail ?? '' })) : fallback

export async function getStoreInfo(): Promise<StoreInfo> {
  if (!supabase) return defaultStoreInfo
  const { data, error } = await supabase.rpc('store_info', { p_slug: STORE_SLUG })
  if (error || !data) return defaultStoreInfo
  const r = data as Raw
  return {
    // campos vazios no banco continuam como marcadores [entre colchetes] até o dono preencher
    name: r.name || defaultStoreInfo.name,
    address: r.address || defaultStoreInfo.address,
    whatsapp: r.whatsapp || defaultStoreInfo.whatsapp,
    hours: { weekdays: r.hours?.weekdays ?? '', saturday: r.hours?.saturday ?? '', sunday: r.hours?.sunday ?? '' },
    feeCents: typeof r.delivery_fee_cents === 'number' ? r.delivery_fee_cents : defaultStoreInfo.feeCents,
    deliveryWindows: windows(r.delivery_windows, defaultStoreInfo.deliveryWindows),
    pickupWindows: windows(r.pickup_windows, defaultStoreInfo.pickupWindows),
  }
}

export function hoursText(h: StoreInfo['hours']) {
  const parts = [h.weekdays && `Seg a sex ${h.weekdays}`, h.saturday && `Sáb ${h.saturday}`, h.sunday && `Dom ${h.sunday}`].filter(Boolean)
  return parts.length ? parts.join(' · ') : placeholders.hours
}
