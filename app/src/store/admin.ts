import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser } from '@/services/types'

/** Sessão da equipe neste aparelho. Com o Supabase (D19) a sessão passa a ser do Auth; a interface não muda. */
type AdminSession = {
  user: AdminUser | null
  signIn: (user: AdminUser) => void
  signOut: () => void
}

export const useAdminSession = create<AdminSession>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
    }),
    { name: 'bodeleve.admin.session' },
  ),
)
