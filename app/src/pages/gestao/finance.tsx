import { useState, type FormEvent } from 'react'
import { AppLink, Banner, Button, ButtonLink, Chip, EmptyState, Icon, IndicatorSkeleton, ListSkeleton, StatusTag, TextField } from '@/components'
import { parseMoney } from '@/lib/format'
import { useServices } from '@/services'
import { useInvalidateFinance } from '@/ui/gestao/queries'
import type { AccountView } from '@/services/types'
import { formatBRL, formatLongDate, formatSignedBRL } from '@/lib/format'
import type { EntryView } from '@/services/types'
import { useFinanceEntries, useFinanceOverview, useLedger } from '@/ui/gestao/queries'
import { QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const tagTone = { Atrasado: 'error', 'Vence hoje': 'warning' } as const

/** Ao começar a usar o sistema: quanto há hoje no banco e na gaveta. Só se informa uma vez; depois o saldo muda por lançamentos. */
function OpeningBalance({ account }: { account: AccountView }) {
  const { admin } = useServices()
  const invalidate = useInvalidateFinance()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const cents = parseMoney(text)
    setFailed(false)
    if (cents == null || cents < 0) return setError('Informe o valor, por exemplo 1500,00. Se não há nada, escreva 0.')
    setError(undefined)
    setBusy(true)
    try {
      await admin.finance.setOpeningBalance(account.id, cents)
      await invalidate()
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} noValidate className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={l.strong}>{account.name}: quanto há hoje?</div>
      <TextField label="Saldo inicial (R$)" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} error={error} hint="Só se informa uma vez. Depois o saldo muda por vendas, pagamentos e transferências." />
      {failed && <Banner tone="error">Não foi possível salvar. Nada foi alterado. Tente de novo.</Banner>}
      <Button type="submit" variant="secondary" loading={busy}>Salvar saldo inicial</Button>
    </form>
  )
}

