import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { purchaseTotal } from '@/domain/backoffice'
import { formatCents } from '@/domain/money'
import { purchasesStore, suppliersStore } from '@/services/gestao/backoffice'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import { isOpen, purchaseLine, purchaseTag } from './shared'

type Tab = 'open' | 'received'

export function Compras() {
  const purchases = purchasesStore.useStore()
  const suppliers = suppliersStore.useStore()
  const [tab, setTab] = useState<Tab>('open')
  const open = purchases.filter(isOpen).sort((a, b) => a.expectedAt.localeCompare(b.expectedAt))
  const done = purchases.filter((p) => !isOpen(p)).sort((a, b) => (b.receivedAt ?? '').localeCompare(a.receivedAt ?? ''))
  const visible = tab === 'open' ? open : done

  return (
    <div className={o.screen}>
      <Bar title="Compras" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop}`}>
        <ButtonLink to="/gestao/compras/nova" block style={{ maxWidth: 420 }}>
          <Icon name="adicionar" size={20} />
          Novo pedido de compra
        </ButtonLink>
        <FilterChips
          label="Filtrar pedidos de compra"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'open', label: `Em aberto · ${open.length}` },
            { value: 'received', label: `Recebidos · ${done.length}` },
          ]}
        />
        {visible.length === 0 ? (
          <EmptyState
            icon="compras"
            title={tab === 'open' ? 'Nenhum pedido em aberto' : 'Nenhum recebimento ainda'}
            text={tab === 'open' ? 'Os pedidos enviados aos fornecedores aparecem aqui até chegarem.' : 'As compras recebidas aparecem aqui.'}
          />
        ) : (
          <div className={o.list}>
            {visible.map((p) => {
              const tag = purchaseTag(p)
              return (
                <Link key={p.id} to={`/gestao/compras/${p.id}`} className={o.card}>
                  <span className={o.cardHead}>
                    <span style={{ fontWeight: 600, fontSize: 17 }}>{suppliers.find((s) => s.id === p.supplierId)?.name}</span>
                    <Tag tone={tag.tone}>{tag.label}</Tag>
                  </span>
                  <span className={`${o.cardHead} ${o.num}`} style={{ font: 'var(--apoio)' }}>
                    <span className={o.secondary}>
                      {p.number} · {purchaseLine(p)}
                    </span>
                    <b>{formatCents(purchaseTotal(p, p.status === 'sent' ? 'qty' : 'receivedQty'))}</b>
                  </span>
                </Link>
              )
            })}
          </div>
        )}
        <Link to="/gestao/fornecedores" className={o.linkInline}>
          Ver fornecedores
          <Icon name="avancar" size={18} />
        </Link>
      </main>
    </div>
  )
}
