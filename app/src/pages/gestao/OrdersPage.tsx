import { useState } from 'react'
import { AppLink, Button, Chip, EmptyState, Icon, ListSkeleton, StatusTag } from '@/components'
import { itemsLabel } from '@/domain/bag'
import { paymentSummary } from '@/domain/orderText'
import { stageOf, type OpenStage } from '@/domain/orders'
import { formatBRL, formatClock } from '@/lib/format'
import { useAdminOrders } from '@/ui/gestao/queries'
import { QueryBoundary } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const stages: Array<{ key: OpenStage; label: string; tag: string; tone: 'info' | 'warning' | 'success' }> = [
  { key: 'new', label: 'Novos', tag: 'Novo', tone: 'info' },
  { key: 'preparing', label: 'Em preparo', tag: 'Em preparo', tone: 'warning' },
  { key: 'ready', label: 'Prontos', tag: 'Pronto', tone: 'success' },
  { key: 'on_route', label: 'Em rota', tag: 'Em rota', tone: 'info' },
]

export function AdminOrdersPage() {
  const query = useAdminOrders()
  const [picked, setPicked] = useState<OpenStage | null>(null)
  return (
    <>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Pedidos</h1>
          <div className={s.date}>Loja e balcão, do dia</div>
        </div>
      </header>
      <main className={s.main} style={{ gap: 16 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={4} label="Carregando pedidos" />} errorTitle="Não foi possível carregar os pedidos">
          {(orders) => {
            const count = (k: OpenStage) => orders.filter((o) => stageOf(o) === k).length
            // Abre no primeiro grupo que tem pedido; se nenhum tem, em "Novos".
            const active = picked ?? stages.find((st) => count(st.key) > 0)?.key ?? 'new'
            const shown = orders.filter((o) => stageOf(o) === active)
            const info = stages.find((st) => st.key === active)!
            return (
              <>
                <div role="group" aria-label="Filtrar por situação" className={s.filters}>
                  {stages.map((st) => (
                    <Chip key={st.key} selected={active === st.key} onClick={() => setPicked(st.key)}>
                      {st.label} · {count(st.key)}
                    </Chip>
                  ))}
                </div>
                {shown.length === 0 ? (
                  <EmptyState
                    icon="pedidos"
                    title="Nenhum pedido pendente"
                    description="Quando chegar um pedido novo, ele aparece aqui na hora."
                    action={<Button variant="secondary" onClick={() => setPicked(stages.find((st) => count(st.key) > 0)?.key ?? 'new')}>Ver outros pedidos</Button>}
                  />
                ) : (
                  <div className={l.stack} style={{ gap: 10 }}>
                    {shown.map((o) => (
                      <AppLink key={o.id} href={`/gestao/pedidos/${o.id}`} className={`${l.card} ${s.orderCard}`}>
                        <span className={l.spread}>
                          <span className={l.strong}>#{o.id} · {o.contact.name}</span>
                          <StatusTag tone={info.tone}>{info.tag}</StatusTag>
                        </span>
                        <span className={l.sub} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Icon name={o.fulfillment === 'delivery' ? 'entregas' : 'local'} size={18} />
                          <span>{o.fulfillment === 'delivery' ? 'Entrega' : 'Retirada'} · {itemsLabel(o.items.reduce((a, i) => a + i.qty, 0))} · {formatClock(o.createdAt)}</span>
                        </span>
                        <span className={`${l.spread} ${l.sub}`}>
                          <span>{paymentSummary(o)}</span>
                          <b className={l.tabular} style={{ color: 'var(--texto)' }}>{formatBRL(o.totalCents)}</b>
                        </span>
                      </AppLink>
                    ))}
                  </div>
                )}
                <div className={l.sub}>Vendas de balcão já entram concluídas e aparecem no histórico do PDV.</div>
              </>
            )
          }}
        </QueryBoundary>
      </main>
    </>
  )
}
