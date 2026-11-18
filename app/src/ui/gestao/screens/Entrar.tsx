import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { sessionStore, signIn } from '@/services/gestao/session'
import o from '@/styles/ops.module.css'
import { AuthLayout } from '../../shared/AuthLayout'

// H-G1 — equipe entra com e-mail e senha; só dono ou gestor cadastra pessoas
export function Entrar() {
  const session = sessionStore.useStore()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/gestao'
  // só no desenvolvimento: preenche o usuário de teste definido em .env.local (nunca vai ao Git)
  const [email, setEmail] = useState(import.meta.env.DEV ? (import.meta.env.VITE_DEV_STAFF_EMAIL ?? '') : '')
  const [password, setPassword] = useState(import.meta.env.DEV ? (import.meta.env.VITE_DEV_STAFF_PASSWORD ?? '') : '')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)

  if (session) return <Navigate to={from} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setFailed(false)
    try {
      await signIn(email.trim(), password)
      navigate(from, { replace: true })
    } catch {
      setFailed(true)
      setSending(false)
    }
  }

  return (
    <AuthLayout area="Gestão da casa">
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ font: 'var(--titulo-xl)' }}>Entrar</div>
        <TextField label="E-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {failed && <Banner tone="error">E-mail ou senha não conferem. Confira e tente de novo.</Banner>}
        {sending ? (
          <Button size="l" block loading>
            Entrando…
          </Button>
        ) : (
          <Button type="submit" size="l" block>
            Entrar
          </Button>
        )}
        <Link to="/gestao/esqueci-senha" className={o.muted} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start' }}>
          Esqueci minha senha
        </Link>
        <p className={o.muted}>Acesso só para a equipe. Quem cadastra novas pessoas é o dono ou o gestor.</p>
      </form>
    </AuthLayout>
  )
}