export function FinancePage() {
  const query = useFinanceOverview()
  const now = new Date()
  return (
    <>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Financeiro</h1>
          <div className={s.date}>{formatLongDate(now)}</div>
        </div>
      </header>
      <main className={s.main}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando o financeiro" />} errorTitle="Não foi possível carregar o financeiro">
          {(o) => (
            <>
              <div className={s.salesCard} role="group" aria-label="Saldo agora">
                <span className={s.salesTop}><span>Saldo agora</span></span>
                <span className={s.salesValue}>{formatBRL(o.totalCents)}</span>
                <span className={s.salesSplit}>
                  {o.accounts.map((a) => (
                    <span key={a.id}>
                      <span className={s.salesSplitLabel}>{a.name}</span>
                      <span className={s.salesSplitValue}>{formatBRL(a.balanceCents)}</span>
                    </span>
                  ))}
                </span>
              </div>

              {o.accounts.filter((a) => !a.opened).map((a) => <OpeningBalance key={a.id} account={a} />)}

              <section className={l.section} aria-labelledby="acao-t">
                <h2 id="acao-t" className={l.h2}>Pede ação hoje</h2>
                {o.attention.length === 0 ? (
                  <div className={l.card}>Nenhuma conta vence hoje nem está atrasada.</div>
                ) : (
                  <div className={l.linkList}>
                    {o.attention.map((a) => (
                      <AppLink key={a.id} href={a.href} className={l.linkRow} style={{ padding: '12px 0' }}>
                        <span className={l.grow}>
                          <span className={l.optionTitle}>{a.title}</span>
                          <span className={l.optionDetail}>{a.detail}</span>
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span className={`${l.strong} ${l.tabular}`}>{formatBRL(a.amountCents)}</span>
                          <StatusTag tone={tagTone[a.tag]}>{a.tag}</StatusTag>
                        </span>
                        <Icon name="avancar" size={18} />
                      </AppLink>
                    ))}
                  </div>
                )}
              </section>

              <section className={l.section} aria-labelledby="prev-t">
                <div className={l.spread} style={{ alignItems: 'baseline' }}>
                  <h2 id="prev-t" className={l.h2}>Próximos 7 dias</h2>
                  <span className={l.small}>saldo previsto</span>
                </div>
                {o.forecast.rows.length === 0 ? (
                  <div className={l.card}>Nada a pagar nem a receber nos próximos 7 dias.</div>
                ) : (
                  <div className={l.linkList}>
                    {o.forecast.rows.map((r) => (
                      <div key={r.key} className={l.cardRow} style={{ alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--linha)' }}>
                        <span style={{ width: 48 }} className={`${l.strong} ${l.small}`}>{r.label}</span>
                        <span className={l.grow}>{r.description}</span>
                        <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          <span className={l.optionTitle} style={{ color: r.deltaCents > 0 ? 'var(--sucesso)' : 'var(--texto)' }}>{formatSignedBRL(r.deltaCents).replace(' R$', ' R$')}</span>
                          <span className={l.optionDetail}>saldo {formatBRL(r.balanceAfter)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {o.forecast.finalLabel && (
                  <div className={l.sub}>Se tudo for pago e recebido como previsto, o saldo chega a {formatBRL(o.forecast.finalBalance)} em {o.forecast.finalLabel}.</div>
                )}
              </section>

              <div style={{ display: 'flex', gap: 8 }}>
                <ButtonLink href="/gestao/financeiro/contas" variant="secondary" style={{ flex: 1 }}>Contas</ButtonLink>
                <ButtonLink href="/gestao/financeiro/lancamentos" variant="secondary" style={{ flex: 1 }}>Lançamentos</ButtonLink>
              </div>
            </>
          )}
        </QueryBoundary>
      </main>
    </>
  )
}

function EntryRow({ e }: { e: EntryView }) {
  const inner = (
    <>
      <span className={l.grow}>
        <span className={l.optionTitle}>{e.title}</span>
        <span className={l.optionDetail}>{e.detail}</span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span className={`${l.strong} ${l.tabular}`}>{formatBRL(e.remainingCents)}</span>
        {e.tag && <StatusTag tone={e.tag.tone}>{e.tag.label}</StatusTag>}
      </span>
    </>
  )
  return e.direction === 'payable' ? (
    <AppLink href={`/gestao/financeiro/pagar/${e.id}`} className={l.linkRow} style={{ padding: '12px 0' }}>
      {inner}
      <Icon name="avancar" size={18} />
    </AppLink>
  ) : (
    <div className={l.linkRow} style={{ padding: '12px 0' }}>{inner}</div>
  )
}

function Group({ title, rows }: { title: string; rows: EntryView[] }) {
  if (rows.length === 0) return null
  return (
    <section className={l.section} aria-label={title}>
      <div className={l.small} style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
      <div className={l.linkList}>{rows.map((e) => <EntryRow key={e.id} e={e} />)}</div>
    </section>
  )
}

export function AccountsPage() {
  const query = useFinanceEntries()
  const [tab, setTab] = useState<'payable' | 'receivable'>('payable')
  return (
    <>
      <ScreenHeader title="Contas" back="/gestao/financeiro" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={4} label="Carregando contas" />} errorTitle="Não foi possível carregar as contas">
          {(d) => (
            <>
              <div role="group" aria-label="Tipo de conta" className={s.filters}>
                <Chip selected={tab === 'payable'} onClick={() => setTab('payable')}>A pagar · {formatBRL(d.payableTotalCents)}</Chip>
                <Chip selected={tab === 'receivable'} onClick={() => setTab('receivable')}>A receber · {formatBRL(d.receivableTotalCents)}</Chip>
              </div>
              {tab === 'payable' ? (
                d.payables.length === 0 ? (
                  <EmptyState icon="financeiro" title="Nenhuma conta a pagar" description="Contas de compra nascem no recebimento da mercadoria." />
                ) : (
                  <>
                    <Group title="Atrasadas" rows={d.payables.filter((e) => e.standing === 'overdue')} />
                    <Group title="Hoje" rows={d.payables.filter((e) => e.standing === 'today')} />
                    <Group title="Próximos dias" rows={d.payables.filter((e) => e.standing === 'upcoming')} />
                  </>
                )
              ) : d.receivables.length === 0 ? (
                <EmptyState icon="financeiro" title="Nada a receber" description="Cartões a liquidar e fiado aparecem aqui." />
              ) : (
                <>
                  <Group title="Esta semana" rows={d.receivables.filter((e) => e.standing === 'overdue' || e.standing === 'today' || Math.round((new Date(e.dueAt).getTime() - Date.now()) / 86_400_000) <= 7)} />
                  <Group title="Depois" rows={d.receivables.filter((e) => Math.round((new Date(e.dueAt).getTime() - Date.now()) / 86_400_000) > 7)} />
                </>
              )}
              <div className={l.sub}>Contas de compra nascem no recebimento da mercadoria. Despesas fixas se repetem todo mês.</div>
            </>
          )}
        </QueryBoundary>
      </main>
    </>
  )
}

export function LedgerPage() {
  const query = useLedger()
  const [tab, setTab] = useState<'all' | 'in' | 'out'>('all')
  const when = (iso: string) => {
    const d = new Date(iso)
    const n = new Date()
    return d.toDateString() === n.toDateString() ? 'Hoje' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  return (
    <>
      <ScreenHeader title="Lançamentos" back="/gestao/financeiro" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} label="Carregando lançamentos" />} errorTitle="Não foi possível carregar os lançamentos">
          {(d) => {
            const rows = d.rows.filter((r) => tab === 'all' || (tab === 'in' ? r.kind === 'in' : r.kind === 'out'))
            return (
              <>
                <div role="group" aria-label="Filtrar lançamentos" className={s.filters}>
                  <Chip selected={tab === 'all'} onClick={() => setTab('all')}>Todos</Chip>
                  <Chip selected={tab === 'in'} onClick={() => setTab('in')}>Entradas</Chip>
                  <Chip selected={tab === 'out'} onClick={() => setTab('out')}>Saídas</Chip>
                </div>
                {rows.length === 0 ? (
                  <EmptyState icon="financeiro" title="Nenhum lançamento" description="Vendas, compras e baixas de contas entram sozinhas." />
                ) : (
                  <ul className={l.linkList} style={{ margin: 0, listStyle: 'none' }}>
                    {rows.map((r) => (
                      <li key={r.id} className={l.cardRow} style={{ alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--linha)' }}>
                        <span className={s.disc} style={{ width: 36, height: 36, ...(r.kind === 'out' ? { background: 'var(--erro-fundo)', color: 'var(--erro)' } : r.kind === 'in' ? { background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' } : { background: 'var(--info-fundo)', color: 'var(--info)' }) }} aria-hidden="true">
                          <Icon name={r.kind === 'out' ? 'remover' : r.kind === 'in' ? 'adicionar' : 'avancar'} size={18} />
                        </span>
                        <span className={l.grow}>
                          <span className={l.optionTitle}>{r.title}</span>
                          <span className={l.optionDetail}>{when(r.at)} · {r.detail}</span>
                        </span>
                        <span className={`${l.strong} ${l.tabular}`} style={{ color: r.kind === 'in' ? 'var(--sucesso)' : 'var(--texto)' }}>
                          {r.kind === 'transfer' ? formatBRL(r.amountCents) : formatSignedBRL(r.amountCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className={l.sumRow}><span>Entradas no período</span><span style={{ color: 'var(--texto)' }}>{formatSignedBRL(d.inCents)}</span></div>
                  <div className={l.sumRow}><span>Saídas no período</span><span style={{ color: 'var(--texto)' }}>{formatSignedBRL(-d.outCents)}</span></div>
                </div>
                <div className={l.sub}>Vendas, compras e baixas de contas entram sozinhas. Transferência entre caixa e banco não conta como entrada nem saída.</div>
              </>
            )
          }}
        </QueryBoundary>
      </main>
    </>
  )
}
