import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ButtonLink, Chip, EmptyState, Icon, IndicatorSkeleton, ListSkeleton, StatusTag } from '@/components'
import { formatClock, formatDayMonth } from '@/lib/format'
import { useStockMovements } from '@/ui/gestao/queries'
import { QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

type Tab = 'all' | 'in' | 'out'

function when(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  return `${today ? 'Hoje' : formatDayMonth(iso)}, ${formatClock(iso)}`
}

export function StockMovementsPage() {
  const { id } = useParams()
  const query = useStockMovements(id)
  const [tab, setTab] = useState<Tab>('all')
  return (
    <>
      <ScreenHeader title="Movimentações" back={`/gestao/estoque/${id}`} />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<><IndicatorSkeleton label="Carregando item" /><ListSkeleton rows={5} label="Carregando movimentações" /></>} errorTitle="Não foi possível carregar as movimentações">
          {(data) =>
            !data ? (
              <EmptyState icon="estoque" title="Item não encontrado" action={<ButtonLink href="/gestao/estoque">Ver estoque</ButtonLink>} />
            ) : (
              <>
                <div>
                  <div className={l.strong} style={{ fontSize: 18 }}>{data.name}</div>
                  <div className={l.sub}>Saldo físico atual: {data.physical} un</div>
                </div>
                <div role="group" aria-label="Filtrar movimentações" className={s.filters}>
                  <Chip selected={tab === 'all'} onClick={() => setTab('all')}>Todas</Chip>
                  <Chip selected={tab === 'in'} onClick={() => setTab('in')}>Entradas</Chip>
                  <Chip selected={tab === 'out'} onClick={() => setTab('out')}>Saídas</Chip>
                </div>
                {(() => {
                  const rows = data.rows.filter((r) => tab === 'all' || (tab === 'in' ? r.qty > 0 : r.qty < 0))
                  return rows.length === 0 ? (
                    <EmptyState icon="historico" title="Nenhuma movimentação" description="Entradas e saídas deste item aparecem aqui." />
                  ) : (
                    <ul className={l.linkList} style={{ margin: 0, listStyle: 'none' }}>
                      {rows.map((m) => (
                        <li key={m.id} className={l.cardRow} style={{ padding: '12px 0', borderTop: '1px solid var(--linha)', alignItems: 'flex-start' }}>
                          <span className={s.disc} style={{ width: 36, height: 36, ...(m.qty < 0 ? { background: 'var(--erro-fundo)', color: 'var(--erro)' } : { background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }) }} aria-hidden="true">
                            <Icon name={m.qty < 0 ? 'remover' : 'adicionar'} size={18} />
                          </span>
                          <div className={l.grow}>
                            <div className={l.strong}>{m.description}{m.reversed && <> <StatusTag tone="neutral">Desfeito</StatusTag></>}</div>
                            <div className={l.small}>{when(m.at)}{m.lotCode ? ` · Lote ${m.lotCode}` : ''}{m.by ? ` · por ${m.by}` : ''}</div>
                          </div>
                          <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            <div className={l.strong}>{m.qty > 0 ? '+' : '−'}{Math.abs(m.qty)} un</div>
                            <div className={l.small}>saldo {m.balanceAfter}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                })()}
                <div className={l.sub}>Reservas de pedidos online não são movimentação: só baixam o estoque quando o pedido sai.</div>
              </>
            )
          }
        </QueryBoundary>
      </main>
    </>
  )
}
