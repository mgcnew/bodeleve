import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Address, Contact, Fulfillment, PaymentMethod } from '@/domain/types'

/** Sacola e rascunho do checkout. Ficam neste aparelho (localStorage); compra como convidado não exige conta (D5, H5). */

type BagState = {
  items: Record<string, number>
  fulfillment: Fulfillment
  add: (productId: string, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
  setFulfillment: (f: Fulfillment) => void
}

export const useBag = create<BagState>()(
  persist(
    (set) => ({
      items: {},
      fulfillment: 'delivery',
      add: (productId, qty = 1) => set((s) => ({ items: { ...s.items, [productId]: (s.items[productId] ?? 0) + qty } })),
      setQty: (productId, qty) =>
        set((s) => {
          const items = { ...s.items }
          if (qty <= 0) delete items[productId]
          else items[productId] = qty
          return { items }
        }),
      clear: () => set({ items: {} }),
      setFulfillment: (fulfillment) => set({ fulfillment }),
    }),
    { name: 'bodeleve.bag' },
  ),
)

export const emptyAddress: Address = { cep: '', street: '', number: '', complement: '', district: '', reference: '' }

type CheckoutState = {
  contact: Contact
  address: Address
  deliveryWindowId: string
  pickupWindowId: string
  paymentMethod: PaymentMethod
  /** "Troco para quanto?", como digitado. */
  changeFor: string
  setContact: (c: Partial<Contact>) => void
  setAddress: (a: Partial<Address>) => void
  setDeliveryWindow: (id: string) => void
  setPickupWindow: (id: string) => void
  setPayment: (m: PaymentMethod) => void
  setChangeFor: (text: string) => void
  reset: () => void
}

const initial = {
  contact: { name: '', phone: '' },
  address: emptyAddress,
  deliveryWindowId: 'asap',
  pickupWindowId: 'asap',
  paymentMethod: 'pix' as PaymentMethod,
  changeFor: '',
}

export const useCheckout = create<CheckoutState>()(
  persist(
    (set) => ({
      ...initial,
      setContact: (c) => set((s) => ({ contact: { ...s.contact, ...c } })),
      setAddress: (a) => set((s) => ({ address: { ...s.address, ...a } })),
      setDeliveryWindow: (deliveryWindowId) => set({ deliveryWindowId }),
      setPickupWindow: (pickupWindowId) => set({ pickupWindowId }),
      setPayment: (paymentMethod) => set({ paymentMethod, ...(paymentMethod === 'cash' ? {} : { changeFor: '' }) }),
      setChangeFor: (changeFor) => set({ changeFor }),
      // Depois de confirmar, guarda contato e endereço para a próxima compra; limpa só o que é do pedido.
      reset: () => set((s) => ({ ...initial, contact: s.contact, address: s.address })),
    }),
    { name: 'bodeleve.checkout' },
  ),
)

export type SessionState = {
  phone: string | null
  signIn: (phone: string) => void
  signOut: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      phone: null,
      signIn: (phone) => set({ phone }),
      signOut: () => set({ phone: null }),
    }),
    { name: 'bodeleve.session' },
  ),
)
