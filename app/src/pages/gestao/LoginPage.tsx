import { useState, type FormEvent } from 'react'
import { isPreview } from '@/config/preview'
import { Navigate, useNavigate } from 'react-router-dom'
import { Banner, Button, TextField } from '@/components'
import { adminUsers, MOCK_ADMIN_PASSWORD } from '@/mocks/adminSeed'
import { can } from '@/permissions'
import { useServices } from '@/services'
import { useAdminSession } from '@/store/admin'
import { homeFor } from '@/ui/gestao/modules'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { admin } = useServices()
  const user = useAdminSession((x) => x.user)
  const signIn = useAdminSession((x) => x.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor((m) => can(user.role, m))} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setFailed(false)
    try {
      const u = await admin.auth.signIn(email, password)
      signIn(u)
      navigate(homeFor((m) => can(u.role, m)), { replace: true })
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', background: 'var(--fundo-operacao)' }}>
      <form className={s.loginMain} onSubmit={submit} noValidate>
        <div>
          <div className={s.loginBrand}>Bodeleve</div>
          <div className={l.sub}>Gestão da casa</div>
        </div>
        <TextField label="E-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {failed && <Banner tone="error">E-mail ou senha incorretos. Confira e tente de novo.</Banner>}
        <Button type="submit" size="lg" fullWidth loading={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button>
        <div className={l.sub}>Acesso só para a equipe. Quem cadastra novas pessoas é o dono ou o gestor.</div>
        {isPreview && (
          <Banner tone="warning">
            Só em desenvolvimento (nada é enviado). Senha de todos: {MOCK_ADMIN_PASSWORD}. Contas: {adminUsers.map((u) => u.email).join(', ')}.
          </Banner>
        )}
      </form>
    </main>
  )
}
