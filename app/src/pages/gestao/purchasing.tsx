import { useState } from 'react'
import { AppLink, ButtonLink, Chip, EmptyState, Icon, ListSkeleton, StatusTag } from '@/components'
import { itemsLabel } from '@/domain/bag'
import { daysUntil } from '@/domain/inventory'
import { isOpen } from '@/domain/purchasing'
import { formatBRL, formatDayMonth } from '@/lib/format'
import type { PurchaseView } from '@/services/types'
import { usePurchases } from '@/ui/gestao/queries'
import { QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

type Tone = 'info' | 'success' | 'warning'

/** Etiqueta e linha de apoio de cada pedido de compra, como no quadro Compras. */
export function purchaseLabel(o: PurchaseView, now = new Date()): { tag: string; tone: Tone; line: string } {
  const items = itemsLabel(o.itemCount)
  if (o.status === 'received') {
    const missing = o.items.filter((i) => i.receivedQty < i.qty).length
    return o.closedShort
      ? { tag: 'Recebido parcial', tone: 'warning', line: `${o.id} · Recebido ${formatDayMonth(o.receivedAt!)} · faltou ${missing} ${missing === 1 ? 'item' : 'itens'}` }
      : { tag: 'Recebido', tone: 'success', line: `${o.id} · Recebido ${formatDayMonth(o.receivedAt!)} · ${items}` }
  }
  if (o.status === 'partially_received') return { tag: 'Recebido parcial', tone: 'warning', line: `${o.id} · falta chegar o restante · ${items}` }
  if (o.status === 'cancelled') return { tag: 'Cancelado', tone: 'warning', line: `${o.id} · ${items}` }
  const today = daysUntil(o.expectedAt, now) <= 0
  return today
    ? { tag: 'Chega hoje', tone: 'success', line: `${o.id} · Chega hoje · ${items}` }
    : { tag: 'Enviado', tone: 'info', line: `${o.id} · Chega ${formatDayMonth(o.expectedAt)} · ${items}` }
}

export function PurchasesPage() {
  const query = usePurchases()
  const [tab, setTab] = useState<'open' | 'done'>('open')
  return (
    <>
      <ScreenHeader title="Compras" back="/gestao/mais" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <ButtonLink href="/gestao/compras/novo"><Icon name="adicionar" size={20} /> Novo pedido de compra</ButtonLink>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={4} label="Carregando compras" />} errorTitle="Não foi possível carregar as compras">
          {(all) => {
            const open = all.filter((o) => isOpen(o)).sort((a, b) => a.expectedAt.localeCompare(b.expectedAt))
            const done = all.filter((o) => !isOpen(o)).sort((a, b) => (b.receivedAt ?? '').localeCompare(a.receivedAt ?? ''))
            const shown = tab === 'open' ? open : done
            return (
              <>
                <div role="group" aria-label="Filtrar pedidos de compra" className={s.filters}>
                  <Chip selected={tab === 'open'} onClick={() => setTab('open')}>Em aberto · {open.length}</Chip>
                  <Chip selected={tab === 'done'} onClick={() => setTab('done')}>Recebidos · {done.length}</Chip>
                </div>
                {shown.length === 0 ? (
                  <EmptyState icon="compras" title={tab === 'open' ? 'Nenhum pedido em aberto' : 'Nada recebido ainda'} description="Crie um pedido de compra para repor o estoque." action={<ButtonLink href="/gestao/compras/novo" variant="secondary">Novo pedido de compra</ButtonLink>} />
                ) : (
                  <div className={l.stack} style={{ gap: 10 }}>
                    {shown.map((o) => {
                      const t = purchaseLabel(o)
                      return (
                        <AppLink key={o.id} href={`/gestao/compras/${o.id}`} className={`${l.card} ${s.orderCard}`}>
                          <span className={l.spread}>
                            <span className={l.strong}>{o.supplierName}</span>
                            <StatusTag tone={t.tone}>{t.tag}</StatusTag>
                          </span>
                          <span className={`${l.spread} ${l.sub}`}>
                            <span>{t.line}</span>
                            <b className={l.tabular} style={{ color: 'var(--texto)' }}>{formatBRL(o.status === 'received' ? o.receivedCents : o.totalCents)}</b>
                          </span>
                        </AppLink>
                      )
                    })}
                  </div>
                )}
                <AppLink href="/gestao/fornecedores" className={l.link}>Ver fornecedores <Icon name="avancar" size={18} /></AppLink>
              </>
            )
          }}
        </QueryBoundary>
      </main>
    </>
  )
}
