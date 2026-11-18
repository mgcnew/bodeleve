import { useState } from 'react'
import { Button, ButtonLink } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { SelectField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/components/QuantityStepper'
import { Sheet } from '@/components/Sheet'
import { formatCents } from '@/domain/money'
import { payGroup } from '@/domain/pdv'
import { addCashMovement, cashSales, cashStore, closeCash, expectedCash, reopenCash, salesStore, supplyReasons, withdrawalReasons } from '@/services/pdv'
import { posErrorMessage } from '@/services/pdvRemote'
import { SumRow } from '../../shared/OpsBits'
import { CashHeader } from '../PdvShell'
import { BigChip } from '../components/PdvBits'
import o from '@/styles/ops.module.css'
import s from './Pdv.module.css'

const values = [5000, 10000, 20000]

// H-P7 — um caixa por aparelho: abertura com fundo de troco, sangria e suprimento com motivo, fechamento com contado × esperado
export function Caixa() {
  const { session } = cashStore.useStore()
  const sales = salesStore.useStore()
  const [sheet, setSheet] = useState(false)
  const [kind, setKind] = useState<'withdrawal' | 'supply'>('withdrawal')
  const [value, setValue] = useState(10000)
  const [reason, setReason] = useState(withdrawalReasons[0])
  const [counted, setCounted] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  const attempt = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setProblem(undefined)
    try {
      await fn()
      return true
    } catch (e) {
      setProblem(posErrorMessage(e))
      return false
    } finally {
      setBusy(false)
    }
  }

  const open = !!session && !session.closedAt
  const mine = session ? sales.filter((x) => x.status === 'done' && x.at >= session.openedAt) : []
  const by = (g: 'cash' | 'pix' | 'card') => mine.flatMap((x) => x.payments).filter((p) => payGroup(p.method) === g).reduce((n, p) => n + p.cents, 0)
  const expected = session ? expectedCash(session, sales) : 0
  const count = counted ?? Math.round(expected / 100)
  const diff = count * 100 - expected

  const changeKind = (k: typeof kind) => {
    setKind(k)
    setReason((k === 'withdrawal' ? withdrawalReasons : supplyReasons)[0])
  }

  return (
    <div className={o.screen}>
      <CashHeader />
      {open && session ? (
        <main className={`${o.main} ${o.narrow}`} style={{ gap: 16 }}>
          <h1 className={o.h1}>Caixa de hoje</h1>
          <div className={o.card}>
            <b>Vendas no balcão · {mine.length}</b>
            <SumRow label="Dinheiro" value={formatCents(by('cash'))} />
            <SumRow label="Pix" value={formatCents(by('pix'))} />
            <SumRow label="Cartão" value={formatCents(by('card'))} />
            <div className={`${o.sumTotal} ${o.num}`}>
              <span>Total</span>
              <span>{formatCents(by('cash') + by('pix') + by('card'))}</span>
            </div>
          </div>
          <section className={o.card}>
            <b>Dinheiro na gaveta</b>
            <SumRow label="Abertura (troco)" value={formatCents(session.floatCents)} />
            <SumRow label="Vendas em dinheiro" value={`+ ${formatCents(cashSales(session, sales))}`} />
            {session.movements.map((m) => (
              <SumRow key={m.id} label={`${m.kind === 'withdrawal' ? 'Sangria' : 'Suprimento'} · ${m.reason}`} value={`${m.kind === 'withdrawal' ? '−' : '+'} ${formatCents(m.cents)}`} />
            ))}
            <div className={`${o.sumTotal} ${o.num}`}>
              <span>Esperado</span>
              <span>{formatCents(expected)}</span>
            </div>
          </section>
          <Button variant="secondary" block style={{ maxWidth: 420 }} onClick={() => setSheet(true)}>
            Sangria ou suprimento
          </Button>
          <section className={o.card} style={{ gap: 12 }}>
            <b>Fechar caixa</b>
            <div className={o.cardHead}>
              <span>
                <b id="contado">Contado na gaveta</b>
                <span className={o.small} style={{ display: 'block' }}>
                  Conte as notas e moedas
                </span>
              </span>
              <QuantityStepper labelledBy="contado" value={count} onChange={(v) => setCounted(v)} />
            </div>
            <div className={`${o.cardHead} ${o.num}`} style={{ fontWeight: 600, color: diff === 0 ? 'var(--sucesso)' : 'var(--atencao)' }}>
              <span>Diferença</span>
              <span>{diff === 0 ? 'zero' : `${diff > 0 ? 'sobra de' : 'falta de'} ${formatCents(Math.abs(diff))}`}</span>
            </div>
            {problem && <Banner tone="error">{problem}</Banner>}
            <Button size="l" block disabled={busy} onClick={() => void attempt(() => closeCash(count * 100))}>
              Fechar caixa
            </Button>
          </section>
        </main>
      ) : (
        <main className={`${o.main} ${o.narrow}`} style={{ alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
          <div aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria-sobre-suave)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="caixa" size={32} />
          </div>
          <h1 className={o.h1}>Caixa fechado</h1>
          {session?.closedAt && session.countedCents !== null && session.expectedCents !== null && (
            <p className={`${o.secondary} ${o.num}`}>
              {`Esperado ${formatCents(session.expectedCents)} · contado ${formatCents(session.countedCents)} · diferença ${session.countedCents === session.expectedCents ? 'zero' : `${session.countedCents > session.expectedCents ? 'sobra de' : 'falta de'} ${formatCents(Math.abs(session.countedCents - session.expectedCents))}`}. O gestor vê o fechamento no relatório.`}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 420 }}>
            <ButtonLink to="/pdv/abertura" size="l" block>
              Abrir novo caixa
            </ButtonLink>
            {session?.closedAt && (
              <Button variant="secondary" block disabled={busy} onClick={() => void attempt(reopenCash)}>
                Reabrir (corrigir)
              </Button>
            )}
          </div>
        </main>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Movimentar dinheiro">
        <div className={s.chipRow} role="group" aria-label="Tipo">
          <BigChip active={kind === 'withdrawal'} onClick={() => changeKind('withdrawal')}>
            Retirar (sangria)
          </BigChip>
          <BigChip active={kind === 'supply'} onClick={() => changeKind('supply')}>
            Colocar (suprimento)
          </BigChip>
        </div>
        <div className={s.chipRow} role="group" aria-label="Valor">
          {values.map((v) => (
            <BigChip key={v} active={value === v} onClick={() => setValue(v)}>
              {formatCents(v).replace(',00', '')}
            </BigChip>
          ))}
        </div>
        <SelectField label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} options={(kind === 'withdrawal' ? withdrawalReasons : supplyReasons).map((r) => ({ value: r, label: r }))} />
        {problem && <Banner tone="error">{problem}</Banner>}
        <Button
          size="l"
          block
          disabled={busy}
          onClick={async () => {
            if (await attempt(() => addCashMovement(kind, value, reason))) setSheet(false)
          }}
        >
          Registrar
        </Button>
        <Button variant="secondary" block onClick={() => setSheet(false)}>
          Cancelar
        </Button>
      </Sheet>
    </div>
  )
}
