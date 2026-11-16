import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Quem está usando o app de Entregas neste aparelho. Com o Supabase (D19) vira a sessão do Auth; a interface não muda. */
type CourierSession = {
  courierId: string | null
  signIn: (id: string) => void
  signOut: () => void
}

export const useCourierSession = create<CourierSession>()(
  persist(
    (set) => ({
      courierId: null,
      signIn: (courierId) => set({ courierId }),
      signOut: () => set({ courierId: null }),
    }),
    { name: 'bodeleve.courier.session' },
  ),
)
