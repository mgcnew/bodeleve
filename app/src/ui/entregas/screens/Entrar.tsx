import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { hypotheses } from '@/config/hypotheses'
import { formatPhone } from '@/domain/order'
import { applyCodeInput } from '@/lib/otp'
import { supabase } from '@/lib/supabase'
import { courierSessionStore, findCourierByPhone, signInCourier, signInCourierWithPassword } from '@/services/entregas'
import o from '@/styles/ops.module.css'

// H-E1 — entregador entra com celular e código pelo WhatsApp; só entra quem a casa cadastrou
export function Entrar() {
  const session = courierSessionStore.useStore()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/entregas'
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(import.meta.env.DEV ? (import.meta.env.VITE_DEV_COURIER_EMAIL ?? '') : '')
  const [password, setPassword] = useState(import.meta.env.DEV ? (import.meta.env.VITE_DEV_COURIER_PASSWORD ?? '') : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const length = hypotheses.loginCodeLength
  const [code, setCode] = useState<string[]>(Array(length).fill(''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  if (session) return <Navigate to={from} replace />

  const requestCode = (e: FormEvent) => {
    e.preventDefault()
    if (!findCourierByPhone(phone)) return setError('Esse celular não está cadastrado. Peça à casa para cadastrar você.')
    setError(undefined)
    setStep('code')
  }

  const enter = (e: FormEvent) => {
    e.preventDefault()
    try {
      signInCourier(phone, code.join(''))
      navigate(from, { replace: true })
    } catch {
      setError(`Digite os ${length} números do código que chegou no WhatsApp.`)
    }
  }

  // com o banco, e-mail e senha até o código por celular (P8) existir; só entra quem a casa cadastrou
  const enterWithPassword = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      await signInCourierWithPassword(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(String((err as Error).message) === 'unknown_phone' ? 'Esse acesso não está vinculado a um entregador cadastrado. Peça à casa para cadastrar você.' : 'E-mail ou senha incorretos.')
    } finally {
      setBusy(false)
    }
  }

  const setDigit = (i: number, v: string) => {
    const r = applyCodeInput(code, i, v)
    setCode(r.digits)
    setError(undefined)
    inputs.current[r.focus]?.focus()
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center', background: 'var(--fundo-operacao)' }}>
      <div style={{ flex: '1 1 auto', maxWidth: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, padding: '24px 20px' }}>
        <div>
          <div style={{ font: 'var(--titulo-xl)', letterSpacing: '-0.01em' }}>Bodeleve</div>
          <div className={o.muted}>Entregas</div>
        </div>
        {supabase ? (
          <form onSubmit={(e) => void enterWithPassword(e)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TextField label="E-mail" type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError(undefined) }} />
            <TextField label="Senha" type="password" autoComplete="current-password" value={password} error={error} onChange={(e) => { setPassword(e.target.value); setError(undefined) }} />
            <Button type="submit" size="l" block disabled={busy}>
              Entrar
            </Button>
            <Link to="/gestao/esqueci-senha?de=entregas" className={o.muted} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start' }}>
              Esqueci minha senha
            </Link>
          </form>
        ) : step === 'phone' ? (
          <form onSubmit={requestCode} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TextField label="Celular" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(00) 90000-0300" value={phone} error={error} onChange={(e) => { setPhone(formatPhone(e.target.value)); setError(undefined) }} />
            <Button type="submit" size="l" block>
              Receber código no WhatsApp
            </Button>
          </form>
        ) : (
          <form onSubmit={enter} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p className={`${o.muted} ${o.num}`}>Código enviado para {phone}.</p>
            <div role="group" aria-label={`Código de ${length} dígitos`} style={{ display: 'grid', gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`, gap: 8 }}>
              {code.map((dg, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Dígito ${i + 1}`}
                  value={dg}
                  autoFocus={i === 0}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !dg && i > 0) inputs.current[i - 1]?.focus()
                  }}
                  style={{ width: '100%', height: 56, borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', textAlign: 'center', font: '600 22px var(--fonte-texto)' }}
                />
              ))}
            </div>
            {error && <Banner tone="error">{error}</Banner>}
            <Button type="submit" size="l" block>
              Entrar
            </Button>
            <Button variant="quiet" block onClick={() => { setStep('phone'); setCode(Array(length).fill('')) }}>
              Usar outro número
            </Button>
          </form>
        )}
        <p className={o.muted}>
          Só entra quem a casa cadastrou: entregadores próprios e parceiros.
        </p>
      </div>
    </div>
  )
}
