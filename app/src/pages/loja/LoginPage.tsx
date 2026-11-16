import { useState } from 'react'
import { isPreview } from '@/config/preview'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppLink, Banner, Button, ConfirmationCode, Icon, TextField } from '@/components'
import { storefront } from '@/config/storefront'
import { formatPhone, isValidPhone } from '@/domain/checkout'
import { MOCK_LOGIN_CODE } from '@/mocks/services'
import { useServices } from '@/services'
import { useSession } from '@/store/bag'
import { ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

/** H-L10: login sem senha, por código de 4 dígitos. Nesta versão o código não é enviado (P8); em desenvolvimento vale o código de teste. */
export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/perfil'
  const { auth } = useServices()
  const signIn = useSession((x) => x.signIn)
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [phoneError, setPhoneError] = useState<string>()
  const [codeError, setCodeError] = useState(false)
  const [busy, setBusy] = useState(false)

  const requestCode = async () => {
    if (!isValidPhone(phone)) {
      setPhoneError('Informe o celular com DDD, por exemplo (11) 98765-4321.')
      return
    }
    setPhoneError(undefined)
    setBusy(true)
    await auth.requestCode(phone)
    setBusy(false)
    setStep(2)
  }
  const verify = async () => {
    setBusy(true)
    try {
      await auth.verifyCode(phone, code)
      signIn(phone)
      navigate(next, { replace: true })
    } catch {
      setCodeError(true)
      setBusy(false)
    }
  }

  return (
    <>
      <ScreenHeader title="Entrar" back="/perfil" />
      <main className={`${s.main} ${s.narrow}`}>
        {step === 1 ? (
          <>
            <h1 className={s.h1}>Entre com seu celular</h1>
            <div className={s.sub}>Sem senha: enviamos um código de {storefront.deliveryCodeLength} dígitos pelo WhatsApp. Se for sua primeira vez, a conta é criada na hora.</div>
            <TextField label="Celular com WhatsApp" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(00) 90000-0000" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} error={phoneError} />
            <Button size="lg" fullWidth loading={busy} onClick={requestCode}>{busy ? 'Enviando…' : 'Receber código'}</Button>
          </>
        ) : (
          <>
            <h1 className={s.h1}>Digite o código</h1>
            <div className={s.sub}>Enviado para {phone}.</div>
            {isPreview && <Banner tone="warning">Só em desenvolvimento: nada foi enviado. Use o código {MOCK_LOGIN_CODE}.</Banner>}
            <ConfirmationCode label="Código de 4 dígitos" value={code} onChange={(v) => { setCode(v); setCodeError(false) }} invalid={codeError} />
            {codeError && <Banner tone="error">Código incorreto. Confira os números e tente de novo.</Banner>}
            <Button size="lg" fullWidth loading={busy} disabled={code.length < storefront.deliveryCodeLength} onClick={verify}>{busy ? 'Entrando…' : 'Entrar'}</Button>
            <Button variant="ghost" fullWidth onClick={() => { setStep(1); setCode(''); setCodeError(false) }}>Usar outro número</Button>
          </>
        )}
        <div>
          <AppLink href="/" className={s.link}>Continuar sem conta <Icon name="avancar" size={18} /></AppLink>
        </div>
      </main>
    </>
  )
}
