import { useState } from 'react'
import { Box } from '@/components/Card'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { TextField } from '@/components/Field'
import { establishmentStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import { ProductPhoto } from '@/ui/loja/components/ProductCard'

export function Casa() {
  const [form, setForm] = useState(establishmentStore.get())
  const [saved, setSaved] = useState(false)
  const set = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch })
    setSaved(false)
  }
  const hours = (k: keyof typeof form.hours, v: string) => set({ hours: { ...form.hours, [k]: v } })

  return (
    <div className={o.screen}>
      <Bar title="A casa" back="/gestao/configuracoes" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div role="img" aria-label="Espaço para o logotipo" style={{ flex: 'none', width: 72, height: 72, borderRadius: 16, background: 'var(--cor-creme)', border: '1px dashed var(--texto-secundario)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 12px var(--fonte-texto)', color: 'var(--texto-secundario)' }}>
            [LOGO]
          </div>
          <p className={o.muted}>Logotipo oficial ainda não aprovado. Até lá, a marca aparece só como texto.</p>
        </div>
        <TextField label="Nome" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        <TextField label="CNPJ" placeholder="[CNPJ]" value={form.cnpj} onChange={(e) => set({ cnpj: e.target.value })} />
        <TextField label="Endereço" placeholder="[ENDEREÇO DA LOJA]" value={form.address} onChange={(e) => set({ address: e.target.value })} />
        <TextField label="WhatsApp de atendimento" type="tel" placeholder="[WHATSAPP DA LOJA]" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} />
        <section className={o.section}>
          <b>Horário de funcionamento</b>
          <Box>
            {(
              [
                ['weekdays', 'Segunda a sexta'],
                ['saturday', 'Sábado'],
                ['sunday', 'Domingo'],
              ] as const
            ).map(([k, label]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--linha)' }}>
                <label htmlFor={`h-${k}`} style={{ flex: 'none', width: 120 }}>
                  {label}
                </label>
                <input
                  id={`h-${k}`}
                  value={form.hours[k]}
                  placeholder="[HORÁRIO]"
                  onChange={(e) => hours(k, e.target.value)}
                  style={{ flex: '1 1 0', minWidth: 0, height: 44, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)' }}
                />
              </div>
            ))}
          </Box>
        </section>
        {saved && <Banner tone="success">Dados da casa salvos.</Banner>}
        <p className="sr-only">
          <ProductPhoto label="[FOTO DA CASA]" />
        </p>
      </main>
      <div className={o.footer}>
        <Button
          size="l"
          block
          onClick={() => {
            establishmentStore.set(form)
            setSaved(true)
          }}
        >
          Salvar
        </Button>
      </div>
    </div>
  )
}
