import { AppLink, Icon, Indicator, IndicatorSkeleton } from '@/components'
import { formatBRL, formatClock, formatLongDate, greeting } from '@/lib/format'
import { useAdminDashboard } from '@/ui/gestao/queries'
import { QueryBoundary } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

export function DashboardPage() {
  const query = useAdminDashboard()
  const now = new Date()
  return (
    <>
      <header className={s.header}>
        <div>
          <div className={s.date}>{formatLongDate(now)} · {formatClock(now)}</div>
          <h1 className={s.title}>{greeting(now)}</h1>
        </div>
        <span className={s.pill}>Bodeleve</span>
      </header>
      <main className={s.main}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando o dia" />} errorTitle="Não foi possível carregar o início">
          {(d) => (
            <>
              <AppLink href="/gestao/pedidos" className={s.salesCard}>
                <span className={s.salesTop}><span>Vendas de hoje</span><Icon name="avancar" size={18} /></span>
                <span className={s.salesValue}>{formatBRL(d.salesToday.totalCents)}</span>
                <span style={{ fontSize: 14 }}>
                  {d.salesToday.count} vendas · ontem até esta hora: {formatBRL(d.salesToday.yesterdayUntilNowCents)}
                </span>
                <span className={s.salesSplit}>
                  <span>
                    <span className={s.salesSplitLabel}>Balcão · {d.salesToday.counter.count}</span>
                    <span className={s.salesSplitValue}>{formatBRL(d.salesToday.counter.cents)}</span>
                  </span>
                  <span>
                    <span className={s.salesSplitLabel}>Internet · {d.salesToday.online.count}</span>
                    <span className={s.salesSplitValue}>{formatBRL(d.salesToday.online.cents)}</span>
                  </span>
                </span>
              </AppLink>

              <section className={l.section} aria-labelledby="acao-t">
                <h2 id="acao-t" className={l.h2}>Pede ação hoje</h2>
                {d.attention.length === 0 ? (
                  <div className={l.card}>Nada pede ação agora.</div>
                ) : (
                  <div className={l.linkList}>
                    {d.attention.map((a) => (
                      <AppLink key={a.id} href={a.href} className={l.linkRow} style={{ minHeight: 64 }}>
                        <span className={`${s.disc} ${a.id === 'rent' ? s.discErr : a.id === 'low' || a.id === 'lots' ? s.discWarn : ''}`}><Icon name={a.icon} size={20} /></span>
                        <span className={l.grow}>
                          <span className={l.optionTitle}>{a.title}</span>
                          <span className={l.optionDetail}>{a.detail}</span>
                        </span>
                        <Icon name="avancar" size={18} />
                      </AppLink>
                    ))}
                  </div>
                )}
              </section>

              <section className={l.section} aria-labelledby="casa-t">
                <h2 id="casa-t" className={l.h2}>Hoje na casa</h2>
                <div className={s.todayGrid}>
                  <AppLink href="/gestao/pedidos" className={s.indicatorLink}>
                    <Indicator label="Pedidos em aberto" value={String(d.today.openOrders.count)} caption={`${d.today.openOrders.newCount} novos · ${d.today.openOrders.preparingCount} em preparo`} />
                  </AppLink>
                  <AppLink href="/gestao/producao" className={s.indicatorLink}>
                    <Indicator label="Em produção" value={`${d.today.inProduction.count} ordens`} caption={d.today.inProduction.detail} />
                  </AppLink>
                  <AppLink href="/gestao/financeiro/contas" className={s.indicatorLink}>
                    <Indicator label="A pagar hoje" value={formatBRL(d.today.payableToday.cents)} caption={`${d.today.payableToday.count} contas`} tone="error" />
                  </AppLink>
                  <AppLink href="/gestao/financeiro/contas" className={s.indicatorLink}>
                    <Indicator label="A receber na semana" value={formatBRL(d.today.receivableWeek.cents)} caption={d.today.receivableWeek.detail} />
                  </AppLink>
                </div>
              </section>
              <div className={l.sub}>Faturamento do mês, comparativos e gráficos ficam em Relatórios, para o início mostrar só o que pede ação.</div>
            </>
          )}
        </QueryBoundary>
      </main>
    </>
  )
}
