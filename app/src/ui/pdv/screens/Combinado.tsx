import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Box } from '@/components/Card'
import { TextField } from '@/components/Field'
import { formatCents, parseCents } from '@/domain/money'
import { cartTotal, payLabels, type PayMethod, type Payment } from '@/domain/pdv'
import { cartStore, completeSale } from '@/services/pdv'
import { Bar } from '../../shared/OpsBits'
import { BigChip } from '../components/PdvBits'
import o from '@/styles/ops.module.css'
import s from './Pdv.module.css'

// H-P4 — pagamento combinado em quantas partes forem precisas, até zerar o total
export function Combinado() {
  const cart = cartStore.useStore()
  const navigate = useNavigate()
  const total = cartTotal(cart)
  const [parts, setParts] = useState<Payment[]>([])
  const [method, setMethod] = useState<PayMethod>('cash')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()

  if (cart.lines.length === 0) return <Navigate to="/pdv" replace />

  const paid = parts.reduce((n, p) => n + p.cents, 0)
  const remaining = total - paid
  const settled = remaining <= 0

  const add = () => {
    const cents = parseCents(value || formatCents(remaining))
    if (!cents || cents <= 0) return setError('Informe um valor maior que zero.')
    // em dinheiro o cliente pode entregar mais que a parte; nas demais formas a parte não passa do que falta
    if (method !== 'cash' && cents > remaining) return setError(`O valor passa do que falta (${formatCents(remaining)}).`)
    const applied = Math.min(cents, remaining)
    setParts([...parts, { method, cents: applied, receivedCents: method === 'cash' ? cents : undefined }])
    setValue('')
    setError(undefined)
  }

  const finish = () => {
    const sale = completeSale(cart, parts)
    navigate(`/pdv/concluida/${sale.id}`, { replace: true, state: { placed: true } })
  }

  return (
    <div className={o.screen}>
      <Bar title="Dividir pagamento" back="/pdv/pagamento" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div className={s.panelBox}>
          <div>Total</div>
          <div className={s.big}>{formatCents(total)}</div>
          <div style={{ color: 'var(--linha)' }} aria-live="polite">
            {settled ? 'Total quitado.' : `Falta ${formatCents(remaining)}`}
          </div>
        </div>
        {parts.length > 0 && (
          <Box>
            {parts.map((p, i) => (
              <div key={i} className={o.row} style={{ minHeight: 56 }}>
                <span className={o.rowText}>
                  <span className={o.rowTitle}>{payLabels[p.method]}</span>
                  {p.receivedCents && p.receivedCents > p.cents && <span className={o.small}>Troco {formatCents(p.receivedCents - p.cents)}</span>}
                </span>
                <b className={o.num}>{formatCents(p.cents)}</b>
                <Button variant="quiet" aria-label={`Remover parte em ${payLabels[p.method]}`} onClick={() => setParts(parts.filter((_, j) => j !== i))}>
                  Remover
                </Button>
              </div>
            ))}
          </Box>
        )}
        {!settled && (
          <>
            <div className={s.chipRow} role="group" aria-label="Forma" style={{ flexWrap: 'wrap' }}>
              {(Object.keys(payLabels) as PayMethod[]).map((m) => (
                <BigChip key={m} active={method === m} onClick={() => setMethod(m)}>
                  {payLabels[m]}
                </BigChip>
              ))}
            </div>
            <TextField label="Valor desta parte" inputMode="decimal" placeholder={formatCents(remaining)} value={value} error={error} onChange={(e) => { setValue(e.target.value); setError(undefined) }} />
            <Button size="l" block variant="secondary" onClick={add}>
              Adicionar parte
            </Button>
          </>
        )}
      </main>
      <div className={o.footer}>
        {settled ? (
          <Button size="l" block onClick={finish}>
            Concluir venda
          </Button>
        ) : (
          <Button size="l" block disabled>
            Falta {formatCents(remaining)}
          </Button>
        )}
        <Button variant="secondary" block onClick={() => setParts([])} disabled={parts.length === 0}>
          Recomeçar
        </Button>
      </div>
    </div>
  )
}
