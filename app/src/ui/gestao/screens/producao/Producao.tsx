import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag, type Tone } from '@/components/Badges'
import { ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { Icon } from '@/components/Icon'
import type { ProductionOrder, ProductionStatus } from '@/domain/backoffice'
import { daysUntil, hourMinute, shortDate } from '@/domain/dates'
import { itemsStore, productionStore } from '@/services/gestao/backoffice'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'

type Tab = 'in_progress' | 'planned' | 'done'

const tags: Record<ProductionStatus, { label: string; tone: Tone | 'neutral' }> = {
  in_progress: { label: 'Em produção', tone: 'info' },
  planned: { label: 'Planejada', tone: 'neutral' },
  done: { label: 'Concluída', tone: 'success' },
  cancelled: { label: 'Cancelada', tone: 'error' },
}

function whenText(op: ProductionOrder) {
  const day = (iso: string) => {
    const d = daysUntil(iso)
    return d === 0 ? 'hoje' : d === 1 ? 'amanhã' : shortDate(iso)
  }
  if (op.status === 'done') return `${op.goodQty} de ${op.plannedQty} un${op.lotCode ? ` · lote ${op.lotCode}` : ''} · ${shortDate(op.endAt)}`
  if (op.status === 'planned') return `${op.plannedQty} un · começa ${day(op.startAt)} ${hourMinute(op.startAt)}`
  return `${op.plannedQty} un · iniciada ${hourMinute(op.startAt)} · termina ${day(op.endAt)} ${hourMinute(op.endAt)}`
}

export function Producao() {
  const orders = productionStore.useStore()
  const items = itemsStore.useStore()
  const [tab, setTab] = useState<Tab>('in_progress')
  const count = (s: Tab) => orders.filter((p) => p.status === s).length
  const visible = orders.filter((p) => p.status === tab).sort((a, b) => (tab === 'done' ? b.endAt.localeCompare(a.endAt) : a.startAt.localeCompare(b.startAt)))

  return (
    <div className={o.screen}>
      <Bar title="Produção" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop}`}>
        <ButtonLink to="/gestao/producao/fichas" block style={{ maxWidth: 420 }}>
          <Icon name="producao" size={20} />
          Fichas técnicas e nova ordem
        </ButtonLink>
        <FilterChips
          label="Filtrar ordens"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'in_progress', label: `Em produção · ${count('in_progress')}` },
            { value: 'planned', label: `Planejadas · ${count('planned')}` },
            { value: 'done', label: `Concluídas · ${count('done')}` },
          ]}
        />
        {visible.length === 0 ? (
          <EmptyState icon="producao" title="Nenhuma ordem aqui" text="Crie uma ordem a partir de uma ficha técnica." />
        ) : (
          <div className={o.list}>
            {visible.map((op) => {
              const t = tags[op.status]
              const forOrder = op.destination.kind === 'order'
              return (
                <Link key={op.id} to={`/gestao/producao/ordens/${op.id}`} className={o.card} style={{ gap: 4 }}>
                  <span className={o.cardHead}>
                    <span style={{ fontWeight: 600, fontSize: 17 }}>{items.find((i) => i.id === op.productId)?.name}</span>
                    {t.tone === 'neutral' ? (
                      <span style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--cor-tinta)', color: 'var(--fundo-suave)', font: '600 13px/18px var(--fonte-texto)' }}>{t.label}</span>
                    ) : (
                      <Tag tone={t.tone}>{t.label}</Tag>
                    )}
                  </span>
                  <span className={`${o.muted} ${o.num}`}>
                    {op.number} · {whenText(op)}
                  </span>
                  <span style={{ font: '600 12px/16px var(--fonte-texto)', color: forOrder ? 'var(--cor-primaria-pressionado)' : 'var(--texto-secundario)' }}>
                    {op.destination.kind === 'order' ? `Para pedido #${op.destination.orderNumber}` : 'Para estoque'}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
        {/* H-G15 — produção antecipada e sob demanda convivem */}
        <p className={o.muted}>
          Cada ordem diz para onde vai: <b>para estoque</b> (produção antecipada) ou <b>para um pedido</b> (sob demanda).
        </p>
      </main>
    </div>
  )
}
