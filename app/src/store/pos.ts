import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartLine, DiscountKind } from '@/domain/pos'

/** Sacola do balcão neste aparelho. Sobrevive a recarregar a página (conexão ruim) e é esvaziada ao concluir a venda. */
type PosCart = {
  lines: CartLine[]
  discount: { kind: DiscountKind; reason: string } | null
  /** Soma 1 unidade (junta com a linha do mesmo produto). */
  addUnit: (itemId: string) => void
  /** Cada pesagem é uma linha. */
  addWeight: (itemId: string, kg: number) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  setDiscount: (d: { kind: DiscountKind; reason: string } | null) => void
  clear: () => void
}

let seq = 0
const newKey = (itemId: string) => `${itemId}-${Date.now().toString(36)}-${(seq += 1)}`

export const usePosCart = create<PosCart>()(
  persist(
    (set) => ({
      lines: [],
      discount: null,
      addUnit: (itemId) =>
        set((s) => {
          const i = s.lines.findIndex((l) => l.itemId === itemId && l.kind === 'unit')
          if (i >= 0) return { lines: s.lines.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l)) }
          return { lines: [...s.lines, { key: newKey(itemId), itemId, kind: 'unit', qty: 1 }] }
        }),
      addWeight: (itemId, kg) => set((s) => ({ lines: [...s.lines, { key: newKey(itemId), itemId, kind: 'weight', qty: kg }] })),
      setQty: (key, qty) => set((s) => ({ lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty } : l)) })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      setDiscount: (discount) => set({ discount }),
      clear: () => set({ lines: [], discount: null }),
    }),
    { name: 'bodeleve.pos.cart' },
  ),
)
