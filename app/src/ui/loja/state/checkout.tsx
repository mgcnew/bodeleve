import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hypotheses } from '@/config/hypotheses'
import type { Address, Fulfillment, PaymentMethod } from '@/domain/order'
import { readJSON, writeJSON } from '@/lib/storage'

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
  windowId: hypotheses.deliveryWindows[0].id,
  payment: 'pix',
  changeFor: '',
}

type Checkout = {
  draft: CheckoutDraft
  update: (patch: Partial<CheckoutDraft>) => void
  feeCents: number
  windowLabel: string
}

// Os dados de contato e endereço ficam no aparelho para a próxima compra
const KEY = 'bodeleve.checkout'
const CheckoutContext = createContext<Checkout | null>(null)

export function windowsFor(fulfillment: Fulfillment) {
  return fulfillment === 'delivery' ? hypotheses.deliveryWindows : hypotheses.pickupWindows
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CheckoutDraft>(() => ({ ...initial, ...readJSON<Partial<CheckoutDraft>>(KEY, {}) }))

  useEffect(() => writeJSON(KEY, draft), [draft])

  const value = useMemo<Checkout>(() => {
    const windows = windowsFor(draft.fulfillment)
    const win = windows.find((w) => w.id === draft.windowId) ?? windows[0]
    return {
      draft,
      update: (patch) => setDraft((d) => ({ ...d, ...patch })),
      feeCents: draft.fulfillment === 'delivery' ? hypotheses.deliveryFee : hypotheses.pickupFee,
      windowLabel: `${win.title} · ${win.sub.charAt(0).toLowerCase()}${win.sub.slice(1)}`,
    }
  }, [draft])

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

export function useCheckout() {
  const checkout = useContext(CheckoutContext)
  if (!checkout) throw new Error('useCheckout fora de CheckoutProvider')
  return checkout
}
