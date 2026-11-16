import type { Role } from '@/permissions'
import type { AdminAuthService, AdminUser } from '@/services/types'
import type { Db } from './client'

/**
 * Entrada da equipe (H-G1) com o Auth do Supabase: e-mail e senha. Depois de entrar, o papel vem do vínculo da pessoa com a casa
 * (`memberships`), nunca do aparelho. Conta sem vínculo ativo ou de entregador não entra na Gestão.
 */
export function createSupabaseAdminAuth(client: Db): AdminAuthService & { signOut(): Promise<void>; current(): Promise<AdminUser | null> } {
  async function load(id: string, email: string): Promise<AdminUser | null> {
    const { data } = await client
      .from('memberships')
      .select('role, display_name, establishment_id')
      .eq('user_id', id)
      .eq('status', 'active')
      .neq('role', 'courier')
      .limit(1)
      .maybeSingle()
    if (!data) return null
    return { id, name: data.display_name?.trim() || email.split('@')[0], email, role: data.role as Role }
  }

  return {
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (error || !data.user) throw new Error('invalid_credentials')
      const user = await load(data.user.id, data.user.email ?? email)
      if (!user) {
        await client.auth.signOut()
        throw new Error('invalid_credentials')
      }
      return user
    },
    async signOut() {
      await client.auth.signOut()
    },
    async current() {
      const { data } = await client.auth.getUser()
      return data.user ? load(data.user.id, data.user.email ?? '') : null
    },
  }
}
