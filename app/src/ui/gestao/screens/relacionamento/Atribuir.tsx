import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { hypotheses } from '@/config/hypotheses'
import { formatCents } from '@/domain/money'
import type { Courier } from '@/domain/backoffice'
import type { StaffOrder } from '@/domain/staffOrder'
import { supabase } from '@/lib/supabase'
import { staffOrdersStore } from '@/services/gestao/orders'
import { couriersStore } from '@/services/gestao/people'
import { deliveryErrorMessage, remoteAssign, remoteUnassign } from '@/services/gestao/peopleRemote'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import s from '../estoque/Estoque.module.css'

/** id de um entregador próprio, ou 'partners' para publicar aos parceiros */
type Choice = string

const PARTNERS = 'partners'

const copyFor = (choice: Choice, couriers: Courier[]) => {
  if (choice === PARTNERS) {
    return {
      button: `Publicar por ${formatCents(hypotheses.partnerFeePerDelivery)}`,
      title: 'Publicado para parceiros',
      result: `Avisamos aqui quando um parceiro aceitar. Se ninguém aceitar em ${hypotheses.partnerAcceptTimeoutMin} minutos, a entrega volta para a loja.`,
    }
  }
  const c = couriers.find((x) => x.id === choice)
  const name = c?.name ?? 'o entregador'
  return c?.status === 'en_route'
    ? { button: `Reservar para ${name}`, title: `Reservado para ${name}`, result: `Entra na lista de ${name} quando voltar da rota.` }
    : { button: `Enviar com ${name}`, title: `${name} recebeu a entrega`, result: `O pedido apareceu no app de ${name}. A cliente recebe o aviso quando sair.` }
}

export function Atribuir() {
  const { id = '' } = useParams()
  const order = staffOrdersStore.useStore().find((x) => x.id === id)
  const couriers = couriersStore.useStore()
  const own = couriers.filter((c) => c.kind === 'own' && c.status !== 'offline')
  const [picked, setChoice] = useState<Choice | null>(null)
  const choice = picked ?? own.find((c) => c.status === 'available')?.id ?? own[0]?.id ?? PARTNERS
  const [done, setDone] = useState<StaffOrder | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  if (!order) {
    return (
      <div className={o.screen}>
        <Bar title="Enviar pedido" back="/gestao/entregas" />
        <EmptyState bare icon="entregas" title="Pedido não encontrado" action={<ButtonLink to="/gestao/entregas">Ver entregas</ButtonLink>} />
      </div>
    )
  }

  const update = (patch: Partial<StaffOrder>) => staffOrdersStore.set((all) => all.map((x) => (x.id === order.id ? { ...x, ...patch } : x)))

  const copy = copyFor(choice, couriers)
  const chosen = couriers.find((c) => c.id === choice)

  const send = async () => {
    setBusy(true)
    setProblem(undefined)
    try {
      if (supabase) {
        await remoteAssign(order.id, choice === PARTNERS ? null : choice)
      } else if (choice === PARTNERS) {
        update({ courierName: null, deliveryNote: 'publicado para parceiros' })
      } else {
        update({ courierName: chosen?.name ?? null, deliveryNote: chosen?.status === 'en_route' ? `reservado para ${chosen.name}` : `atribuído a ${chosen?.name}` })
      }
      setDone(order)
    } catch (e) {
      setProblem(deliveryErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const undo = async (previous: StaffOrder) => {
    setBusy(true)
    setProblem(undefined)
    try {
      if (supabase) await remoteUnassign(order.id)
      else update({ status: previous.status, courierName: previous.courierName, deliveryNote: previous.deliveryNote, courierStage: previous.courierStage })
      setDone(null)
    } catch (e) {
      setProblem(deliveryErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const partnerNote = couriers.find((c) => c.kind === 'partner')?.note.split(' com')[0]
  const opts: { value: Choice; title: string; sub: string; end: React.ReactNode }[] = [
    ...own.map((c) => ({
      value: c.id,
      title: `${c.name} · próprio`,
      sub: c.status === 'en_route' ? `${c.note} · pode levar junto na próxima saída` : `${c.note[0].toUpperCase()}${c.note.slice(1)} · sai em seguida`,
      end: <Tag tone={c.status === 'en_route' ? 'info' : 'success'}>{c.status === 'en_route' ? 'Em rota' : 'Disponível'}</Tag>,
    })),
    {
      value: PARTNERS,
      title: 'Publicar para parceiros',
      sub: `O primeiro que aceitar leva${partnerNote ? ` · ${partnerNote} online` : ''}`,
      end: <b className={o.num}>{formatCents(hypotheses.partnerFeePerDelivery)}</b>,
    },
  ]

  // pedido já enviado antes (ou depois de recarregar): mostra o estado e deixa desfazer
  const alreadySent = !done && /^(atribuído|reservado|publicado)/.test(order.deliveryNote ?? '')

  if (done || alreadySent) {
    return (
      <div className={o.screen}>
        <Bar title={`Enviar pedido #${order.number}`} back="/gestao/entregas" />
        <main className={s.done}>
          <div aria-hidden="true" className={s.doneIcon}>
            <Icon name="entregas" size={32} />
          </div>
          <h2 style={{ font: '700 24px/30px var(--fonte-titulo)' }}>{done ? copy.title : `Enviado: ${order.deliveryNote}`}</h2>
          {done && <p className={o.secondary}>{copy.result}</p>}
        </main>
        <div className={o.footer}>
          <ButtonLink to="/gestao/entregas" size="l" block>
            Voltar às entregas
          </ButtonLink>
          {problem && <Banner tone="error">{problem}</Banner>}
          <Button variant="secondary" block disabled={busy} onClick={() => void undo(done ?? order)}>
            {done ? 'Desfazer' : 'Desfazer envio'}
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
        {problem && <Banner tone="error">{problem}</Banner>}
        <Button size="l" block disabled={busy} onClick={() => void send()}>
          {copy.button}
        </Button>
      </div>
    </div>
  )
}
