import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Address, Fulfillment, PaymentMethod } from '@/domain/order'
import { readJSON, writeJSON } from '@/lib/storage'
import type { TimeWindow } from '@/services/store'
import { defaultStoreInfo } from '@/services/store'
import { useStoreInfo } from './storeInfo'

export type CheckoutDraft = {
  name: string
  phone: string
  fulfillment: Fulfillment
  address: Address | null
  windowId: string
  payment: PaymentMethod
  changeFor: string
}

const initial: CheckoutDraft = {
  name: '',
  phone: '',
  fulfillment: 'delivery',
  address: null,
  windowId: defaultStoreInfo.deliveryWindows[0].id,
  payment: 'pix',
  changeFor: '',
}

type Checkout = {
  draft: CheckoutDraft
  update: (patch: Partial<CheckoutDraft>) => void
  feeCents: number
  windowLabel: string
  /** janela escolhida, já conferida contra as janelas atuais da casa */
  windowId: string
  windowsFor: (fulfillment: Fulfillment) => TimeWindow[]
}

// Os dados de contato e endereço ficam no aparelho para a próxima compra
const KEY = 'bodeleve.checkout'
const CheckoutContext = createContext<Checkout | null>(null)

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const info = useStoreInfo()
  const [draft, setDraft] = useState<CheckoutDraft>(() => ({ ...initial, ...readJSON<Partial<CheckoutDraft>>(KEY, {}) }))

  useEffect(() => writeJSON(KEY, draft), [draft])

  const value = useMemo<Checkout>(() => {
    const windowsFor = (f: Fulfillment) => (f === 'delivery' ? info.deliveryWindows : info.pickupWindows)
    const windows = windowsFor(draft.fulfillment)
    const win = windows.find((w) => w.id === draft.windowId) ?? windows[0]
    return {
      draft,
      update: (patch) => setDraft((d) => ({ ...d, ...patch })),
      // H-L1/H-L2 — taxa vem da casa; retirada sem custo
      feeCents: draft.fulfillment === 'delivery' ? info.feeCents : 0,
      windowLabel: `${win.title} · ${win.sub.charAt(0).toLowerCase()}${win.sub.slice(1)}`,
      windowId: win.id,
      windowsFor,
    }
  }, [draft, info])

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

export function useCheckout() {
  const checkout = useContext(CheckoutContext)
  if (!checkout) throw new Error('useCheckout fora de CheckoutProvider')
  return checkout
}
