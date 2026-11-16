import { Link } from 'react-router-dom'
import { Box } from '@/components/Card'
import { Icon } from '@/components/Icon'
import { greeting, longNow, minutesAgo } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { salesToday } from '@/mocks/gestao/dashboard'
import { staffOrdersStore } from '@/services/gestao/orders'
import { sessionStore } from '@/services/gestao/session'
import o from '@/styles/ops.module.css'
import { Kpi, ListRow } from '../../shared/OpsBits'
import s from './Inicio.module.css'

// H-G2 — Início mostra primeiro "Pede ação hoje"; faturamento do mês e gráficos ficam em Relatórios
export function Inicio() {
  const orders = staffOrdersStore.useStore()
  const session = sessionStore.useStore()
  const fresh = orders.filter((x) => x.status === 'new')
  const preparing = orders.filter((x) => x.status === 'separating')
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
            <span className={s.salesValue}>{formatCents(salesToday.totalCents)}</span>
            <span className={s.salesSub}>
              {salesToday.count} vendas · ontem até esta hora: {formatCents(salesToday.yesterdaySameTimeCents)}
            </span>
            <span className={s.split}>
              <span>
                <small>Balcão · {salesToday.counter.count}</small>
                <b>{formatCents(salesToday.counter.totalCents)}</b>
              </span>
              <span>
                <small>Internet · {salesToday.online.count}</small>
                <b>{formatCents(salesToday.online.totalCents)}</b>
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
              <ListRow icon="alerta" tone="error" title="Aluguel atrasado" sub="Venceu há 4 dias · R$ 1.800,00" to="/gestao/financeiro/contas" />
              <ListRow icon="financeiro" tone="warning" title="2 contas vencem hoje" sub="R$ 640,00 · Laticínios Serra Verde e energia" to="/gestao/financeiro/contas" />
              <ListRow icon="validade" tone="warning" title="3 lotes vencem em até 7 dias" sub="Queijo coalho, Doce de leite, Nata" to="/gestao/estoque" />
              <ListRow icon="estoque" tone="warning" title="7 itens com estoque baixo" sub="Tapioca granulada, Rapadura e mais 5" to="/gestao/estoque" />
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
              <Kpi label="Em produção" value="2 ordens" sub="Queijo coalho · Doce de leite" to="/gestao/producao" />
              <Kpi label="A pagar hoje" value="R$ 640,00" sub="2 contas" tone="error" to="/gestao/financeiro/contas" />
              <Kpi label="A receber na semana" value="R$ 1.150,00" sub="cartões e fiado" tone="success" to="/gestao/financeiro/contas" />
            </div>
          </section>
        </div>
        <p className={o.muted}>Faturamento do mês, comparativos e gráficos ficam em Relatórios, para o início mostrar só o que pede ação.</p>
      </main>
    </div>
  )
}
