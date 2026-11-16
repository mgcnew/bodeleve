import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag, type Tone } from '@/components/Badges'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { hourMinute } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { staffTotal, type StaffOrder, type StaffOrderStatus } from '@/domain/staffOrder'
import { plural } from '@/domain/catalog'
import { staffOrdersStore } from '@/services/gestao/orders'
import o from '@/styles/ops.module.css'
import { PageHeader } from '../../shared/OpsBits'

type Tab = Exclude<StaffOrderStatus, 'delivered'>

const tabs: { value: Tab; label: string }[] = [
  { value: 'new', label: 'Novos' },
  { value: 'separating', label: 'Em preparo' },
  { value: 'ready', label: 'Prontos' },
  { value: 'en_route', label: 'Em rota' },
]

export const orderTag: Record<StaffOrderStatus, { label: string; tone: Tone }> = {
  new: { label: 'Novo', tone: 'info' },
  separating: { label: 'Em preparo', tone: 'warning' },
  ready: { label: 'Pronto', tone: 'success' },
  en_route: { label: 'Em rota', tone: 'info' },
  delivered: { label: 'Entregue', tone: 'success' },
}

const emptyText: Record<Tab, string> = {
  new: 'Quando chegar um pedido novo, ele aparece aqui na hora.',
  separating: 'Pedidos aceitos ficam aqui enquanto são separados.',
  ready: 'Pedidos conferidos esperam aqui pelo entregador ou pela retirada.',
  en_route: 'Pedidos com o entregador aparecem aqui.',
}

export function Pedidos() {
  const orders = staffOrdersStore.useStore()
  const [tab, setTab] = useState<Tab>('new')
  const visible = orders.filter((x) => x.status === tab).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  return (
    <div className={o.screen}>
      <PageHeader title="Pedidos" sub="Loja e balcão, do dia" />
      <main className={o.main} style={{ gap: 16 }}>
        <FilterChips
          label="Filtrar por situação"
          value={tab}
          onChange={setTab}
          options={tabs.map((t) => ({ value: t.value, label: `${t.label} · ${orders.filter((x) => x.status === t.value).length}` }))}
        />
        {visible.length === 0 ? (
          <EmptyState icon="pedidos" title={`Nenhum pedido ${tabs.find((t) => t.value === tab)?.label.toLowerCase()}`} text={emptyText[tab]} />
        ) : (
          <div className={o.list} aria-live="polite">
            {visible.map((x) => (
              <OrderCard key={x.id} order={x} />
            ))}
          </div>
        )}
        {/* H-G5 — venda de balcão entra concluída e não aparece na fila */}
        <p className={o.muted}>Vendas de balcão já entram concluídas e aparecem no histórico do PDV.</p>
      </main>
    </div>
  )
}

function OrderCard({ order }: { order: StaffOrder }) {
  const tag = orderTag[order.status]
  const delivery = order.fulfillment === 'delivery'
  return (
    <Link to={`/gestao/pedidos/${order.id}`} className={o.card}>
      <span className={o.cardHead}>
        <span className={o.num} style={{ fontWeight: 600, fontSize: 17 }}>
          #{order.number} · {order.customer.name}
        </span>
        <Tag tone={tag.tone}>{tag.label}</Tag>
      </span>
      <span className={o.cardMeta}>
        <Icon name={delivery ? 'entregas' : 'local'} size={18} />
        <span>
          {delivery ? 'Entrega' : 'Retirada'} · {plural(order.items.reduce((n, i) => n + i.quantity, 0), 'item', 'itens')} · {hourMinute(order.createdAt)}
          {order.courierName ? ` · com ${order.courierName}` : ''}
        </span>
      </span>
      <span className={o.cardHead} style={{ font: 'var(--apoio)' }}>
        <span className={o.secondary}>{order.paid ? `${order.paymentLabel} · pago` : order.paymentLabel}</span>
        <b className={o.num}>{formatCents(staffTotal(order))}</b>
      </span>
    </Link>
  )
}
