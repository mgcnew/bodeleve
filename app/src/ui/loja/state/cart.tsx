import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '@/domain/catalog'
import { readJSON, writeJSON } from '@/lib/storage'

export type CartLine = {
  productId: string
  name: string
  sizeLabel: string
  unitPriceCents: number
  quantity: number
  photoUrl?: string | null
}

type Cart = {
  lines: CartLine[]
  count: number
  subtotalCents: number
  add: (product: Product, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
}

const KEY = 'bodeleve.sacola'
const CartContext = createContext<Cart | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readJSON<CartLine[]>(KEY, []))

  useEffect(() => writeJSON(KEY, lines), [lines])

  const add = useCallback((product: Product, quantity = 1) => {
    setLines((current) => {
      const found = current.find((l) => l.productId === product.id)
      if (found) {
        return current.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + quantity } : l))
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          sizeLabel: product.sizeLabel,
          unitPriceCents: product.priceCents,
          quantity,
          photoUrl: product.photoUrl ?? null,
        },
      ]
    })
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    )
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<Cart>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalCents: lines.reduce((n, l) => n + l.quantity * l.unitPriceCents, 0),
      add,
      setQuantity,
      clear,
    }),
    [lines, add, setQuantity, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart fora de CartProvider')
  return cart
}
