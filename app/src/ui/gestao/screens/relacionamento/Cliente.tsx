import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { TextAreaField } from '@/components/Field'
import { fullDate, hourMinute, isTodayIso, shortDate } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { staffTotal } from '@/domain/staffOrder'
import { staffOrdersStore } from '@/services/gestao/orders'
import { supabase } from '@/lib/supabase'
import { remoteSaveCustomerNotes } from '@/services/gestao/peopleRemote'
import { customersStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar, ListRow } from '../../../shared/OpsBits'
import { orderTag } from '../Pedidos'
import s from '../estoque/Estoque.module.css'

export function Cliente() {
  const { id = '' } = useParams()
  const c = customersStore.useStore().find((x) => x.id === id)
  const orders = staffOrdersStore.useStore().filter((x) => x.customer.id === id)

  if (!c) {
    return (
      <div className={o.screen}>
        <Bar title="Cliente" back="/gestao/clientes" />
        <EmptyState bare icon="perfil" title="Cliente não encontrado" action={<ButtonLink to="/gestao/clientes">Ver clientes</ButtonLink>} />
      </div>
    )
  }

  const since = new Date(c.since).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })

  return (
    <div className={o.screen}>
      <Bar title="Cliente" back="/gestao/clientes" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div>
          <div style={{ font: '700 26px/32px var(--fonte-titulo)' }}>{c.name}</div>
          <div className={o.muted}>
            Cliente desde {since} · {c.channel}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {[
            ['Pedidos', String(c.orderCount)],
            ['Total', formatCents(c.totalCents)],
            ['Ticket médio', formatCents(Math.round(c.totalCents / Math.max(1, c.orderCount)))],
          ].map(([t, v]) => (
            <div key={t} className={s.bal} style={{ padding: 12 }}>
              <span style={{ fontSize: 12, lineHeight: '16px' }}>{t}</span>
              <b style={{ fontSize: 16, lineHeight: '22px' }}>{v}</b>
            </div>
          ))}
        </div>
        <div className={o.card}>
          <div className={o.bold}>Contato</div>
          <div className={`${o.secondary} ${o.num}`}>
            {c.phone} · WhatsApp
            <br />
            {c.address}
          </div>
        </div>
        {c.topItems.length > 0 && (
          <section className={o.section}>
            <h2 className={o.h2}>Mais compra</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {c.topItems.map((t) => (
                <span key={t.name} style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--fundo-suave)', border: '1px solid var(--linha)', font: '600 13px/18px var(--fonte-texto)' }}>
                  {t.name} · {t.times}×
                </span>
              ))}
            </div>
          </section>
        )}
        <section className={o.section}>
          <h2 className={o.h2}>Pedidos</h2>
          <Box>
            {orders.map((x) => (
              <ListRow
                key={x.id}
                title={`#${x.number} · ${isTodayIso(x.createdAt) ? 'hoje' : shortDate(x.createdAt)}`}
                sub={`${x.fulfillment === 'delivery' ? 'Entrega' : 'Retirada'} · ${x.items.length} itens · ${hourMinute(x.createdAt)}`}
                to={`/gestao/pedidos/${x.id}`}
                end={
                  <>
                    <b>{formatCents(staffTotal(x))}</b>
                    <Tag tone={orderTag[x.status].tone}>{orderTag[x.status].label}</Tag>
                  </>
                }
              />
            ))}
            {c.history.map((h) => (
              <ListRow
                key={h.number}
                title={`#${h.number} · ${shortDate(h.date)}`}
                sub={h.line}
                end={
                  <>
                    <b>{formatCents(h.totalCents)}</b>
                    <Tag tone="success">{h.status}</Tag>
                  </>
                }
              />
            ))}
            {orders.length + c.history.length === 0 && <p className={o.muted} style={{ padding: '12px 0' }}>Nenhum pedido registrado ainda.</p>}
          </Box>
        </section>
        <TextAreaField
          label="Observações internas"
          rows={2}
          value={c.notes}
          onChange={(e) => customersStore.set((all) => all.map((x) => (x.id === c.id ? { ...x, notes: e.target.value } : x)))}
          onBlur={() => {
            if (supabase) void remoteSaveCustomerNotes(c.id, c.notes)
          }}
        />
        <p className={o.muted}>Dados pessoais só para atender e entregar. A cliente pode pedir para apagar a conta.</p>
        <p className="sr-only">{fullDate(c.since)}</p>
      </main>
    </div>
  )
}
