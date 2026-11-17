import { useState } from 'react'
import { Banner } from '@/components/Feedback'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Field'
import { formatCents, parseCents } from '@/domain/money'
import { supabase } from '@/lib/supabase'
import { accountsStore, ledgerStore } from '@/services/gestao/backoffice'
import { accountBalance } from '@/services/gestao/finance'
import { financeErrorMessage, remoteSetOpeningBalance } from '@/services/gestao/financeRemote'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'

// Quanto há em cada conta no dia em que a casa começa a usar o sistema. O banco aceita uma vez por conta.
export function SaldoInicial() {
  const accounts = accountsStore.useStore()
  const ledger = ledgerStore.useStore()
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const next: Record<string, string> = {}
    const todo = accounts.filter((a) => (values[a.id] ?? '').trim() !== '')
    for (const a of todo) if (parseCents(values[a.id]) === null) next[a.id] = 'Digite um valor, por exemplo 1500,00.'
    setErrors(next)
    if (Object.keys(next).length || todo.length === 0) return
    setBusy(true)
    const ok: string[] = []
    const failed: Record<string, string> = {}
    for (const a of todo) {
      const cents = parseCents(values[a.id])!
      try {
        if (supabase) await remoteSetOpeningBalance(a.id, cents)
        else accountsStore.set((all) => all.map((x) => (x.id === a.id ? { ...x, openingCents: cents } : x)))
        ok.push(a.id)
      } catch (e) {
        failed[a.id] = financeErrorMessage(e)
      }
    }
    setErrors(failed)
    setDone(ok)
    setValues((v) => Object.fromEntries(Object.entries(v).filter(([id]) => !ok.includes(id))))
    setBusy(false)
  }

  return (
    <div className={o.screen}>
      <Bar title="Saldo inicial" back="/gestao/financeiro" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <p className={o.muted}>Informe quanto há em cada conta hoje, para o saldo e a previsão começarem certos. Cada conta aceita saldo inicial uma vez; depois disso, ajuste com um lançamento.</p>
        {accounts.map((a) => (
          <TextField
            key={a.id}
            label={`${a.name} (hoje ${formatCents(accountBalance(a, ledger))})`}
            inputMode="decimal"
            placeholder="0,00"
            value={values[a.id] ?? ''}
            error={errors[a.id]}
            onChange={(e) => {
              setValues({ ...values, [a.id]: e.target.value })
              setErrors({})
              setDone([])
            }}
          />
        ))}
        {done.length > 0 && <Banner tone="success">Saldo inicial registrado em {done.map((id) => accounts.find((a) => a.id === id)?.name).join(' e ')}.</Banner>}
      </main>
      <div className={o.footer}>
        <Button size="l" block disabled={busy} onClick={() => void save()}>
          Registrar saldo inicial
        </Button>
      </div>
    </div>
  )
}
