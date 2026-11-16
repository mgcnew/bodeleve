import { useState } from 'react'
import { AppLink, ButtonLink, Chip, EmptyState, Icon, ListSkeleton, StatusTag } from '@/components'
import { formatBRL, formatClock, formatDayMonth } from '@/lib/format'
import type { ProductionOrderView } from '@/services/types'
import { useProductionOrders, useRecipes } from '@/ui/gestao/queries'
import { QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import { KindBadge } from './KindBadge'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const dayOffset = (iso: string, now: Date) => {
  const d = new Date(iso)
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000)
}
const hour = (iso: string) => `${String(new Date(iso).getHours()).padStart(2, '0')}h`

/** "hoje 18h", "amanhã 10h" ou "18/11", como nos quadros. */
export function whenText(iso: string, now = new Date()): string {
  const off = dayOffset(iso, now)
  if (off === 0) return hour(iso)
  if (off === 1) return `amanhã ${hour(iso)}`
  return formatDayMonth(iso)
}

export function destinationText(o: Pick<ProductionOrderView, 'destination'>): string {
  return o.destination.kind === 'stock' ? 'Para estoque' : `Para pedido #${o.destination.orderId}`
}

export function orderLine(o: ProductionOrderView, now = new Date()): string {
  if (o.status === 'done') return `${o.id} · ${o.goodQty} de ${o.plannedQty} un · lote ${o.lotCode} · ${formatDayMonth(o.doneAt!)}`
  if (o.status === 'in_progress') {
    const started = o.startedAt ? `iniciada ${formatClock(o.startedAt).replace(/h00$/, 'h')}` : 'em andamento'
    return `${o.id} · ${o.plannedQty} un · ${started}${o.endsAt ? ` · termina ${whenText(o.endsAt, now)}` : ''}`
  }
  return `${o.id} · ${o.plannedQty} un · começa ${whenText(o.startsAt, now)}`
}

const tabs = [
  { key: 'in_progress', label: 'Em produção', tag: 'Em produção', tone: 'info' },
  { key: 'planned', label: 'Planejadas', tag: 'Planejada', tone: 'warning' },
  { key: 'done', label: 'Concluídas', tag: 'Concluída', tone: 'success' },
] as const

export function ProductionPage() {
  const query = useProductionOrders()
  const [picked, setPicked] = useState<(typeof tabs)[number]['key'] | null>(null)
  return (
    <>
      <ScreenHeader title="Produção" back="/gestao/mais" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <ButtonLink href="/gestao/producao/fichas"><Icon name="producao" size={20} /> Fichas técnicas e nova ordem</ButtonLink>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={4} label="Carregando ordens" />} errorTitle="Não foi possível carregar a produção">
          {(orders) => {
            const count = (k: string) => orders.filter((o) => o.status === k).length
            const active = picked ?? tabs.find((t) => count(t.key) > 0)?.key ?? 'in_progress'
            const info = tabs.find((t) => t.key === active)!
            const shown = orders.filter((o) => o.status === active).sort((a, b) => (active === 'done' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)))
            return (
              <>
                <div role="group" aria-label="Filtrar ordens" className={s.filters}>
                  {tabs.map((t) => <Chip key={t.key} selected={active === t.key} onClick={() => setPicked(t.key)}>{t.label} · {count(t.key)}</Chip>)}
                </div>
                {shown.length === 0 ? (
                  <EmptyState icon="producao" title="Nenhuma ordem aqui" description="Crie uma ordem a partir de uma ficha técnica." action={<ButtonLink href="/gestao/producao/fichas" variant="secondary">Ver fichas técnicas</ButtonLink>} />
                ) : (
                  <div className={l.stack} style={{ gap: 10 }}>
                    {shown.map((o) => (
                      <AppLink key={o.id} href={`/gestao/producao/ordens/${o.id}`} className={`${l.card} ${s.orderCard}`} style={{ gap: 4 }}>
                        <span className={l.spread}>
                          <span className={l.strong}>{o.itemName}</span>
                          <StatusTag tone={info.tone}>{info.tag}</StatusTag>
                        </span>
                        <span className={l.sub}>{orderLine(o)}</span>
                        <span className={l.small}>{destinationText(o)}</span>
                      </AppLink>
                    ))}
                  </div>
                )}
                <div className={l.sub}>Cada ordem diz para onde vai: <b>para estoque</b> (produção antecipada) ou <b>para um pedido</b> (sob demanda).</div>
              </>
            )
          }}
        </QueryBoundary>
      </main>
    </>
  )
}

export function RecipesPage() {
  const query = useRecipes()
  return (
    <>
      <ScreenHeader title="Fichas técnicas" back="/gestao/producao" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <div className={l.sub}>A ficha diz o que entra, quanto rende e quanto custa cada unidade. É dela que sai a ordem de produção.</div>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={4} label="Carregando fichas" />} errorTitle="Não foi possível carregar as fichas">
          {(list) => (
            <>
              <div className={l.linkList}>
                {list.map((r) => (
                  <AppLink key={r.id} href={`/gestao/producao/fichas/${r.id}`} className={l.linkRow} style={{ minHeight: 72, padding: '12px 0' }}>
                    <span className={l.grow} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className={l.optionTitle}>{r.name}</span>
                      <span><KindBadge itemType={r.itemType} origin={r.origin} /></span>
                      <span className={l.optionDetail}>{r.yieldPerBatch} un por {r.batchLabel}</span>
                    </span>
                    <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <span className={l.optionTitle}>{formatBRL(r.unitCostCents)}</span>
                      <span className={l.optionDetail}>custo / un{r.marginPercent != null ? ` · margem ${r.marginPercent}%` : ''}</span>
                    </span>
                    <Icon name="avancar" size={18} />
                  </AppLink>
                ))}
              </div>
              {list.length === 0 && <EmptyState icon="producao" title="Nenhuma ficha técnica" description="A ficha diz o que entra e quanto rende. Cadastre a primeira para criar ordens de produção." />}
              <ButtonLink href="/gestao/producao/fichas/nova" variant="secondary">Nova ficha técnica</ButtonLink>
              <div className={l.sub}>Produtos de revenda não têm ficha. A Rapadura da Linha Bodeleve é feita por parceiro (Engenho Boa Vista) e entra por compra.</div>
            </>
          )}
        </QueryBoundary>
      </main>
    </>
  )
}
