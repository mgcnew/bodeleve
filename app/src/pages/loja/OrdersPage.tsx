import { AppLink, ButtonLink, EmptyState, Icon, ListSkeleton, StatusTag } from '@/components'
import { itemsLabel } from '@/domain/bag'
import { isInProgress, statusLabel, statusTone } from '@/domain/orders'
import type { Order } from '@/domain/types'
import { formatBRL, formatShortDate } from '@/lib/format'
import { useSession } from '@/store/bag'
import { useOrders } from '@/ui/loja/queries'
import { QueryBoundary, Section, TabTitle } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

function OrderCard({ order }: { order: Order }) {
  const count = order.items.reduce((a, i) => a + i.qty, 0)
  return (
    <AppLink href={`/pedidos/${order.id}`} className={s.card} style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--texto)', textDecoration: 'none' }}>
      <span className={s.spread}>
        <span className={s.strong}>Pedido {order.id}</span>
        <StatusTag tone={statusTone(order.status)}>{statusLabel[order.status]}</StatusTag>
      </span>
      <span className={`${s.spread} ${s.sub} ${s.tabular}`}>
        <span>{formatShortDate(order.createdAt)} · {itemsLabel(count)} · {formatBRL(order.totalCents)}</span>
        <Icon name="avancar" size={18} />
      </span>
    </AppLink>
  )
}

export function OrdersPage() {
  const query = useOrders()
  const signedIn = useSession((x) => !!x.phone)
  return (
    <>
      <TabTitle>Pedidos</TabTitle>
      <main className={s.main} style={{ paddingTop: 8 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={3} label="Carregando pedidos" />} errorTitle="Não foi possível carregar os pedidos">
          {(orders) => {
            const active = orders.filter(isInProgress)
            const past = orders.filter((o) => !isInProgress(o))
            if (orders.length === 0) {
              return <EmptyState icon="pedidos" title="Você ainda não fez pedidos" description="Quando fizer, eles aparecem aqui para acompanhar e pedir de novo." action={<ButtonLink href="/buscar">Ver produtos</ButtonLink>} />
            }
            return (
              <>
                {active.length > 0 && (
                  <Section title="Em andamento">
                    <div className={s.stack} style={{ gap: 8 }}>{active.map((o) => <OrderCard key={o.id} order={o} />)}</div>
                  </Section>
                )}
                {past.length > 0 && (
                  <Section title="Anteriores">
                    <div className={s.stack} style={{ gap: 8 }}>{past.map((o) => <OrderCard key={o.id} order={o} />)}</div>
                  </Section>
                )}
              </>
            )
          }}
        </QueryBoundary>
        {!signedIn && (
          <div className={s.card} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className={s.strong}>Comprou sem conta?</div>
            <div className={s.sub}>Estes são os pedidos feitos neste aparelho. Entre para ver todos.</div>
            <AppLink href="/entrar?next=/pedidos" className={s.link}>Entrar <Icon name="avancar" size={18} /></AppLink>
          </div>
        )}
      </main>
    </>
  )
}
