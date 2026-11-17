import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { SumRow } from '../../shared/OpsBits'
import { TextField } from '@/components/Field'
import { fullDate, longNow } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { sessionStore } from '@/services/gestao/session'
import { cashStore, openCash } from '@/services/pdv'
import { posErrorMessage } from '@/services/pdvRemote'
import { BigChip } from '../components/PdvBits'
import o from '@/styles/ops.module.css'
import s from './Pdv.module.css'

const floats = [10000, 15000, 20000]

export function Abertura() {
  const session = sessionStore.useStore()
  const { lastClose } = cashStore.useStore()
  const navigate = useNavigate()
  const [value, setValue] = useState(15000)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  return (
    <div className={o.screen}>
      <main className={`${o.main} ${o.narrow}`} style={{ paddingTop: 24 }}>
        <div>
          <h1 className={o.pageTitle}>Abrir caixa</h1>
          <p className={o.muted}>Balcão · {longNow().toLowerCase()}</p>
        </div>
        <div className={o.card}>
          <SumRow label="Quem abre" value={session?.name ?? '—'} />
          <SumRow
            label="Último fechamento"
            value={lastClose ? `${fullDate(lastClose.at).slice(0, 5)} · ${lastClose.diffCents === 0 ? 'sem diferença' : `${lastClose.diffCents > 0 ? 'sobra' : 'falta'} ${formatCents(Math.abs(lastClose.diffCents))}`}` : 'nenhum'}
          />
        </div>
        <TextField label="Dinheiro na gaveta para troco" readOnly value={formatCents(value)} />
        <div className={s.chipRow} role="group" aria-label="Valores comuns">
          {floats.map((v) => (
            <BigChip key={v} active={value === v} onClick={() => setValue(v)}>
              {formatCents(v).replace(',00', '')}
            </BigChip>
          ))}
        </div>
        <p className={o.muted}>Conte o dinheiro antes de abrir. Esse valor é a base para conferir o caixa no fechamento.</p>
      </main>
      <div className={o.footer}>
        {problem && <Banner tone="error">{problem}</Banner>}
        <Button
          size="l"
          block
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setProblem(undefined)
            try {
              await openCash(value)
              navigate('/pdv', { replace: true })
            } catch (e) {
              setProblem(posErrorMessage(e))
              setBusy(false)
            }
          }}
        >
          Abrir caixa
        </Button>
      </div>
    </div>
  )
}
