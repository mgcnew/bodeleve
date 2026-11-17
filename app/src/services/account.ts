// Conta de quem está logado (equipe e entregador): nome, senha, PIN e recuperação de senha.
// Sem o Supabase (dados de exemplo) as ações só valem no aparelho ou não fazem nada.
import { supabase } from '@/lib/supabase'
import { getEstablishmentId } from './gestao/backofficeRemote'
import { sessionStore } from './gestao/session'

export async function saveMyName(name: string) {
  const clean = name.trim()
  if (!clean) throw new Error('invalid_name')
  if (supabase) {
    const { error } = await supabase.rpc('set_my_name', { p_name: clean })
    if (error) throw error
  }
  sessionStore.set((s) => (s ? { ...s, name: clean } : s))
}

/** Confere a senha atual (entrando de novo com ela) antes de gravar a nova */
export async function changePassword(email: string, current: string, next: string) {
  if (!supabase) return
  const check = await supabase.auth.signInWithPassword({ email, password: current })
  if (check.error) throw new Error('wrong_password')
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) throw error
}

export async function saveMyPin(pin: string) {
  if (!supabase) return
  const { error } = await supabase.rpc('set_my_pin', { p_establishment: await getEstablishmentId(), p_pin: pin })
  if (error) throw error
}

/** Manda o e-mail de recuperação; `back` é o caminho do app que abre pelo link (precisa estar nas URLs permitidas do Auth) */
export async function requestPasswordReset(email: string, back: string) {
  if (!supabase) return
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}${back}` })
  if (error) throw error
}

/** Grava a senha nova de quem chegou pelo link do e-mail e encerra a sessão temporária */
export async function finishPasswordReset(next: string) {
  if (!supabase) return
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) throw error
  await supabase.auth.signOut()
}

export function accountErrorMessage(e: unknown) {
  const msg = String((e as { message?: string })?.message ?? '')
  const code = String((e as { code?: string })?.code ?? '')
  if (msg === 'wrong_password') return 'A senha atual não confere.'
  if (msg.includes('invalid_pin_format')) return 'O PIN deve ter de 4 a 8 números.'
  if (msg.includes('invalid_name') || msg === 'invalid_name') return 'Digite um nome de até 80 letras.'
  if (msg.includes('same_password') || msg.includes('different from the old')) return 'A senha nova precisa ser diferente da atual.'
  if (msg.toLowerCase().includes('weak') || msg.toLowerCase().includes('at least')) return 'Senha fraca. Use pelo menos 8 caracteres, com letras e números.'
  if (code === '42501') return 'Seu papel não permite esta ação.'
  if (msg.toLowerCase().includes('rate limit') || code === 'over_email_send_rate_limit') return 'Muitas tentativas. Espere alguns minutos e tente de novo.'
  return 'Não foi possível concluir. Nada foi alterado. Tente de novo.'
}
