import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { formatCents } from '@/domain/money'
import { formatCep, type Address } from '@/domain/order'
import { checkDeliveryArea } from '@/services/orders'
import { lookupCep } from '@/services/cep'
import { TopBar } from '../../components/LojaShell'
import { useCheckout } from '../../state/checkout'
import l from '../../loja.module.css'

const empty: Address = { cep: '', street: '', number: '', complement: '', district: '', reference: '' }
type Errors = Partial<Record<keyof Address, string>>
type Area = { state: 'idle' | 'checking' } | { state: 'ok' | 'out'; feeCents: number }

export function Endereco() {
  const { draft, update } = useCheckout()
  const navigate = useNavigate()
  const [form, setForm] = useState<Address>(draft.address ?? empty)
  const [errors, setErrors] = useState<Errors>({})
  const [area, setArea] = useState<Area>({ state: 'idle' })
  const set = (patch: Partial<Address>) => setForm((f) => ({ ...f, ...patch }))

  const cepDigits = form.cep.replace(/\D/g, '')
  useEffect(() => {
    if (cepDigits.length !== 8) {
      setArea({ state: 'idle' })
      return
    }
    let alive = true
    setArea({ state: 'checking' })
    // H-L9 — confere a área de entrega e preenche rua e bairro pelo CEP
    Promise.all([checkDeliveryArea(cepDigits), lookupCep(cepDigits)]).then(([check, found]) => {
      if (!alive) return
      setArea({ state: check.ok ? 'ok' : 'out', feeCents: check.feeCents })
      if (found) {
        setForm((f) => ({ ...f, street: f.street || found.street, district: f.district || found.district }))
      }
    })
    return () => {
      alive = false
    }
  }, [cepDigits])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (cepDigits.length !== 8) next.cep = 'Informe os 8 números do CEP.'
    if (!form.street.trim()) next.street = 'Informe a rua.'
    if (!form.number.trim()) next.number = 'Informe o número, ou "s/n".'
    if (!form.district.trim()) next.district = 'Informe o bairro.'
    setErrors(next)
    if (Object.keys(next).length > 0 || area.state === 'out') return
    update({ address: form, fulfillment: 'delivery' })
    // volta para quem abriu (entrega no checkout ou perfil)
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/checkout/entrega')
  }

  return (
    <form className={`${l.screen} ${l.narrow}`} onSubmit={submit} noValidate>
      <TopBar title="Endereço de entrega" back="history" fallback="/checkout/entrega" cart={false} />
      <main className={`${l.main} ${l.mainTight}`}>
        <TextField
          label="CEP"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={form.cep}
          error={errors.cep}
          help="Com o CEP preenchemos rua e bairro."
          onChange={(e) => set({ cep: formatCep(e.target.value) })}
        />
        <TextField label="Rua" autoComplete="address-line1" value={form.street} error={errors.street} onChange={(e) => set({ street: e.target.value })} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, alignItems: 'start' }}>
          <TextField label="Número" inputMode="numeric" value={form.number} error={errors.number} onChange={(e) => set({ number: e.target.value })} />
          <TextField label="Complemento" autoComplete="address-line2" value={form.complement} onChange={(e) => set({ complement: e.target.value })} />
        </div>
        <TextField label="Bairro" value={form.district} error={errors.district} onChange={(e) => set({ district: e.target.value })} />
        <TextField
          label="Ponto de referência (opcional)"
          placeholder="Ex.: portão azul"
          value={form.reference}
          onChange={(e) => set({ reference: e.target.value })}
        />
        {area.state === 'checking' && <div role="status" className={l.muted}>Conferindo se entregamos neste CEP…</div>}
        {area.state === 'ok' && (
          <Banner tone="success">Entregamos neste endereço. Taxa de {formatCents(area.feeCents)}.</Banner>
        )}
        {area.state === 'out' && (
          <Banner tone="error">Ainda não entregamos neste CEP. Você pode retirar o pedido na loja.</Banner>
        )}
      </main>
      <div className={l.footer}>
        <Button type="submit" size="l" block>
          Usar este endereço
        </Button>
      </div>
    </form>
  )
}
