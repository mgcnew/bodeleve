import { useState } from 'react'
import { Tag } from '@/components/Badges'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { Sheet } from '@/components/Sheet'
import { normalize } from '@/domain/catalog'
import type { PosCustomer } from '@/domain/pdv'
import { customersStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'

/** Cliente da venda (opcional): quem tem prazo cadastrado libera a forma "A prazo" */
export function CustomerPicker({ value, onChange }: { value: PosCustomer | null | undefined; onChange: (c: PosCustomer | null) => void }) {
  const customers = customersStore.useStore()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const term = normalize(q.trim())
  const digits = q.replace(/\D/g, '')
  const list = customers
    .filter((c) => !term || normalize(c.name).includes(term) || (digits.length > 1 && c.phone.replace(/\D/g, '').includes(digits)))
    .slice(0, 30)

  const choose = (c: PosCustomer | null) => {
    onChange(c)
    setOpen(false)
    setQ('')
  }

  return (
    <>
      <button type="button" className={o.card} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', width: '100%' }} onClick={() => setOpen(true)}>
        <Icon name="perfil" size={22} />
        <span style={{ flex: '1 1 0', minWidth: 0 }}>
          <span className={o.bold} style={{ display: 'block' }}>
            {value ? value.name : 'Cliente (opcional)'}
          </span>
          <span className={o.small}>{value ? (value.creditDays ? `Prazo de ${value.creditDays} dias` : 'Sem prazo cadastrado') : 'Escolha para vender a prazo'}</span>
        </span>
        <Icon name="avancar" size={18} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Cliente da venda">
        <TextField label="Buscar por nome ou celular" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '40vh', overflowY: 'auto' }}>
          {list.map((c) => (
            <button
              key={c.id}
              type="button"
              className={o.row}
              style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--linha)', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', width: '100%' }}
              onClick={() => choose({ id: c.id, name: c.name, creditDays: c.creditDays })}
            >
              <span className={o.rowText}>
                <span className={o.rowTitle}>{c.name}</span>
                <span className={o.small}>{c.phone}</span>
              </span>
              {c.creditDays ? <Tag tone="info">Prazo {c.creditDays} dias</Tag> : <span className={o.small}>sem prazo</span>}
            </button>
          ))}
          {list.length === 0 && <p className={o.muted}>Nenhum cliente encontrado. Cadastre em Gestão, Clientes.</p>}
        </div>
        {value && (
          <Button variant="secondary" block onClick={() => choose(null)}>
            Tirar o cliente da venda
          </Button>
        )}
      </Sheet>
    </>
  )
}
