import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { hypotheses } from '@/config/hypotheses'
import { supabase } from '@/lib/supabase'
import { formatPhone } from '@/domain/order'
import { applyCodeInput } from '@/lib/otp'
import { TopBar } from '../components/LojaShell'
import { useCheckout } from '../state/checkout'
import l from '../loja.module.css'
import s from './Entrar.module.css'

/**
 * H-L10 — login sem senha, por código enviado ao WhatsApp; conta criada no primeiro acesso.
 * O envio depende do provedor de mensagens (P8); até lá o fluxo é só de tela.
 */
export function Entrar() {
  const { draft, update } = useCheckout()
  const navigate = useNavigate()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState(draft.phone)
  const [phoneError, setPhoneError] = useState<string>()
  const [code, setCode] = useState<string[]>(Array(hypotheses.loginCodeLength).fill(''))
  const [codeError, setCodeError] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const requestCode = (e: FormEvent) => {
    e.preventDefault()
    if (phone.replace(/\D/g, '').length < 10) {
      setPhoneError('Informe o celular com DDD, por exemplo (00) 90000-0000.')
      return
    }
    setPhoneError(undefined)
    update({ phone })
    setStep('code')
  }

  const setDigit = (i: number, value: string) => {
    const r = applyCodeInput(code, i, value)
    setCode(r.digits)
    setCodeError(false)
    inputs.current[r.focus]?.focus()
  }

  const enter = (e: FormEvent) => {
    e.preventDefault()
    if (code.some((d) => !d)) {
      setCodeError(true)
      return
    }
    navigate('/perfil')
  }

  // com o banco ligado o código por WhatsApp ainda não existe (P8): não finge que entrou
  if (supabase) {
    return (
      <div className={`${l.screen} ${l.narrow}`}>
        <TopBar title="Entrar" back="history" fallback="/perfil" cart={false} />
        <main className={`${l.main} ${l.mainForm}`}>
          <h1 className={l.h1}>Conta ainda não disponível</h1>
          <p className={l.muted}>O acesso por celular chega em breve. Enquanto isso você compra sem conta e acompanha o pedido em “Meus pedidos”.</p>
          <Link to="/" className={l.linkArrow}>
            Continuar sem conta
            <Icon name="avancar" size={18} />
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className={`${l.screen} ${l.narrow}`}>
      <TopBar title="Entrar" back="history" fallback="/perfil" cart={false} />
      <main className={`${l.main} ${l.mainForm}`}>
        {step === 'phone' ? (
          <form className={l.main} style={{ padding: 0, gap: 20 }} onSubmit={requestCode} noValidate>
            <h1 className={l.h1}>Entre com seu celular</h1>
            <p className={l.muted}>
              Sem senha: enviamos um código de {hypotheses.loginCodeLength} dígitos pelo WhatsApp. Se for sua primeira vez, a conta é criada na hora.
            </p>
            <TextField
              label="Celular com WhatsApp"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(00) 90000-0000"
              value={phone}
              error={phoneError}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
            <Button type="submit" size="l" block>
              Receber código
            </Button>
          </form>
        ) : (
          <form className={l.main} style={{ padding: 0, gap: 20 }} onSubmit={enter} noValidate>
            <h1 className={l.h1}>Digite o código</h1>
            <p className={`${l.muted} ${l.num}`}>Enviado para {phone}.</p>
            <div role="group" aria-label={`Código de ${code.length} dígitos`} className={s.digits}>
              {code.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Dígito ${i + 1}`}
                  className={s.digit}
                  value={d}
                  autoFocus={i === 0}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !d && i > 0) inputs.current[i - 1]?.focus()
                  }}
                />
              ))}
            </div>
            {codeError && <Banner tone="error">Digite os {code.length} números do código que chegou no WhatsApp.</Banner>}
            <Button type="submit" size="l" block>
              Entrar
            </Button>
            <Button variant="quiet" block onClick={() => setStep('phone')}>
              Usar outro número
            </Button>
          </form>
        )}
        <div className={s.divider}>
          <Link to="/" className={l.linkArrow}>
            Continuar sem conta
            <Icon name="avancar" size={18} />
          </Link>
        </div>
      </main>
    </div>
  )
}
