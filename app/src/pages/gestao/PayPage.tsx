import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Banner, Button, ButtonLink, EmptyState, Icon, IndicatorSkeleton, StatusTag, TextField } from '@/components'
import type { AccountId } from '@/domain/finance'
import { formatBRL, parseMoney } from '@/lib/format'
import { parseBrDate, formatBrDate } from '@/domain/purchasing'
import { useServices } from '@/services'
import type { EntryView, PayResult } from '@/services/types'
import { useFinanceEntry, useInvalidateFinance } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const methods = ['Pix', 'Transferência', 'Boleto', 'Dinheiro']
const selectStyle = { height: 48, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)' } as const

function Form({ entry, accounts, onDone }: { entry: EntryView; accounts: Array<{ id: AccountId; name: string; balanceCents: number }>; onDone: (r: PayResult, totalCents: number) => void }) {
  const { admin } = useServices()
  const invalidate = useInvalidateFinance()
  const [amount, setAmount] = useState(formatBRL(entry.remainingCents))
  const [fine, setFine] = useState(formatBRL(0))
  const [date, setDate] = useState(formatBrDate(new Date().toISOString()))
  const [account, setAccount] = useState<AccountId>('bank')
  const [method, setMethod] = useState(methods[0])
  const [receipt, setReceipt] = useState<string | undefined>()
  const [errors, setErrors] = useState<{ amount?: string; fine?: string; date?: string }>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [busy, setBusy] = useState<'pay' | 'undo' | null>(null)

  const amountCents = parseMoney(amount)
  const fineCents = parseMoney(fine)
  const acc = accounts.find((a) => a.id === account)!
  const total = (amountCents ?? 0) + (fineCents ?? 0)
  const insufficient = amountCents != null && fineCents != null && acc.balanceCents < total

  const pay = async () => {
    setBanner(null)
    const e: typeof errors = {}
    if (amountCents == null || amountCents <= 0) e.amount = 'Informe o valor pago, por exemplo R$ 1.800,00.'
    else if (amountCents > entry.remainingCents) e.amount = `O valor não pode passar do que falta pagar (${formatBRL(entry.remainingCents)}).`
    if (fineCents == null) e.fine = 'Informe multa e juros, ou R$ 0,00.'
    const paidAt = parseBrDate(date)
    if (!paidAt) e.date = 'Data inválida. Use dia/mês/ano.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy('pay')
    try {
      const r = await admin.finance.pay(entry.id, { amountCents: amountCents!, fineCents: fineCents!, accountId: account, method, paidAt: paidAt!, receiptName: receipt })
      await invalidate()
      onDone(r, total)
    } catch (err) {
      const code = (err as { code?: string }).code
      setBanner(code === 'insufficient_balance' ? `${acc.name} tem ${formatBRL(acc.balanceCents)}. Escolha outra origem ou pague só uma parte.` : 'Não foi possível registrar o pagamento. Nada foi alterado. Tente de novo.')
    }
    setBusy(null)
  }
  return (
    <>
      <div className={l.stack} style={{ gap: 6 }}>
        {entry.tag && <div><StatusTag tone={entry.tag.tone}>{entry.tag.label}{entry.standing === 'overdue' ? ` · ${entry.daysLate} ${entry.daysLate === 1 ? 'dia' : 'dias'}` : ''}</StatusTag></div>}
        <h1 className={l.h1} style={{ fontSize: 22 }}>{entry.title}</h1>
        <div className={l.sub}>{entry.detail.replace(/ · venceu \d{2}\/\d{2}$/, '')} · {entry.standing === 'overdue' ? 'venceu em' : 'vence em'} {formatBrDate(entry.dueAt)} · {formatBRL(entry.remainingCents)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <TextField label="Valor pago" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} />
        <TextField label="Multa e juros" inputMode="decimal" value={fine} onChange={(e) => setFine(e.target.value)} error={errors.fine} />
      </div>
      <TextField label="Data do pagamento" inputMode="numeric" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
      <div className={l.stack} style={{ gap: 8 }}>
        <div id="olbl" className={l.strong} style={{ fontSize: 14 }}>Saiu de onde</div>
        <div role="group" aria-labelledby="olbl" style={{ display: 'flex', gap: 8 }}>
          {accounts.map((a) => (
            <button key={a.id} type="button" aria-pressed={account === a.id} onClick={() => setAccount(a.id)} style={{ flex: 1, minHeight: 64, padding: '10px 12px', borderRadius: 12, background: 'var(--superficie)', border: account === a.id ? '2px solid var(--cor-grafite)' : '1.5px solid var(--linha)', textAlign: 'left' }}>
              <span style={{ display: 'block', fontWeight: 600 }}>{a.name}</span>
              <span className={`${l.small} ${l.tabular}`} style={{ display: 'block' }}>{formatBRL(a.balanceCents)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={l.stack} style={{ gap: 6 }}>
        <label htmlFor="forma" className={l.strong} style={{ fontSize: 14 }}>Forma</label>
        <select id="forma" value={method} onChange={(e) => setMethod(e.target.value)} style={selectStyle}>{methods.map((m) => <option key={m}>{m}</option>)}</select>
      </div>
      <div className={l.stack} style={{ gap: 6 }}>
        <label htmlFor="comp" className={l.strong} style={{ fontSize: 14 }}>Comprovante (opcional)</label>
        <input id="comp" type="file" accept="image/*,application/pdf" style={{ minHeight: 44 }} onChange={(e) => setReceipt(e.target.files?.[0]?.name)} />
        {receipt && <div className={l.small}>Anexo: {receipt}. O arquivo só será guardado quando o armazenamento for ligado.</div>}
      </div>
      {insufficient ? (
        <div role="alert" className={l.cardRow} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--erro-fundo)', color: 'var(--erro)', alignItems: 'flex-start', gap: 10 }}>
          <Icon name="alerta" size={20} />
          <span>{acc.id === 'cash' ? 'O caixa' : 'A conta no banco'} tem {formatBRL(acc.balanceCents)}. Escolha {acc.id === 'cash' ? 'o banco' : 'o caixa'} ou pague só uma parte.</span>
        </div>
      ) : (
        <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={l.sumRow}><span>Saldo depois do pagamento</span><span style={{ color: 'var(--texto)' }}>{formatBRL(acc.balanceCents - total)} {account === 'bank' ? 'no banco' : 'no caixa'}</span></div>
        </div>
      )}
      {banner && <Banner tone="error">{banner}</Banner>}
      <Footer>
        {insufficient ? (
          <Button size="lg" fullWidth disabled>Saldo insuficiente {account === 'cash' ? 'no caixa' : 'no banco'}</Button>
        ) : (
          <Button size="lg" fullWidth loading={busy === 'pay'} onClick={pay}>{busy === 'pay' ? 'Registrando…' : 'Registrar pagamento'}</Button>
        )}
      </Footer>
    </>
  )
}

function Done({ done, total, onUndone }: { done: PayResult; total: number; onUndone: () => void }) {
  const { admin } = useServices()
  const invalidate = useInvalidateFinance()
  const [banner, setBanner] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const undo = async () => {
    setBusy(true)
    try {
      await admin.finance.undoPay(done.transactionId)
      await invalidate()
      onUndone()
      return
    } catch {
      setBanner('Não foi possível desfazer: a próxima despesa já foi mexida. Faça um novo lançamento para corrigir.')
    }
    setBusy(false)
  }
  return (
    <>
      <div className={l.stack} style={{ alignItems: 'center', gap: 12, paddingTop: 24, textAlign: 'center' }}>
        <div className={l.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
        <h1 className={l.h1}>{done.entry.title} {done.entry.paid ? 'pago' : 'pago em parte'}</h1>
        <div className={l.sub}>
          {formatBRL(total)} saiu de {done.accountName.toLowerCase()}. Saldo agora: {formatBRL(done.balanceAfter)}.
          {!done.entry.paid && <><br />Ainda faltam {formatBRL(done.entry.remainingCents)}.</>}
          {done.next && <><br />O próximo {done.next.title.toLowerCase()} já está lançado para {formatBrDate(done.next.dueAt).slice(0, 5)}.</>}
        </div>
        {banner && <Banner tone="error">{banner}</Banner>}
      </div>
      <Footer>
        <ButtonLink href="/gestao/financeiro/contas" size="lg" fullWidth>Voltar às contas</ButtonLink>
        <Button variant="ghost" fullWidth loading={busy} onClick={undo}>Desfazer</Button>
      </Footer>
    </>
  )
}

export function PayPage() {
  const { id } = useParams()
  const query = useFinanceEntry(id)
  const [done, setDone] = useState<{ r: PayResult; total: number } | null>(null)
  return (
    <>
      <ScreenHeader title="Pagar conta" back="/gestao/financeiro/contas" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando conta" />} errorTitle="Não foi possível carregar a conta">
          {(d) =>
            done ? (
              <Done done={done.r} total={done.total} onUndone={() => setDone(null)} />
            ) : !d ? (
              <EmptyState icon="financeiro" title="Conta não encontrada" action={<ButtonLink href="/gestao/financeiro/contas">Ver contas</ButtonLink>} />
            ) : d.entry.paid ? (
              <EmptyState icon="confirmar" title="Esta conta já foi paga" action={<ButtonLink href="/gestao/financeiro/contas">Ver contas</ButtonLink>} />
            ) : d.entry.direction === 'receivable' ? (
              <EmptyState icon="financeiro" title="Esta é uma conta a receber" description="O recebimento de cartão e fiado ainda não tem baixa nesta versão." action={<ButtonLink href="/gestao/financeiro/contas">Ver contas</ButtonLink>} />
            ) : (
              <Form key={d.entry.id} entry={d.entry} accounts={d.accounts} onDone={(r, total) => setDone({ r, total })} />
            )
          }
        </QueryBoundary>
      </main>
    </>
  )
}
