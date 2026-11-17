import { Link } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { ButtonLink } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { daysUntil, longNow, shortDate, daysFromToday } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { accountsStore, entriesStore, ledgerStore } from '@/services/gestao/backoffice'
import { accountBalance, forecast, openEntries, overdueDays, remaining, totalBalance } from '@/services/gestao/finance'
import o from '@/styles/ops.module.css'
import { PageHeader } from '../../../shared/OpsBits'
import s from './Financeiro.module.css'

export function Financeiro() {
  const accounts = accountsStore.useStore()
  const ledger = ledgerStore.useStore()
  const entries = entriesStore.useStore()
  const total = totalBalance(accounts, ledger)

  const payables = openEntries(entries, 'payable')
  const overdue = payables.filter((e) => overdueDays(e) > 0)
  const today = payables.filter((e) => daysUntil(e.dueDate) === 0)
  const days = forecast(entries, total)
  const last = days.at(-1)

  return (
    <div className={o.screen}>
      <PageHeader title="Financeiro" sub={longNow().split(' · ')[0]} />
      <main className={o.main}>
        <div className={o.cols}>
          <div className={s.balance}>
            <span className={s.balanceHead}>Saldo agora</span>
            <span className={s.balanceValue}>{formatCents(total)}</span>
            {/* H-G20 — conta no banco e caixa (gaveta) */}
            <span className={s.split}>
              {accounts.map((a) => (
                <span key={a.id}>
                  <small>{a.name}</small>
                  <b>{formatCents(accountBalance(a, ledger))}</b>
                </span>
              ))}
            </span>
          </div>

          <section className={o.section}>
            <h2 className={o.h2}>Pede ação hoje</h2>
            {overdue.length + today.length === 0 ? (
              <p className={o.muted}>Nenhuma conta vencida ou vencendo hoje.</p>
            ) : (
              <Box>
                {overdue.map((e) => (
                  <Link key={e.id} to={`/gestao/financeiro/contas/${e.id}`} className={s.item}>
                    <span style={{ flex: '1 1 0', minWidth: 0 }}>
                      <span className={o.bold} style={{ display: 'block' }}>{e.description}</span>
                      <span className={o.small}>
                        Venceu em {shortDate(e.dueDate)} · {overdueDays(e)} {overdueDays(e) === 1 ? 'dia' : 'dias'} de atraso
                      </span>
                    </span>
                    <span className={s.end}>
                      <b style={{ color: 'var(--erro)' }}>{formatCents(remaining(e))}</b>
                      <Tag tone="error">Atrasado</Tag>
                    </span>
                    <Icon name="avancar" size={18} />
                  </Link>
                ))}
                {today.length > 0 && (
                  <Link to="/gestao/financeiro/contas" className={s.item}>
                    <span style={{ flex: '1 1 0', minWidth: 0 }}>
                      <span className={o.bold} style={{ display: 'block' }}>
                        {today.length === 1 ? '1 conta vence hoje' : `${today.length} contas vencem hoje`}
                      </span>
                      <span className={o.small}>{today.map((e) => e.counterpart).join(' e ')}</span>
                    </span>
                    <span className={s.end}>
                      <b>{formatCents(today.reduce((n, e) => n + remaining(e), 0))}</b>
                      <Tag tone="warning">Vence hoje</Tag>
                    </span>
                    <Icon name="avancar" size={18} />
                  </Link>
                )}
              </Box>
            )}
          </section>

          <section className={o.section}>
            <div className={o.cardHead} style={{ alignItems: 'baseline' }}>
              <h2 className={o.h2}>Próximos 7 dias</h2>
              <span className={o.muted}>saldo previsto</span>
            </div>
            {days.length === 0 ? (
              <p className={o.muted}>Nada previsto para os próximos 7 dias.</p>
            ) : (
              <Box>
                {days.map((d) => (
                  <div key={d.day} className={s.day}>
                    <span className={s.dayLabel}>{d.label || shortDate(daysFromToday(Number(d.day)))}</span>
                    <span className={s.dayText}>{d.text}</span>
                    <span style={{ textAlign: 'right' }}>
                      <b style={{ display: 'block', color: d.netCents > 0 ? 'var(--sucesso)' : undefined }}>
                        {d.netCents > 0 ? '+' : '−'} {formatCents(Math.abs(d.netCents))}
                      </b>
                      <span className={o.small}>saldo {formatCents(d.balanceCents)}</span>
                    </span>
                  </div>
                ))}
              </Box>
            )}
            {last && (
              <p className={`${o.muted} ${o.num}`}>
                Se tudo for pago e recebido como previsto, o saldo chega a {formatCents(last.balanceCents)} em {last.label || shortDate(daysFromToday(Number(last.day)))}.
              </p>
            )}
          </section>
        </div>
        <div style={{ display: 'flex', gap: 8, maxWidth: 480 }}>
          <ButtonLink to="/gestao/financeiro/contas" variant="secondary" block>
            Contas
          </ButtonLink>
          <ButtonLink to="/gestao/financeiro/lancamentos" variant="secondary" block>
            Lançamentos
          </ButtonLink>
        </div>
        <ButtonLink to="/gestao/financeiro/saldo-inicial" variant="quiet" style={{ alignSelf: 'flex-start', padding: 0 }}>
          Informar saldo inicial das contas
        </ButtonLink>
      </main>
    </div>
  )
}
