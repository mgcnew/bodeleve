import { useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { hypotheses } from '@/config/hypotheses'
import { formatPhone } from '@/domain/order'
import { applyCodeInput } from '@/lib/otp'
import { courierSessionStore, findCourierByPhone, signInCourier } from '@/services/entregas'
import o from '@/styles/ops.module.css'

// H-E1 — entregador entra com celular e código pelo WhatsApp; só entra quem a casa cadastrou
export function Entrar() {
  const session = courierSessionStore.useStore()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/entregas'
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
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
        {step === 'phone' ? (
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
