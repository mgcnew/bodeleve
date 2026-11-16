// Sessão da equipe (H-G1: e-mail e senha). Hoje simulada no aparelho;
// com o Supabase vira supabase.auth.signInWithPassword + leitura de `memberships`.
import { createStore } from '@/lib/store'
import type { Role } from '@/permissions/roles'
import { delay } from '../delay'

export type StaffSession = { name: string; email: string; role: Role; establishment: string }

export const sessionStore = createStore<StaffSession | null>('bodeleve.gestao.sessao', () => null)

export async function signIn(email: string, password: string): Promise<StaffSession> {
  await delay(500)
  if (!email.includes('@') || password.length < 4) throw new Error('credenciais')
  const session: StaffSession = { name: 'Ana', email, role: 'owner', establishment: 'Bodeleve' }
  sessionStore.set(session)
  return session
}

export function signOut() {
  sessionStore.set(null)
}
