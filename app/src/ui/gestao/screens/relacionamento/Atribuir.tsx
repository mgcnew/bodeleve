import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Button, ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { hypotheses } from '@/config/hypotheses'
import { formatCents } from '@/domain/money'
import type { StaffOrder } from '@/domain/staffOrder'
import { staffOrdersStore } from '@/services/gestao/orders'
import { couriersStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import s from '../estoque/Estoque.module.css'

type Choice = 'bruno' | 'carlos' | 'partners'

const copy: Record<Choice, { button: string; title: string; result: string }> = {
  bruno: { button: 'Enviar com o Bruno', title: 'Bruno recebeu a entrega', result: 'O pedido apareceu no app do Bruno. A cliente recebe o aviso quando ele sair.' },
  carlos: { button: 'Reservar para o Carlos', title: 'Reservado para o Carlos', result: 'Entra na lista do Carlos quando ele voltar, às 15h50.' },
  partners: {
    button: `Publicar por ${formatCents(hypotheses.partnerFeePerDelivery)}`,
    title: 'Publicado para parceiros',
    result: `Avisamos aqui quando um parceiro aceitar. Se ninguém aceitar em ${hypotheses.partnerAcceptTimeoutMin} minutos, a entrega volta para a loja.`,
  },
}

export function Atribuir() {
  const { id = '' } = useParams()
  const order = staffOrdersStore.useStore().find((x) => x.id === id)
  const couriers = couriersStore.useStore()
  const [choice, setChoice] = useState<Choice>('bruno')
  const [done, setDone] = useState<StaffOrder | null>(null)

  if (!order) {
    return (
      <div className={o.screen}>
        <Bar title="Enviar pedido" back="/gestao/entregas" />
        <EmptyState bare icon="entregas" title="Pedido não encontrado" action={<ButtonLink to="/gestao/entregas">Ver entregas</ButtonLink>} />
      </div>
    )
  }

  const update = (patch: Partial<StaffOrder>) => staffOrdersStore.set((all) => all.map((x) => (x.id === order.id ? { ...x, ...patch } : x)))

  const send = () => {
    setDone(order)
    if (choice === 'bruno') update({ status: 'en_route', courierName: 'Bruno', deliveryNote: undefined })
    if (choice === 'carlos') update({ courierName: 'Carlos', deliveryNote: 'reservado para o Carlos' })
    if (choice === 'partners') update({ courierName: null, deliveryNote: 'publicado para parceiros' })
  }

  const bruno = couriers.find((c) => c.id === 'bruno')
  const carlos = couriers.find((c) => c.id === 'carlos')
  const opts: { value: Choice; title: string; sub: string; end: React.ReactNode }[] = [
    { value: 'bruno', title: 'Bruno · próprio', sub: 'Na loja agora · sai em seguida', end: <Tag tone={bruno?.status === 'available' ? 'success' : 'info'}>{bruno?.status === 'available' ? 'Disponível' : 'Em rota'}</Tag> },
    { value: 'carlos', title: 'Carlos · próprio', sub: 'Volta às 15h50 · pode levar junto na próxima saída', end: <Tag tone={carlos?.status === 'en_route' ? 'info' : 'success'}>{carlos?.status === 'en_route' ? 'Em rota' : 'Disponível'}</Tag> },
    { value: 'partners', title: 'Publicar para parceiros', sub: 'O primeiro que aceitar leva · 2 online', end: <b className={o.num}>{formatCents(hypotheses.partnerFeePerDelivery)}</b> },
  ]

  if (done) {
    return (
      <div className={o.screen}>
        <Bar title={`Enviar pedido #${order.number}`} back="/gestao/entregas" />
        <main className={s.done}>
          <div aria-hidden="true" className={s.doneIcon}>
            <Icon name="entregas" size={32} />
          </div>
          <h2 style={{ font: '700 24px/30px var(--fonte-titulo)' }}>{copy[choice].title}</h2>
          <p className={o.secondary}>{copy[choice].result}</p>
        </main>
        <div className={o.footer}>
          <ButtonLink to="/gestao/entregas" size="l" block>
            Voltar às entregas
          </ButtonLink>
          <Button
            variant="secondary"
            block
            onClick={() => {
              update({ status: done.status, courierName: done.courierName, deliveryNote: done.deliveryNote })
              setDone(null)
            }}
          >
            Desfazer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={o.screen}>
      <Bar title={`Enviar pedido #${order.number}`} back="/gestao/entregas" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div className={o.card}>
          <div className={o.cardHead}>
            <b>{order.customer.name}</b>
            <Tag tone="success">Pronto</Tag>
          </div>
          <div className={o.iconLine}>
            <Icon name="local" size={20} />
            <span className={o.secondary}>
              {order.address?.line1}
              <br />
              {order.distanceKm ? `${order.distanceKm.toLocaleString('pt-BR')} km · ` : ''}
              {order.items.reduce((n, i) => n + i.quantity, 0)} itens · {order.paid ? `pago no ${order.paymentLabel}` : order.paymentLabel}
            </span>
          </div>
        </div>
        <div className={o.section}>
          <div id="quem" className={o.bold}>
            Quem leva
          </div>
          <div role="group" aria-labelledby="quem" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opts.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={choice === opt.value}
                onClick={() => setChoice(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 64,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: choice === opt.value ? '2px solid var(--cor-grafite)' : '1.5px solid var(--linha)',
                  background: 'var(--superficie)',
                  textAlign: 'left',
                  font: '400 14px var(--fonte-texto)',
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                <span style={{ flex: '1 1 0', minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 16 }}>{opt.title}</span>
                  <span style={{ color: 'var(--texto-secundario)' }}>{opt.sub}</span>
                </span>
                {opt.end}
              </button>
            ))}
          </div>
        </div>
        {/* H-G26 — próprio recebe por mês; parceiro recebe por entrega */}
        <p className={o.muted}>Entregador próprio recebe por mês; parceiro recebe por entrega, no valor mostrado.</p>
      </main>
      <div className={o.footer}>
        <Button size="l" block onClick={send}>
          {copy[choice].button}
        </Button>
      </div>
    </div>
  )
}
