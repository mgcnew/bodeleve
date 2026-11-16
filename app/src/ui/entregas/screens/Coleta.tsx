import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Box } from '@/components/Card'
import { formatCents } from '@/domain/money'
import { staffTotal } from '@/domain/staffOrder'
import { leaveStore } from '@/services/entregas'
import { Bar } from '../../shared/OpsBits'
import { StepHeader, useOrder } from './Detalhe'
import o from '@/styles/ops.module.css'

// H-E3 — coleta tem conferência (volumes, nota, se há algo a cobrar) antes de sair
export function Coleta() {
  const order = useOrder()
  const navigate = useNavigate()
  const [checked, setChecked] = useState<boolean[]>([false, false, false])
  if (!order) return null

  const items = [
    '1 sacola térmica, lacrada',
    `Nota da casa com o pedido #${order.number}`,
    order.paid ? `Nada para cobrar (pago no ${order.paymentLabel})` : `Cobrar ${formatCents(staffTotal(order))} na entrega`,
  ]
  const n = checked.filter(Boolean).length

  return (
    <div className={o.screen}>
      <Bar title="Coleta" back={`/entregas/pedido/${order.id}`} />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <StepHeader step={2} />
        <div className={o.bold}>Confira antes de sair</div>
        <Box>
          {items.map((t, i) => (
            <label key={t} className={o.check}>
              <input type="checkbox" checked={checked[i]} onChange={() => setChecked(checked.map((c, j) => (j === i ? !c : c)))} />
              <span>{t}</span>
            </label>
          ))}
        </Box>
        <p className={o.muted}>Se faltar algo, avise o balcão antes de sair.</p>
      </main>
      <div className={o.footer}>
        {n === 3 ? (
          <Button
            size="l"
            block
            onClick={() => {
              leaveStore(order.id)
              navigate(`/entregas/pedido/${order.id}/rota`)
            }}
          >
            Saí da loja
          </Button>
        ) : (
          <Button size="l" block disabled>
            <span className={o.num}>Confira os itens · {n} de 3</span>
          </Button>
        )}
      </div>
    </div>
  )
}
