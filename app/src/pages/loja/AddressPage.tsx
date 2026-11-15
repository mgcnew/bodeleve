import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Banner, Button, TextField } from '@/components'
import { formatCep, isValidCep, validateAddress } from '@/domain/checkout'
import type { AreaCheck } from '@/domain/types'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import { useBag, useCheckout } from '@/store/bag'
import { Footer, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

export function AddressPage() {
  const navigate = useNavigate()
  const { area } = useServices()
  const empty = useBag((b) => Object.keys(b.items).length === 0)
  const { address, setAddress } = useCheckout()
  const [tried, setTried] = useState(false)
  // Resultado da conferência da área, guardado junto do CEP a que se refere (descarta resposta de CEP antigo).
  const [result, setResult] = useState<{ cep: string; check: AreaCheck } | null>(null)
  const validCep = isValidCep(address.cep)
  const check = validCep && result?.cep === address.cep ? result.check : null
  const checking = validCep && !check
  const errors = tried ? validateAddress(address) : {}

  // H-L9: valida a área ao completar o CEP e, se der, já preenche rua e bairro vazios.
  useEffect(() => {
    if (!isValidCep(address.cep)) return
    const cep = address.cep
    let cancelled = false
    area.checkCep(cep).then((r) => {
      if (cancelled) return
      setResult({ cep, check: r })
      if (r.covered) {
        const cur = useCheckout.getState().address
        setAddress({ street: cur.street || r.street, district: cur.district || r.district })
      }
    })
    return () => {
      cancelled = true
    }
  }, [address.cep, area, setAddress])

  if (empty) return <Navigate to="/sacola" replace />

  const save = () => {
    setTried(true)
    if (Object.keys(validateAddress(address)).length > 0) return
    if (!check?.covered) return
    navigate('/finalizar/entrega', { replace: true })
  }

  return (
    <>
      <ScreenHeader title="Endereço de entrega" back="/finalizar/entrega" />
      <main className={`${s.main} ${s.narrow}`} style={{ gap: 16 }}>
        <TextField label="CEP" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={address.cep} onChange={(e) => setAddress({ cep: formatCep(e.target.value) })} hint="Com o CEP preenchemos rua e bairro." error={errors.cep} />
        <TextField label="Rua" autoComplete="address-line1" value={address.street} onChange={(e) => setAddress({ street: e.target.value })} error={errors.street} />
        <div className={s.grid} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <TextField label="Número" inputMode="numeric" value={address.number} onChange={(e) => setAddress({ number: e.target.value })} error={errors.number} />
          <TextField label="Complemento" autoComplete="address-line2" value={address.complement} onChange={(e) => setAddress({ complement: e.target.value })} />
        </div>
        <TextField label="Bairro" value={address.district} onChange={(e) => setAddress({ district: e.target.value })} error={errors.district} />
        <TextField label="Ponto de referência (opcional)" placeholder="Ex.: portão azul" value={address.reference} onChange={(e) => setAddress({ reference: e.target.value })} />

        {checking && <Banner tone="warning">Conferindo a área de entrega…</Banner>}
        {!checking && check?.covered && <Banner tone="success">Entregamos neste endereço. Taxa de {formatBRL(check.feeCents)}.</Banner>}
        {/* Estado não desenhado (Q6): texto provisório, a confirmar com o dono. */}
        {!checking && check && !check.covered && <Banner tone="error">Ainda não entregamos neste CEP. Você pode escolher retirar na loja.</Banner>}
      </main>
      <Footer>
        <Button size="lg" fullWidth onClick={save} disabled={checking}>Usar este endereço</Button>
      </Footer>
    </>
  )
}
