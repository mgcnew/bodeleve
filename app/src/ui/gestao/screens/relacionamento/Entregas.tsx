import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { hourMinute, minutesAgo } from '@/domain/dates'
import type { StaffOrder } from '@/domain/staffOrder'
import { staffOrdersStore } from '@/services/gestao/orders'
import { couriersStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar, ListRow } from '../../../shared/OpsBits'

type Tab = 'out' | 'route' | 'done'

const deliveries = (orders: StaffOrder[]) => orders.filter((x) => x.fulfillment === 'delivery')

export function Entregas() {
  const orders = deliveries(staffOrdersStore.useStore())
  const couriers = couriersStore.useStore()
  const [tab, setTab] = useState<Tab>('out')
  const groups: Record<Tab, StaffOrder[]> = {
    out: orders.filter((x) => ['new', 'separating', 'ready'].includes(x.status)),
    route: orders.filter((x) => x.status === 'en_route'),
    done: orders.filter((x) => x.status === 'delivered'),
  }
  const visible = groups[tab]

  return (
    <div className={o.screen}>
      <Bar title="Entregas" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <FilterChips
          label="Filtrar entregas"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'out', label: `Para sair · ${groups.out.length}` },
            { value: 'route', label: `Em rota · ${groups.route.length}` },
            { value: 'done', label: `Entregues · ${groups.done.length}` },
          ]}
        />
        {visible.length === 0 ? (
          <EmptyState icon="entregas" title="Nenhuma entrega aqui" text="Pedidos com entrega aparecem nesta lista conforme avançam." />
        ) : (
          <div className={o.list}>
            {visible.map((x) => {
              const place = [x.address?.line2, x.distanceKm ? `${x.distanceKm.toLocaleString('pt-BR')} km` : null].filter(Boolean).join(' · ')
              const line =
                x.status === 'ready'
                  ? `Pronto há ${minutesAgo(x.createdAt)} min · ${place}${x.deliveryNote ? ` · ${x.deliveryNote}` : ''}`
                  : x.status === 'en_route'
                    ? `${x.courierName ?? 'Entregador'} (próprio) · saiu ${hourMinute(x.createdAt)}`
                    : x.status === 'delivered'
                      ? `${x.courierName ?? 'Parceiro'} · entregue ${hourMinute(x.createdAt)}`
                      : `${x.status === 'new' ? 'Novo' : 'Em separação'} · ${place}`
              const tag = x.status === 'ready' ? <Tag tone="success">Pronto</Tag> : x.status === 'en_route' ? <Tag tone="info">Em rota</Tag> : x.status === 'delivered' ? <Tag tone="success">Entregue</Tag> : <Tag tone="warning">Em preparo</Tag>
              const inner = (
                <>
                  <span className={o.cardHead}>
                    <b>
                      #{x.number} · {x.customer.name}
                    </b>
                    {tag}
                  </span>
                  <span className={`${o.muted} ${o.num}`}>{line}</span>
                </>
              )
              return x.status === 'ready' ? (
                <Link key={x.id} to={`/gestao/entregas/atribuir/${x.id}`} className={o.card} style={{ gap: 4 }}>
                  {inner}
                </Link>
              ) : (
                <Link key={x.id} to={`/gestao/pedidos/${x.id}`} className={o.card} style={{ gap: 4 }}>
                  {inner}
                </Link>
              )
            })}
          </div>
        )}
        <section className={o.section}>
          <h2 className={o.h2}>Entregadores</h2>
          <Box>
            {couriers.map((c) => (
              <ListRow
                key={c.id}
                title={c.name}
                sub={`${c.kind === 'own' ? 'Próprio' : 'Avulsos'} · ${c.note}`}
                end={c.status === 'en_route' ? <Tag tone="info">Em rota</Tag> : c.status === 'available' ? <Tag tone="success">Disponível</Tag> : c.status === 'offline' ? <Tag tone="warning">Indisponível</Tag> : <span style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--cor-creme)', border: '1px solid var(--linha)', font: '600 13px/18px var(--fonte-texto)' }}>{c.note.split(' com')[0]} online</span>}
              />
            ))}
          </Box>
        </section>
      </main>
    </div>
  )
}
