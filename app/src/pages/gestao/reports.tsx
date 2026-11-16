import { useState, type ReactNode } from 'react'
import { AppLink, Chip, Icon, IndicatorSkeleton, ListSkeleton } from '@/components'
import type { Period } from '@/domain/reports'
import { formatBRL } from '@/lib/format'
import { useReportsHub, useSalesReport } from '@/ui/gestao/queries'
import { QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const h2 = { font: '700 17px/24px var(--fonte-titulo)', margin: 0 } as const
const money = { fontWeight: 600, fontVariantNumeric: 'tabular-nums' } as const
const monthName = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'long' })

function Row({ title, detail, value, href }: { title: string; detail: string; value: ReactNode; href?: string }) {
  const body = (
    <>
      <span className={l.grow}>
        <span className={l.optionTitle}>{title}</span>
        <span className={l.optionDetail}>{detail}</span>
      </span>
      <span style={money}>{value}</span>
      {href && <Icon name="avancar" size={18} />}
    </>
  )
  return href ? <AppLink href={href} className={l.linkRow} style={{ minHeight: 72 }}>{body}</AppLink> : <div className={s.plainRow} style={{ minHeight: 72 }}>{body}</div>
}

export function ReportsPage() {
  const query = useReportsHub()
  return (
    <>
      <ScreenHeader title="Relatórios" back="/gestao/mais" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <div className={l.sub}>Números de {monthName(new Date())} até hoje. Toque em Vendas para ver por período.</div>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} label="Carregando relatórios" />} errorTitle="Não foi possível carregar os relatórios">
          {(h) => (
            <div className={l.linkList}>
              <Row title="Vendas" detail="Balcão e loja online, por dia e forma de pagamento" value={formatBRL(h.salesCents)} href="/gestao/relatorios/vendas" />
              <Row title="Produtos" detail={h.bestSeller ? `Mais vendido: ${h.bestSeller.name} · ${h.bestSeller.qty} un` : 'Ainda sem vendas no mês'} value={`${h.itemsSold} ${h.itemsSold === 1 ? 'item' : 'itens'}`} />
              <Row title="Estoque e perdas" detail={`Perdas no mês: ${h.losses.count} ${h.losses.count === 1 ? 'item' : 'itens'}`} value={h.losses.cents ? `− ${formatBRL(h.losses.cents)}` : formatBRL(0)} />
              <Row
                title="Produção"
                detail={`${h.production.orders} ${h.production.orders === 1 ? 'ordem' : 'ordens'}${h.production.yieldPercent == null ? '' : ` · rendimento médio ${h.production.yieldPercent}%`}`}
                value={`${h.production.units} un`}
              />
              <Row title="Resultado do mês" detail="Vendas menos custos e despesas pagas" value={h.resultCents < 0 ? `− ${formatBRL(-h.resultCents)}` : formatBRL(h.resultCents)} />
            </div>
          )}
        </QueryBoundary>
        <div className={l.sub}>A exportação em planilha (.xlsx) e PDF ainda não está disponível nesta versão.</div>
      </main>
    </>
  )
}

const periods: Array<{ key: Period; label: string }> = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: 'month', label: 'Mês' },
]

function Block({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section aria-label={title} className={l.stack} style={{ gap: 8 }}>
      <h2 style={h2}>{title}</h2>
      <div className={l.linkList}>
        {rows.map(([k, v]) => (
          <div key={k} className={s.plainRow} style={{ justifyContent: 'space-between', minHeight: 48 }}>
            <span>{k}</span>
            <span style={money}>{v}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function SalesReportPage() {
  const [period, setPeriod] = useState<Period>('7d')
  const [picked, setPicked] = useState<string | null>(null)
  const query = useSalesReport(period)
  return (
    <>
      <ScreenHeader title="Vendas" back="/gestao/relatorios" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <div role="group" aria-label="Período" className={s.filters}>
          {periods.map((p) => <Chip key={p.key} selected={period === p.key} onClick={() => { setPeriod(p.key); setPicked(null) }}>{p.label}</Chip>)}
        </div>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando vendas" />} errorTitle="Não foi possível carregar as vendas">
          {(r) => {
            const max = Math.max(1, ...(r.days ?? []).map((d) => d.cents))
            const sel = r.days?.find((d) => d.date === picked) ?? r.days?.[r.days.length - 1]
            return (
              <>
                <div className={l.stack} style={{ gap: 2 }}>
                  <div className={l.sub}>{r.label}</div>
                  <div style={{ font: '700 34px/40px var(--fonte-titulo)', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(r.totalCents)}</div>
                  <div className={l.sub}>{r.count} {r.count === 1 ? 'venda' : 'vendas'} · ticket médio {formatBRL(r.ticketCents)}</div>
                </div>
                {r.days && sel && (
                  <section aria-label="Vendas por dia" className={l.stack} style={{ gap: 8 }}>
                    <h2 style={h2}>Vendas por dia</h2>
                    <div role="status" style={{ fontWeight: 600 }}>{sel.date.slice(8, 10)}/{sel.date.slice(5, 7)} · {formatBRL(sel.cents)}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
                      {r.days.map((d) => {
                        const on = d.date === sel.date
                        return (
                          <button
                            key={d.date}
                            type="button"
                            aria-pressed={on}
                            aria-label={`${d.date.slice(8, 10)}/${d.date.slice(5, 7)}: ${formatBRL(d.cents)}`}
                            onClick={() => setPicked(d.date)}
                            style={{ flex: 1, minWidth: 44, minHeight: 44, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4, padding: 0, border: 0, background: 'transparent', color: 'var(--texto)', cursor: 'pointer', font: 'var(--apoio-pequeno)' }}
                          >
                            <span aria-hidden="true" style={{ width: '100%', height: Math.max(4, Math.round((d.cents / max) * 120)), borderRadius: 6, background: on ? 'var(--cor-terracota)' : 'var(--texto-secundario)', outline: on ? '2px solid var(--texto)' : 'none', outlineOffset: 1 }} />
                            <span aria-hidden="true" style={{ fontWeight: on ? 700 : 400 }}>{d.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className={l.sub}>Toque numa barra para ver o valor do dia.</div>
                  </section>
                )}
                <Block title="Por canal" rows={[['Balcão', formatBRL(r.counterCents)], ['Loja online', formatBRL(r.onlineCents)]]} />
                <Block title="Por forma de pagamento" rows={[['Pix', formatBRL(r.pixCents)], ['Cartão', formatBRL(r.cardCents)], ['Dinheiro', formatBRL(r.cashCents)]]} />
                <Block title="Mais vendidos" rows={r.top.length ? r.top.map((t) => [t.name, `${t.qty} un`] as [string, string]) : [['Sem vendas no período', '—']]} />
                <div className={l.sub}>A exportação em planilha ou PDF ainda não está disponível nesta versão.</div>
              </>
            )
          }}
        </QueryBoundary>
      </main>
    </>
  )
}
