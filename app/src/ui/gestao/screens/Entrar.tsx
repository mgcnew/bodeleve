import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { sessionStore, signIn } from '@/services/gestao/session'
import o from '@/styles/ops.module.css'

// H-G1 — equipe entra com e-mail e senha; só dono ou gestor cadastra pessoas
export function Entrar() {
  const session = sessionStore.useStore()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/gestao'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center', background: 'var(--fundo-operacao)' }}>
      <form
        onSubmit={submit}
        noValidate
        style={{ flex: '1 1 auto', maxWidth: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, padding: '24px 20px' }}
      >
        <div>
          <div style={{ font: 'var(--titulo-xl)', letterSpacing: '-0.01em' }}>Bodeleve</div>
          <div className={o.muted}>Gestão da casa</div>
        </div>
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
        <p className={o.muted}>Acesso só para a equipe. Quem cadastra novas pessoas é o dono ou o gestor.</p>
      </form>
    </div>
  )
}
