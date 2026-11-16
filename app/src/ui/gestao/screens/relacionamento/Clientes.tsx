import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { normalize } from '@/domain/catalog'
import { formatCents } from '@/domain/money'
import { customersStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import { SearchBox } from '../compras/Fornecedores'

export function Clientes() {
  const customers = customersStore.useStore()
  const [q, setQ] = useState('')
  const digits = q.replace(/\D/g, '')
  const visible = customers.filter((c) => normalize(c.name).includes(normalize(q.trim())) || (digits.length > 1 && c.phone.replace(/\D/g, '').includes(digits)))

  return (
    <div className={o.screen}>
      <Bar title="Clientes" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <SearchBox label="Nome ou celular" value={q} onChange={setQ} />
        {visible.length === 0 ? (
          <EmptyState icon="buscar" title={`Nada encontrado para “${q}”`} text="Confira a escrita ou busque pelo celular." />
        ) : (
          <Box>
            {visible.map((c) => (
              <Link key={c.id} to={`/gestao/clientes/${c.id}`} className={o.row}>
                <span aria-hidden="true" className={o.rowIcon} style={{ borderRadius: 999, background: 'var(--cor-creme)', fontWeight: 700 }}>
                  {c.name[0]}
                </span>
                <span className={o.rowText}>
                  <span className={o.rowTitle}>{c.name}</span>
                  <span className={o.small}>
                    {c.orderCount} {c.orderCount === 1 ? 'pedido' : 'pedidos'} · {c.lastOrderLabel}
                  </span>
                </span>
                <span className={o.rowEnd}>
                  <b>{formatCents(c.totalCents)}</b>
                  {c.fiadoCents > 0 ? <Tag tone="warning">Fiado {formatCents(c.fiadoCents)}</Tag> : c.orderCount === 1 ? <Tag tone="info">Novo</Tag> : null}
                </span>
                <Icon name="avancar" size={18} />
              </Link>
            ))}
          </Box>
        )}
        <p className={o.muted}>Valor ao lado = total comprado. Quem compra na loja sem conta entra aqui pelo celular informado.</p>
      </main>
    </div>
  )
}
