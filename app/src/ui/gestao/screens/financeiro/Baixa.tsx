import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { SelectField, TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { daysFromToday, fullDate } from '@/domain/dates'
import { formatCents, parseCents } from '@/domain/money'
import { accountsStore, entriesStore, ledgerStore } from '@/services/gestao/backoffice'
import { accountBalance, overdueDays, remaining, settleEntry, undoSettlement, type Settlement } from '@/services/gestao/finance'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import s from '../estoque/Estoque.module.css'

const methods = ['Pix', 'Transferência', 'Boleto', 'Dinheiro']

const money = (cents: number) => formatCents(cents)

export function Baixa() {
  const { id = '' } = useParams()
  const entry = entriesStore.useStore().find((e) => e.id === id)
  const accounts = accountsStore.useStore()
  const ledger = ledgerStore.useStore()

  const [paid, setPaid] = useState<string | null>(null)
  const [extra, setExtra] = useState('R$ 0,00')
  const [date, setDate] = useState(daysFromToday(0).slice(0, 10))
  const [accountId, setAccountId] = useState('banco')
  const [method, setMethod] = useState('Pix')
  const [done, setDone] = useState<{ settlement: Settlement; text: string } | null>(null)

  if (!entry) {
    return (
      <div className={o.screen}>
        <Bar title="Conta" back="/gestao/financeiro/contas" />
        <EmptyState bare icon="financeiro" title="Conta não encontrada" action={<ButtonLink to="/gestao/financeiro/contas">Ver contas</ButtonLink>} />
      </div>
    )
  }

  const pay = entry.direction === 'payable'
  const verb = pay ? 'Pagar conta' : 'Receber'
  const value = parseCents(paid ?? money(remaining(entry))) ?? 0
  const extraCents = parseCents(extra) ?? 0
  const total = value + extraCents
  const account = accounts.find((a) => a.id === accountId)!
  const balance = accountBalance(account, ledger)
  const after = pay ? balance - total : balance + total
  // H-G23 — avisa se o saldo da origem não cobre
  const insufficient = pay && total > balance
  const late = overdueDays(entry)

  const submit = () => {
    const settlement = settleEntry({ entryId: entry.id, amountCents: value, extraCents, at: new Date(`${date}T12:00:00`).toISOString(), accountId, method })
    const next = settlement.nextId ? ` O próximo ${entry.description.toLowerCase()} já está lançado.` : ''
    setDone({
      settlement,
      text: `${money(total)} ${pay ? `saiu da ${account.name.toLowerCase()}` : `entrou na ${account.name.toLowerCase()}`}. Saldo agora: ${money(after)}.${next}`,
    })
  }

  if (done) {
    return (
      <div className={o.screen}>
        <Bar title={verb} back="/gestao/financeiro/contas" />
        <main className={s.done}>
          <div aria-hidden="true" className={s.doneIcon}>
            <Icon name="confirmar" size={32} />
          </div>
          <h2 style={{ font: '700 24px/30px var(--fonte-titulo)' }}>
            {entry.description} {pay ? 'pago' : 'recebido'}
          </h2>
          <p className={`${o.secondary} ${o.num}`}>{done.text}</p>
        </main>
        <div className={o.footer}>
          <ButtonLink to="/gestao/financeiro/contas" size="l" block>
            Voltar às contas
          </ButtonLink>
          <Button
            variant="secondary"
            block
            onClick={() => {
              undoSettlement(done.settlement)
              setDone(null)
            }}
          >
            Desfazer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={o.screen}>
      <Bar title={verb} back="/gestao/financeiro/contas" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div className={o.section} style={{ gap: 6 }}>
          {late > 0 && (
            <div>
              <Tag tone="error">Atrasado · {late} {late === 1 ? 'dia' : 'dias'}</Tag>
            </div>
          )}
          <div style={{ font: '700 26px/32px var(--fonte-titulo)' }}>{entry.description}</div>
          <div className={`${o.muted} ${o.num}`}>
            {entry.recurring ? 'Despesa fixa · ' : ''}
            {late > 0 ? 'venceu' : 'vence'} em {fullDate(entry.dueDate)} · {money(remaining(entry))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <TextField label={pay ? 'Valor pago' : 'Valor recebido'} inputMode="decimal" value={paid ?? money(remaining(entry))} onChange={(e) => setPaid(e.target.value)} />
          <TextField label="Multa e juros" inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} />
        </div>
        <TextField label={pay ? 'Data do pagamento' : 'Data do recebimento'} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className={o.section}>
          <div id="origem" className={o.bold}>
            {pay ? 'Saiu de onde' : 'Entrou onde'}
          </div>
          <div role="group" aria-labelledby="origem" style={{ display: 'flex', gap: 8 }}>
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={accountId === a.id}
                onClick={() => setAccountId(a.id)}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  minHeight: 64,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: accountId === a.id ? '2px solid var(--cor-grafite)' : '1.5px solid var(--linha)',
                  background: 'var(--superficie)',
                  textAlign: 'left',
                  font: '400 14px var(--fonte-texto)',
                  fontVariantNumeric: 'tabular-nums',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'block', fontWeight: 600, fontSize: 16 }}>{a.name}</span>
                <span style={{ color: 'var(--texto-secundario)' }}>{money(accountBalance(a, ledger))}</span>
              </button>
            ))}
          </div>
        </div>
        <SelectField label="Forma" value={method} onChange={(e) => setMethod(e.target.value)} options={methods.map((m) => ({ value: m, label: m }))} />
        <TextField label="Comprovante (opcional)" type="file" disabled help="Disponível quando o armazenamento de arquivos estiver ligado." />
        {insufficient ? (
          <Banner tone="error">{`${account.name} tem ${money(balance)}. Escolha ${accounts.find((a) => a.id !== accountId)?.name.toLowerCase()} ou pague só uma parte.`}</Banner>
        ) : (
          <div className={o.card}>
            <div className={`${o.sumRow} ${o.num}`}>
              <span>{pay ? 'Saldo depois do pagamento' : 'Saldo depois do recebimento'}</span>
              <span>{money(after)} {account.id === 'banco' ? 'no banco' : 'no caixa'}</span>
            </div>
          </div>
        )}
      </main>
      <div className={o.footer}>
        {insufficient ? (
          <Button size="l" block disabled>
            Saldo insuficiente {accountId === 'caixa' ? 'no caixa' : 'no banco'}
          </Button>
        ) : (
          <Button size="l" block onClick={submit} disabled={total <= 0}>
            {pay ? 'Registrar pagamento' : 'Registrar recebimento'}
          </Button>
        )}
      </div>
    </div>
  )
}
