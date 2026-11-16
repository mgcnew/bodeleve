// Sessão da equipe (H-G1: e-mail e senha). Com o Supabase ligado usa o Auth e lê o papel em
// `memberships`; sem ele, simula no aparelho para o desenvolvimento.
import { createStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { Role } from '@/permissions/roles'
import { delay } from '../delay'

export type StaffSession = { name: string; email: string; role: Role; establishment: string }

export const sessionStore = createStore<StaffSession | null>('bodeleve.gestao.sessao', () => null)

async function loadMembership(email: string): Promise<StaffSession> {
  const { data, error } = await supabase!
    .from('memberships')
    .select('role, status, display_name, establishments(name)')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (error || !data) throw new Error('sem acesso')
  const est = data.establishments as { name?: string } | { name?: string }[] | null
  const establishment = (Array.isArray(est) ? est[0]?.name : est?.name) ?? 'Bodeleve'
  return { name: data.display_name || email.split('@')[0], email, role: data.role as Role, establishment }
}

export async function signIn(email: string, password: string): Promise<StaffSession> {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) throw new Error('credenciais')
    try {
      const session = await loadMembership(data.user.email ?? email)
      sessionStore.set(session)
      return session
    } catch (e) {
      await supabase.auth.signOut()
      throw e
    }
  }
  await delay(500)
  if (!email.includes('@') || password.length < 4) throw new Error('credenciais')
  const session: StaffSession = { name: 'Ana', email, role: 'owner', establishment: 'Bodeleve' }
  sessionStore.set(session)
  return session
}

export function signOut() {
  sessionStore.set(null)
  void supabase?.auth.signOut()
}

/** Confere ao abrir o app que a sessão guardada ainda vale no Auth; se expirou, sai */
export async function restoreSession() {
  if (!supabase || !sessionStore.get()) return
  const { data } = await supabase.auth.getSession()
  if (!data.session) sessionStore.set(null)
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') sessionStore.set(null)
  })
}
