import { useState } from 'react'
import { isPreview } from '@/config/preview'
import { Navigate, useNavigate } from 'react-router-dom'
import { Banner, Button, ConfirmationCode, TextField } from '@/components'
import { formatPhone, isValidPhone } from '@/domain/checkout'
import { MOCK_COURIER_CODE } from '@/mocks/adminSeed'
import { useServices } from '@/services'
import { useCourierSession } from '@/store/courier'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

export function CourierLoginPage() {
  const navigate = useNavigate()
  const { admin } = useServices()
  const courierId = useCourierSession((x) => x.courierId)
  const signIn = useCourierSession((x) => x.signIn)
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [phoneError, setPhoneError] = useState<string | undefined>()
  const [codeError, setCodeError] = useState(false)
  const [busy, setBusy] = useState(false)

  if (courierId) return <Navigate to="/entregas" replace />

  const ask = async () => {
    if (!isValidPhone(phone)) return setPhoneError('Use o DDD e o número, por exemplo (00) 90000-0000.')
    setBusy(true)
    try {
      await admin.courier.requestCode(phone)
      setStep(2)
      setPhoneError(undefined)
    } catch (e) {
      setPhoneError((e as Error).message === 'sms_disabled' ? 'O envio do código ainda não está ligado. Fale com a casa para entrar.' : 'Esse número não está cadastrado. Fale com a casa para entrar.')
    }
    setBusy(false)
  }
  const verify = async () => {
    setBusy(true)
    try {
      const c = await admin.courier.verify(phone, code)
      signIn(c.id)
      navigate('/entregas', { replace: true })
    } catch {
      setCodeError(true)
      setBusy(false)
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', background: 'var(--fundo-operacao)' }}>
      <div className={s.loginMain}>
        <div>
          <div className={s.loginBrand}>Bodeleve</div>
          <div className={l.sub}>Entregas</div>
        </div>
        {step === 1 ? (
          <>
            <TextField label="Celular" type="tel" autoComplete="tel" placeholder="(00) 90000-0000" value={phone} onChange={(e) => { setPhone(formatPhone(e.target.value)); setPhoneError(undefined) }} error={phoneError} />
            <Button size="lg" fullWidth loading={busy} onClick={ask}>Receber código no WhatsApp</Button>
          </>
        ) : (
          <>
            <div className={l.sub}>Código enviado para {phone}.</div>
            {isPreview && <Banner tone="warning">Só em desenvolvimento: nada foi enviado. Use o código {MOCK_COURIER_CODE}.</Banner>}
            <ConfirmationCode label={`Código de ${admin.courier.codeLength} dígitos`} length={admin.courier.codeLength} value={code} onChange={(v) => { setCode(v); setCodeError(false) }} invalid={codeError} />
            {codeError && <Banner tone="error">Código incorreto. Confira os números e tente de novo.</Banner>}
            <Button size="lg" fullWidth loading={busy} disabled={code.length < admin.courier.codeLength} onClick={verify}>{busy ? 'Entrando…' : 'Entrar'}</Button>
            <Button variant="ghost" fullWidth onClick={() => { setStep(1); setCode(''); setCodeError(false) }}>Usar outro número</Button>
          </>
        )}
        <div className={l.sub}>Só entra quem a casa cadastrou: entregadores próprios e parceiros.</div>
      </div>
    </main>
  )
}
