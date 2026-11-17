import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Banner, EmptyState } from '@/components/Feedback'
import { Segmented } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { hypotheses } from '@/config/hypotheses'
import { hourMinute } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { staffOrdersStore } from '@/services/gestao/orders'
import { availableFor, claim, mineFor } from '@/services/entregas'
import { courierErrorMessage } from '@/services/entregasRemote'
import { PageHeader } from '../../shared/OpsBits'
import { useCourier } from '../useCourier'
import o from '@/styles/ops.module.css'

type Tab = 'available' | 'mine'

export function Lista() {
  const { account, session } = useCourier()
  const orders = staffOrdersStore.useStore()
  const [tab, setTab] = useState<Tab>('mine')
  const [claimed, setClaimed] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()
  if (!account) return null

  const available = availableFor(account, orders)
  const mine = mineFor(account, orders)
  const partner = account.kind === 'partner'
  const fee = formatCents(hypotheses.partnerFeePerDelivery)
  const list = tab === 'mine' ? mine : available

  return (
    <div className={o.screen}>
      <PageHeader
        title="Entregas"
        sub={`${account.name} · ${partner ? 'parceiro' : 'entregador da casa'}`}
        end={<Tag tone={session?.available ? 'success' : 'warning'}>{session?.available ? 'Disponível' : 'Indisponível'}</Tag>}
      />
      <main className={`${o.main} ${o.narrow}`} style={{ gap: 16 }}>
        <Segmented<Tab>
          label="Lista"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'available', label: `Disponíveis · ${available.length}` },
            { value: 'mine', label: `Minhas · ${mine.length}` },
          ]}
        />
        {list.length === 0 ? (
          <EmptyState icon="entregas" title={tab === 'mine' ? 'Nenhuma entrega com você' : 'Nada disponível agora'} text={tab === 'mine' ? 'Quando o balcão atribuir uma entrega, ela aparece aqui.' : 'Fique de olho: novas entregas aparecem aqui assim que a loja marcar o pedido como pronto.'} />
        ) : (
          list.map((x) =>
            tab === 'mine' ? (
              <Link key={x.id} to={`/entregas/pedido/${x.id}`} className={o.card} style={{ gap: 10, padding: 16 }}>
                <span className={o.cardHead}>
                  <b style={{ fontSize: 17 }}>Pedido #{x.number}</b>
                  <Tag tone="info">{x.status === 'en_route' ? 'Em rota' : 'Para você'}</Tag>
                </span>
                <span className={o.iconLine}>
                  <Icon name="local" size={20} />
                  <span>
                    <b>{x.address?.line2}</b>
                    <span className={o.small} style={{ display: 'block' }}>{x.address?.line1}</span>
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 24 }}>
                  <span><span className={o.small} style={{ display: 'block' }}>Distância</span><b>{x.distanceKm ? `${x.distanceKm.toLocaleString('pt-BR')} km` : '—'}</b></span>
                  <span><span className={o.small} style={{ display: 'block' }}>Itens</span><b>{x.items.reduce((n, i) => n + i.quantity, 0)}</b></span>
                  <span><span className={o.small} style={{ display: 'block' }}>{partner ? 'Você recebe' : 'Cobrar'}</span><b>{partner ? fee : x.paid ? 'Nada' : formatCents(x.items.reduce((n, i) => n + i.quantity * i.unitPriceCents, 0) + x.feeCents)}</b></span>
                </span>
              </Link>
            ) : (
              <div key={x.id} className={o.card} style={{ gap: 10, padding: 16 }}>
                <span className={o.cardHead}>
                  <b style={{ fontSize: 17 }}>Pedido #{x.number}</b>
                  <Tag tone="success">Pronto às {hourMinute(x.createdAt)}</Tag>
                </span>
                <span className={o.iconLine}>
                  <Icon name="local" size={20} />
                  <span>
                    <b>{x.address?.line2}</b>
                    <span className={o.small} style={{ display: 'block' }}>{[x.distanceKm ? `${x.distanceKm.toLocaleString('pt-BR')} km` : null, `${x.items.reduce((n, i) => n + i.quantity, 0)} itens`].filter(Boolean).join(' · ')}</span>
                  </span>
                </span>
                <span className={o.muted}>{partner ? `Publicada para parceiros · você recebe ${fee}` : 'Ainda sem entregador. Você pode pegar.'}</span>
                {claimed === x.id ? (
                  <Banner tone="success">É sua. Fica na fila em “Minhas”.</Banner>
                ) : (
                  <Button
                    size="l"
                    block
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true)
                      setProblem(undefined)
                      try {
                        await claim(x.id, account)
                        setClaimed(x.id)
                      } catch (e) {
                        setProblem(courierErrorMessage(e))
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    {partner ? `Aceitar por ${fee}` : 'Pegar esta entrega'}
                  </Button>
                )}
              </div>
            ),
          )
        )}
        {problem && <Banner tone="error">{problem}</Banner>}
        <p className={o.muted}>
          {partner ? 'Como parceiro, você vê só as entregas que a casa publicou e recebe por entrega.' : 'Como entregador da casa, você recebe as entregas que o balcão atribui e pode pegar as que estão livres.'}
        </p>
      </main>
    </div>
  )
}
