import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { hypotheses } from '@/config/hypotheses'
import { formatCents } from '@/domain/money'
import { staffTotal, type StaffOrder } from '@/domain/staffOrder'
import { staffOrdersStore } from '@/services/gestao/orders'
import { accept } from '@/services/entregas'
import { courierErrorMessage } from '@/services/entregasRemote'
import { establishmentStore } from '@/services/gestao/people'
import { Bar, StepBars } from '../../shared/OpsBits'
import { useCourier } from '../useCourier'
import o from '@/styles/ops.module.css'

const STEPS = ['Aceite', 'Coleta', 'Em rota', 'Entrega']

export function StepHeader({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className={o.section}>
      <StepBars total={4} done={step - 1} current={step - 1} />
      <div className={o.muted}>
        Etapa {step} de 4 · {STEPS[step - 1]}
      </div>
    </div>
  )
}

export function Destino({ order }: { order: StaffOrder }) {
  return (
    <div className={o.iconLine} style={{ color: 'var(--cor-terracota)' }}>
      <Icon name="local" size={22} />
      <div style={{ color: 'var(--texto)' }}>
        <b>{order.customer.name}</b>
        <div className={o.muted}>
          {order.address?.line1} · {order.address?.line2}
        </div>
      </div>
    </div>
  )
}

export function useOrder() {
  const { id = '' } = useParams()
  return staffOrdersStore.useStore().find((x) => x.id === id) ?? null
}

export function Detalhe() {
  const order = useOrder()
  const { account } = useCourier()
  const casa = establishmentStore.useStore()
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  if (!order || !account) {
    return (
      <div className={o.screen}>
        <Bar title="Pedido" back="/entregas" />
        <EmptyState bare icon="entregas" title="Entrega não encontrada" action={<ButtonLink to="/entregas">Ver entregas</ButtonLink>} />
      </div>
    )
  }

  const partner = account.kind === 'partner'
  const fee = formatCents(hypotheses.partnerFeePerDelivery)
  const accepted = order.courierStage === 'accepted' || order.courierStage === 'collected'
  const toCollect = order.paid ? 0 : staffTotal(order)

  return (
    <div className={o.screen}>
      <Bar title={`Pedido #${order.number}`} back="/entregas" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <StepHeader step={1} />
        <div className={o.card} style={{ gap: 8 }}>
          <div className={o.caps}>Coletar em</div>
          <div className={o.iconLine}>
            <Icon name="inicio" size={22} />
            <div>
              <b>Bodeleve</b>
              <div className={o.muted}>{casa.address || '[ENDEREÇO DA LOJA]'} · balcão</div>
            </div>
          </div>
        </div>
        <div className={o.card} style={{ gap: 8 }}>
          <div className={o.caps}>Entregar para</div>
          <Destino order={order} />
          {/* H-E4 — sem mapa nem rastreio em tempo real; usa o app de mapas do celular */}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {[
            ['Distância', order.distanceKm ? `${order.distanceKm.toLocaleString('pt-BR')} km` : '—'],
            ['Volumes', '1 sacola'],
            ['Itens', String(order.items.reduce((n, i) => n + i.quantity, 0))],
          ].map(([t, v]) => (
            <div key={t} className={o.kpi} style={{ padding: 12 }}>
              <span className={o.kpiLabel}>{t}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
        {toCollect === 0 ? <Banner tone="success">{`Pago no ${order.paymentLabel}. Nada a cobrar.`}</Banner> : <Banner tone="warning">{`Cobrar ${formatCents(toCollect)} na entrega (${order.paymentLabel.toLowerCase()}).`}</Banner>}
        {partner && (
          <div className={o.card} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <span>Você recebe por esta entrega</span>
            <b>{fee}</b>
          </div>
        )}
      </main>
      <div className={o.footer}>
        {accepted ? (
          <>
            <Banner tone="success">Entrega aceita. A loja foi avisada.</Banner>
            <ButtonLink to={`/entregas/pedido/${order.id}/coleta`} size="l" block>
              Ir para a coleta
            </ButtonLink>
          </>
        ) : (
          <>
            {problem && <Banner tone="error">{problem}</Banner>}
            <Button
              size="l"
              block
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setProblem(undefined)
                try {
                  await accept(order.id)
                } catch (e) {
                  setProblem(courierErrorMessage(e))
                } finally {
                  setBusy(false)
                }
              }}
            >
              {partner ? `Aceitar por ${fee}` : 'Aceitar entrega'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
