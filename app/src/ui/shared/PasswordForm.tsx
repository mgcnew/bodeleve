import { useState, type FormEvent } from 'react'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { accountErrorMessage, changePassword } from '@/services/account'

/** Troca de senha de quem está logado: pede a atual, a nova e a confirmação da nova */
export function PasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState<{ field: 'current' | 'next' | 'again' | 'form'; text: string }>()
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setDone(false)
    if (!current) return setError({ field: 'current', text: 'Digite a senha atual.' })
    if (next.length < 8) return setError({ field: 'next', text: 'A senha nova precisa de pelo menos 8 caracteres.' })
    if (next !== again) return setError({ field: 'again', text: 'As duas senhas novas não são iguais.' })
    setBusy(true)
    setError(undefined)
    try {
      await changePassword(email, current, next)
      setCurrent('')
      setNext('')
      setAgain('')
      setDone(true)
    } catch (err) {
      const text = accountErrorMessage(err)
      setError({ field: text.startsWith('A senha atual') ? 'current' : 'form', text })
    } finally {
      setBusy(false)
    }
  }

  const clear = () => {
    setError(undefined)
    setDone(false)
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TextField label="Senha atual" type="password" autoComplete="current-password" value={current} error={error?.field === 'current' ? error.text : undefined} onChange={(e) => { setCurrent(e.target.value); clear() }} />
      <TextField label="Senha nova" type="password" autoComplete="new-password" help="Pelo menos 8 caracteres" value={next} error={error?.field === 'next' ? error.text : undefined} onChange={(e) => { setNext(e.target.value); clear() }} />
      <TextField label="Repita a senha nova" type="password" autoComplete="new-password" value={again} error={error?.field === 'again' ? error.text : undefined} onChange={(e) => { setAgain(e.target.value); clear() }} />
      {error?.field === 'form' && <Banner tone="error">{error.text}</Banner>}
      {done && <Banner tone="success">Senha alterada.</Banner>}
      <Button type="submit" variant="secondary" block disabled={busy}>
        Trocar senha
      </Button>
    </form>
  )
}
