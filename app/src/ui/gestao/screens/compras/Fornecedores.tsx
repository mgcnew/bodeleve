import { useState } from 'react'
import { Box } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { normalize } from '@/domain/catalog'
import { purchasesStore, suppliersStore } from '@/services/gestao/backoffice'
import o from '@/styles/ops.module.css'
import { Bar, ListRow } from '../../../shared/OpsBits'
import { purchaseTag } from './shared'

export function SearchBox({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div
      role="search"
      style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 16px', borderRadius: 999, background: 'var(--superficie)', border: '1.5px solid var(--linha)', color: 'var(--texto-secundario)' }}
    >
      <Icon name="buscar" size={20} />
      <input
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: '1 1 0', minWidth: 0, border: 0, background: 'transparent', font: 'var(--corpo)', color: 'var(--texto)', outline: 'none' }}
      />
    </div>
  )
}

export function Fornecedores() {
  const suppliers = suppliersStore.useStore()
  const purchases = purchasesStore.useStore()
  const [q, setQ] = useState('')
  const visible = suppliers.filter((s) => normalize(`${s.name} ${s.categories}`).includes(normalize(q.trim())))

  const status = (id: string) => {
    const open = purchases.filter((p) => p.supplierId === id && (p.status === 'sent' || p.status === 'partially_received'))
    if (open.some((p) => purchaseTag(p).label === 'Chega hoje')) return '1 pedido chega hoje'
    if (open.length) return `${open.length} ${open.length === 1 ? 'pedido' : 'pedidos'} em aberto`
    const last = purchases.filter((p) => p.supplierId === id && p.receivedAt).sort((a, b) => (b.receivedAt ?? '').localeCompare(a.receivedAt ?? ''))[0]
    return last?.receivedAt ? `Última compra ${new Date(last.receivedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : 'Sem compras'
  }

  return (
    <div className={o.screen}>
      <Bar title="Fornecedores" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop}`}>
        <SearchBox label="Buscar fornecedor" value={q} onChange={setQ} />
        {suppliers.length === 0 ? (
          <EmptyState icon="entregas" title="Nenhum fornecedor cadastrado" text="Os fornecedores cadastrados aparecem aqui e podem receber pedidos de compra." />
        ) : visible.length === 0 ? (
          <EmptyState icon="buscar" title={`Nada encontrado para “${q}”`} text="Confira a escrita ou busque pelo que o fornecedor vende." />
        ) : (
          <Box>
            {visible.map((s) => (
              <ListRow
                key={s.id}
                title={s.name}
                sub={`${s.categories} · ${status(s.id)}`}
                to={`/gestao/fornecedores/${s.id}`}
              />
            ))}
          </Box>
        )}
        <p className={o.muted}>{suppliers.length} fornecedores ativos</p>
      </main>
    </div>
  )
}
