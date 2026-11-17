import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { accountErrorMessage, requestPasswordReset } from '@/services/account'
import o from '@/styles/ops.module.css'

// Recuperar senha (equipe e entregador): manda um link por e-mail que abre /gestao/redefinir-senha
export function EsqueciSenha() {
  const area = useSearchParams()[0].get('de') === 'entregas' ? 'entregas' : 'gestao'
  const login = `/${area}/entrar`
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Informe o e-mail do seu acesso.')
    setBusy(true)
    setError(undefined)
    try {
      await requestPasswordReset(email, `/gestao/redefinir-senha?de=${area}`)
      setSent(true)
    } catch (err) {
      setError(accountErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center', background: 'var(--fundo-operacao)' }}>
      <form onSubmit={(e) => void submit(e)} noValidate style={{ flex: '1 1 auto', maxWidth: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, padding: '24px 20px' }}>
        <div>
          <div style={{ font: 'var(--titulo-xl)', letterSpacing: '-0.01em' }}>Esqueci minha senha</div>
          <div className={o.muted}>Enviamos um link para você criar uma senha nova.</div>
        </div>
        {sent ? (
          <Banner tone="success">Se esse e-mail tem acesso, o link já está a caminho. Confira também a caixa de spam.</Banner>
        ) : (
          <>
            <TextField label="E-mail do acesso" type="email" autoComplete="username" value={email} error={error} onChange={(e) => { setEmail(e.target.value); setError(undefined) }} />
            <Button type="submit" size="l" block disabled={busy}>
              Enviar link
            </Button>
          </>
        )}
        <Link to={login} className={o.muted} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
          Voltar para entrar
        </Link>
      </form>
    </div>
  )
}
