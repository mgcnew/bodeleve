import { Link } from 'react-router-dom'
import { Box } from '@/components/Card'
import { Icon } from '@/components/Icon'
import { greeting, longNow, minutesAgo } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { useSalesReport } from '@/services/gestao/reports'
import { daysUntil } from '@/domain/dates'
import { entriesStore, productionStore } from '@/services/gestao/backoffice'
import { openEntries, overdueDays, remaining } from '@/services/gestao/finance'
import { useStockRows } from './estoque/Estoque'
import { staffOrdersStore } from '@/services/gestao/orders'
import { sessionStore } from '@/services/gestao/session'
import o from '@/styles/ops.module.css'
import { Kpi, ListRow } from '../../shared/OpsBits'
import s from './Inicio.module.css'

// H-G2 — Início mostra primeiro "Pede ação hoje"; faturamento do mês e gráficos ficam em Relatórios
export function Inicio() {
  const { today: salesToday, yesterdaySameTime } = useSalesReport()
  const orders = staffOrdersStore.useStore()
  const session = sessionStore.useStore()
  const fresh = orders.filter((x) => x.status === 'new')
  const preparing = orders.filter((x) => x.status === 'separating')
  const entries = entriesStore.useStore()
  const rows = useStockRows()
  const producing = productionStore.useStore().filter((p) => p.status === 'in_progress')
  const payables = openEntries(entries, 'payable')
  const overdue = payables.filter((e) => overdueDays(e) > 0)
  const dueToday = payables.filter((e) => daysUntil(e.dueDate) === 0)
  const sum = (l: typeof payables) => l.reduce((n, e) => n + remaining(e), 0)
  const receivableWeek = openEntries(entries, 'receivable').filter((e) => daysUntil(e.dueDate) <= 7)
  const low = rows.filter((r) => r.low)
  const expiringRows = rows.filter((r) => r.expiring.length > 0)
  const names = (l: string[], n: number) => (l.length > n ? `${l.slice(0, n).join(', ')} e mais ${l.length - n}` : l.join(', '))
  const oldest = fresh.reduce<string | null>((acc, x) => (!acc || x.createdAt < acc ? x.createdAt : acc), null)

  return (
    <div className={o.screen}>
      <header className={o.pageHeader}>
        <div>
          <div className={o.muted}>{longNow()}</div>
          <h1 className={o.pageTitle}>{greeting()}</h1>
        </div>
        <span className={s.chip}>{session?.establishment}</span>
      </header>
      <main className={o.main}>
        <div className={o.cols} style={{ gridTemplateColumns: undefined }}>
          {/* H-G3 — vendas do dia separadas em balcão e internet, comparadas com ontem no mesmo horário */}
          <Link to="/gestao/relatorios" className={s.sales}>
            <span className={s.salesHead}>
              <span>Vendas de hoje</span>
              <Icon name="avancar" size={18} />
            </span>
            <span className={s.salesValue}>{formatCents(salesToday.total)}</span>
            <span className={s.salesSub}>
              {salesToday.count} {salesToday.count === 1 ? 'venda' : 'vendas'} · ontem até esta hora: {formatCents(yesterdaySameTime)}
            </span>
            <span className={s.split}>
              <span>
                <small>Balcão · {salesToday.counter.count}</small>
                <b>{formatCents(salesToday.counter.total)}</b>
              </span>
              <span>
                <small>Internet · {salesToday.online.count}</small>
                <b>{formatCents(salesToday.online.total)}</b>
              </span>
            </span>
          </Link>

          <section className={o.section}>
            <h2 className={o.h2}>Pede ação hoje</h2>
            <Box>
              {fresh.length > 0 && (
                <ListRow
                  icon="pedidos"
                  tone="info"
                  title={fresh.length === 1 ? '1 pedido novo' : `${fresh.length} pedidos novos`}
                  sub={`Aguardando aceite · o mais antigo há ${oldest ? minutesAgo(oldest) : 0} min`}
                  to="/gestao/pedidos"
                />
              )}
              {overdue.map((e) => (
                <ListRow
                  key={e.id}
                  icon="alerta"
                  tone="error"
                  title={`${e.description} atrasado`}
                  sub={`Venceu há ${overdueDays(e)} ${overdueDays(e) === 1 ? 'dia' : 'dias'} · ${formatCents(remaining(e))}`}
                  to={`/gestao/financeiro/contas/${e.id}`}
                />
              ))}
              {dueToday.length > 0 && (
                <ListRow
                  icon="financeiro"
                  tone="warning"
                  title={dueToday.length === 1 ? '1 conta vence hoje' : `${dueToday.length} contas vencem hoje`}
                  sub={`${formatCents(sum(dueToday))} · ${dueToday.map((e) => e.counterpart).join(' e ')}`}
                  to="/gestao/financeiro/contas"
                />
              )}
              {expiringRows.length > 0 && (
                <ListRow
                  icon="validade"
                  tone="warning"
                  title={(() => {
                    const n = expiringRows.reduce((acc, r) => acc + r.expiring.length, 0)
                    return n === 1 ? '1 lote vence em até 7 dias' : `${n} lotes vencem em até 7 dias`
                  })()}
                  sub={names(expiringRows.map((r) => r.item.name.replace(/ \d+ ?(g|ml)$/, '')), 3)}
                  to="/gestao/estoque"
                />
              )}
              {low.length > 0 && (
                <ListRow
                  icon="estoque"
                  tone="warning"
                  title={`${low.length} ${low.length === 1 ? 'item com' : 'itens com'} estoque baixo`}
                  sub={names(low.map((r) => r.item.name.replace(/ \d+ ?(g|ml)$/, '')), 2)}
                  to="/gestao/estoque"
                />
              )}
              {overdue.length + dueToday.length + expiringRows.length + low.length + fresh.length === 0 && (
                <p className={o.muted} style={{ padding: '12px 0' }}>Nada pede ação agora.</p>
              )}
            </Box>
          </section>

          <section className={o.section}>
            <h2 className={o.h2}>Hoje na casa</h2>
            <div className={o.grid2}>
              <Kpi
                label="Pedidos em aberto"
                value={fresh.length + preparing.length}
                sub={`${fresh.length} novos · ${preparing.length} em preparo`}
                to="/gestao/pedidos"
              />
              <Kpi label="Em produção" value={`${producing.length} ${producing.length === 1 ? 'ordem' : 'ordens'}`} sub={producing.map((p) => p.number).join(' · ') || 'nenhuma agora'} to="/gestao/producao" />
              <Kpi label="A pagar hoje" value={formatCents(sum(dueToday))} sub={`${dueToday.length} ${dueToday.length === 1 ? 'conta' : 'contas'}`} tone="error" to="/gestao/financeiro/contas" />
              <Kpi label="A receber na semana" value={formatCents(sum(receivableWeek))} sub="cartões e fiado" tone="success" to="/gestao/financeiro/contas" />
            </div>
          </section>
        </div>
        <p className={o.muted}>Faturamento do mês, comparativos e gráficos ficam em Relatórios, para o início mostrar só o que pede ação.</p>
      </main>
    </div>
  )
}
