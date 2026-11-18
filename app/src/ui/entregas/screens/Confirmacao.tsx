import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { hypotheses } from '@/config/hypotheses'
import { hourMinute } from '@/domain/dates'
import { confirmDelivery } from '@/services/entregas'
import { courierErrorMessage } from '@/services/entregasRemote'
import { Bar } from '../../shared/OpsBits'
import { StepHeader, useOrder } from './Detalhe'
import { useCourier } from '../useCourier'
import o from '@/styles/ops.module.css'
import e from '../../gestao/screens/estoque/Estoque.module.css'

// H-E5 — entrega confirmada com o código de 4 números da cliente; sem código, vai para "Problema na entrega"
export function Confirmacao() {
  const live = useOrder()
  const { account } = useCourier()
  // depois de entregue o banco tira o pedido da lista do entregador; a tela de "Entregue" segue com a última cópia
  const last = useRef(live)
  if (live) last.current = live
  const order = live ?? last.current
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()
  if (!order || !account) return null

  if (done || order.status === 'delivered') {
    return (
      <div className={o.screen}>
        <Bar title="Entregar" back="/entregas" />
        <main className={e.done}>
          <div aria-hidden="true" className={e.doneIcon}>
            <Icon name="confirmar" size={36} />
          </div>
          <h1 className={o.h1}>Entregue</h1>
          <p className={`${o.secondary} ${o.num}`}>
            Pedido #{order.number} · {hourMinute(new Date().toISOString())} · a loja e a cliente foram avisadas.
          </p>
        </main>
        <div className={o.footer}>
          <ButtonLink to="/entregas" size="l" block>
            Próxima entrega
          </ButtonLink>
          <ButtonLink to="/entregas/historico" variant="secondary" block>
            Ver histórico
          </ButtonLink>
        </div>
      </div>
    )
  }

  const submit = async () => {
    setBusy(true)
    setProblem(undefined)
    try {
      if (await confirmDelivery(order.id, code, account)) setDone(true)
      else setError(true)
    } catch (e) {
      setProblem(courierErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={o.screen}>
      <Bar title="Entregar" back={`/entregas/pedido/${order.id}/rota`} />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <StepHeader step={4} />
        <div className={o.h1}>Peça o código à cliente</div>
        <p className={o.muted}>
          {order.customer.name.split(' ')[0]} recebeu um código de {hypotheses.deliveryCodeLength} números no WhatsApp e na tela de acompanhamento do pedido.
        </p>
        <div className={o.section}>
          <label htmlFor="cod" className={o.bold}>
            Código de entrega
          </label>
          <input
            id="cod"
            type="text"
            inputMode="numeric"
            maxLength={hypotheses.deliveryCodeLength}
            autoComplete="one-time-code"
            aria-invalid={error || undefined}
            aria-describedby={error ? 'cod-erro' : undefined}
            value={code}
            onChange={(ev) => {
              setCode(ev.target.value.replace(/\D/g, ''))
              setError(false)
            }}
            style={{ height: 72, borderRadius: 12, border: `2px solid ${error ? 'var(--erro)' : 'var(--cor-tinta)'}`, background: 'var(--superficie)', font: '700 32px var(--fonte-texto)', letterSpacing: '0.4em', textAlign: 'center', width: '100%' }}
          />
          {error && (
            <div id="cod-erro" role="alert" className={o.iconLine} style={{ color: 'var(--erro)', alignItems: 'center' }}>
              <Icon name="alerta" size={18} />
              Código não confere. Confira com a cliente.
            </div>
          )}
        </div>
        <Link to={`/entregas/pedido/${order.id}/problema`} className={o.linkInline}>
          A cliente não tem o código
        </Link>
      </main>
      <div className={o.footer}>
        {problem && <Banner tone="error">{problem}</Banner>}
        <Button size="l" block onClick={() => void submit()} disabled={busy || code.length < hypotheses.deliveryCodeLength}>
          Confirmar entrega
        </Button>
      </div>
    </div>
  )
}
