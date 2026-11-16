import { Link } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Button } from '@/components/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { plural } from '@/domain/catalog'
import { formatCents } from '@/domain/money'
import { formatDate, isFinished, isToday, itemCount, orderTotal, type Order } from '@/domain/order'
import { useAsync } from '@/lib/useAsync'
import { listDeviceOrders } from '@/services/orders'
import { PageHeader } from '../../components/LojaShell'
import { ButtonLink } from '@/components/Button'
import l from '../../loja.module.css'
import s from './Pedidos.module.css'
import { statusTag } from './shared'

export function Pedidos() {
  const orders = useAsync(listDeviceOrders, [])

  return (
    <div className={l.screen}>
      <PageHeader title="Pedidos" />
      <main className={l.main} style={{ gap: 20 }}>
        {orders.status === 'loading' && (
          <div role="status" aria-label="Carregando pedidos" className={l.stack}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={s.order}>
                <Skeleton width="40%" height={18} />
                <Skeleton width="70%" />
              </div>
            ))}
          </div>
        )}
        {orders.status === 'error' && (
          <ErrorState
            title="Não foi possível carregar seus pedidos"
            text="Verifique a conexão e tente de novo."
            action={<Button onClick={orders.retry}>Tentar de novo</Button>}
          />
        )}
        {orders.status === 'ready' && <OrderGroups orders={orders.data} />}

        {/* H-L12 — quem compra sem conta vê os pedidos feitos neste aparelho */}
        <div className={l.soft}>
          <div style={{ fontWeight: 600 }}>Comprou sem conta?</div>
          <p style={{ font: 'var(--apoio)' }}>Estes são os pedidos feitos neste aparelho. Entre para ver todos.</p>
          <Link to="/entrar" className={l.linkArrow} style={{ color: 'var(--cor-terracota-pressionado)' }}>
            Entrar
            <Icon name="avancar" size={18} />
          </Link>
        </div>
      </main>
    </div>
  )
}

function OrderGroups({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon="pedidos"
        title="Nenhum pedido ainda"
        text="Os pedidos que você fizer neste aparelho aparecem aqui."
        action={<ButtonLink to="/">Ver produtos</ButtonLink>}
      />
    )
  }
  const active = orders.filter((o) => !isFinished(o.status))
  const past = orders.filter((o) => isFinished(o.status))
  return (
    <>
      {active.length > 0 && (
        <section className={l.stack}>
          <h2 className={l.h2}>Em andamento</h2>
          {active.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section className={l.stack}>
          <h2 className={l.h2}>Anteriores</h2>
          {past.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </section>
      )}
    </>
  )
}

function OrderCard({ order }: { order: Order }) {
  const tag = statusTag[order.status]
  const when = isToday(order.createdAt) ? 'Hoje' : formatDate(order.createdAt)
  return (
    <Link to={`/pedidos/${order.id}`} className={s.order}>
      <span className={s.orderHead}>
        <span className={s.orderNumber}>Pedido {order.number}</span>
        <Tag tone={tag.tone}>{tag.label}</Tag>
      </span>
      <span className={s.orderFoot}>
        <span>
          {when} · {plural(itemCount(order.items), 'item', 'itens')} · {formatCents(orderTotal(order))}
        </span>
        <Icon name="avancar" size={18} />
      </span>
    </Link>
  )
}
