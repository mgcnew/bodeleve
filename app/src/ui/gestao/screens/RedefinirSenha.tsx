import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { supabase } from '@/lib/supabase'
import { accountErrorMessage, finishPasswordReset } from '@/services/account'
import { AuthLayout } from '../../shared/AuthLayout'

// Destino do link do e-mail de recuperação: o Supabase abre uma sessão temporária e aqui se grava a senha nova
export function RedefinirSenha() {
  const navigate = useNavigate()
  const area = useSearchParams()[0].get('de') === 'entregas' ? 'entregas' : 'gestao'
  const [ready, setReady] = useState<boolean | null>(supabase ? null : false)
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) return
    // o link entra como sessão de recuperação; se não houver, o link venceu ou já foi usado
    void supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next.length < 8) return setError('A senha nova precisa de pelo menos 8 caracteres.')
    if (next !== again) return setError('As duas senhas não são iguais.')
    setBusy(true)
    setError(undefined)
    try {
      await finishPasswordReset(next)
      navigate(`/${area}/entrar`, { replace: true })
    } catch (err) {
      setError(accountErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout area={area === 'entregas' ? 'Entregas' : 'Gestão da casa'}>
      <form onSubmit={(e) => void submit(e)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ font: 'var(--titulo-xl)' }}>Senha nova</div>
        {ready === false ? (
          <>
            <Banner tone="error">Este link venceu ou já foi usado. Peça um novo.</Banner>
            <Button size="l" block onClick={() => navigate(`/gestao/esqueci-senha?de=${area}`)}>
              Pedir novo link
            </Button>
          </>
        ) : (
          <>
            <TextField label="Senha nova" type="password" autoComplete="new-password" help="Pelo menos 8 caracteres" value={next} onChange={(e) => { setNext(e.target.value); setError(undefined) }} />
            <TextField label="Repita a senha nova" type="password" autoComplete="new-password" value={again} error={error} onChange={(e) => { setAgain(e.target.value); setError(undefined) }} />
            <Button type="submit" size="l" block disabled={busy || ready === null}>
              Salvar senha
            </Button>
          </>
        )}
      </form>
    </AuthLayout>
  )
}
