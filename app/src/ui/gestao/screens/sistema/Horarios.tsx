import { useState } from 'react'
import { Box } from '@/components/Card'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { supabase } from '@/lib/supabase'
import { establishmentStore } from '@/services/gestao/people'
import { remoteSaveEstablishment, teamErrorMessage } from '@/services/gestao/peopleRemote'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'

const days = [
  ['weekdays', 'Segunda a sexta'],
  ['saturday', 'Sábado'],
  ['sunday', 'Domingo'],
] as const

/** Horário de funcionamento: aparece para o cliente na loja e na confirmação do pedido */
export function Horarios() {
  const stored = establishmentStore.useStore()
  const [draft, setDraft] = useState<typeof stored.hours | null>(null)
  const hours = draft ?? stored.hours
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()

  const save = async () => {
    setBusy(true)
    setProblem(undefined)
    try {
      const next = { ...stored, hours }
      if (supabase) await remoteSaveEstablishment(next)
      else establishmentStore.set(next)
      setDraft(null)
      setSaved(true)
    } catch (e) {
      setProblem(teamErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={o.screen}>
      <Bar title="Horário de funcionamento" back="/gestao/configuracoes" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <p className={o.muted}>Escreva como o cliente deve ler, por exemplo “8h às 18h” ou “Fechado”.</p>
        <Box>
          {days.map(([k, label]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--linha)' }}>
              <label htmlFor={`h-${k}`} style={{ flex: 'none', width: 130, fontWeight: 600 }}>
                {label}
              </label>
              <input
                id={`h-${k}`}
                value={hours[k]}
                placeholder="[HORÁRIO]"
                onChange={(e) => {
                  setDraft({ ...hours, [k]: e.target.value })
                  setSaved(false)
                }}
                style={{ flex: '1 1 0', minWidth: 0, height: 44, padding: '0 12px', borderRadius: 'var(--raio-campo)', border: '1px solid var(--linha-forte)', background: 'var(--superficie)', font: 'var(--corpo)' }}
              />
            </div>
          ))}
        </Box>
        {saved && <Banner tone="success">Horário salvo.</Banner>}
        {problem && <Banner tone="error">{problem}</Banner>}
      </main>
      <div className={o.footer}>
        <Button size="l" block disabled={busy || draft === null} onClick={() => void save()}>
          Salvar horário
        </Button>
      </div>
    </div>
  )
}
