import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppLink, ButtonLink, EmptyState, Icon, IndicatorSkeleton, ListSkeleton, SearchField } from '@/components'
import { paymentTerms } from '@/domain/purchasing'
import { formatBRL, formatDayMonth } from '@/lib/format'
import type { SupplierView } from '@/services/types'
import { useSupplier, useSuppliers } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function subtitle(f: SupplierView): string {
  const extra =
    f.arrivingToday > 0
      ? `${f.arrivingToday} ${f.arrivingToday === 1 ? 'pedido chega' : 'pedidos chegam'} hoje`
      : f.openOrders > 0
        ? `${f.openOrders} ${f.openOrders === 1 ? 'pedido em aberto' : 'pedidos em aberto'}`
        : f.lastPurchaseAt
          ? `Última compra ${formatDayMonth(f.lastPurchaseAt)}`
          : 'Sem compras ainda'
  return `${f.supplies} · ${extra}`
}

export function SuppliersPage() {
  const query = useSuppliers()
  const [q, setQ] = useState('')
  return (
    <>
      <ScreenHeader title="Fornecedores" back="/gestao/mais" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <SearchField label="Buscar fornecedor" placeholder="Buscar fornecedor" value={q} onChange={(e) => setQ(e.target.value)} />
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={4} label="Carregando fornecedores" />} errorTitle="Não foi possível carregar os fornecedores">
          {(list) => {
            const shown = list.filter((f) => !q.trim() || norm(f.name).includes(norm(q)) || norm(f.supplies).includes(norm(q)))
            return shown.length === 0 ? (
              <EmptyState icon="buscar" title={list.length === 0 ? 'Nenhum fornecedor cadastrado' : `Nada encontrado para “${q.trim()}”`} description={list.length === 0 ? 'Cadastre quem vende para a casa para fazer pedidos de compra.' : 'Confira a escrita.'} action={<ButtonLink href="/gestao/fornecedores/novo">Novo fornecedor</ButtonLink>} />
            ) : (
              <>
                <div className={l.linkList}>
                  {shown.map((f) => (
                    <AppLink key={f.id} href={`/gestao/fornecedores/${f.id}`} className={l.linkRow} style={{ minHeight: 64 }}>
                      <span className={s.disc} style={{ fontWeight: 700 }} aria-hidden="true">{f.name.charAt(0)}</span>
                      <span className={l.grow}>
                        <span className={l.optionTitle}>{f.name}</span>
                        <span className={l.optionDetail}>{subtitle(f)}</span>
                      </span>
                      <Icon name="avancar" size={18} />
                    </AppLink>
                  ))}
                </div>
                <div className={l.sub}>{list.length} {list.length === 1 ? 'fornecedor ativo' : 'fornecedores ativos'}</div>
                <ButtonLink href="/gestao/fornecedores/novo" variant="secondary">Novo fornecedor</ButtonLink>
              </>
            )
          }}
        </QueryBoundary>
      </main>
    </>
  )
}

export function SupplierPage() {
  const { id } = useParams()
  const query = useSupplier(id)
  return (
    <QueryBoundary query={query} skeleton={<><ScreenHeader title="Fornecedor" back="/gestao/fornecedores" /><main className={s.main}><IndicatorSkeleton label="Carregando fornecedor" /></main></>} errorTitle="Não foi possível carregar o fornecedor">
      {(f) =>
        !f ? (
          <>
            <ScreenHeader title="Fornecedor" back="/gestao/fornecedores" />
            <main className={s.main}><EmptyState icon="entregas" title="Fornecedor não encontrado" action={<ButtonLink href="/gestao/fornecedores">Ver fornecedores</ButtonLink>} /></main>
          </>
        ) : (
          <>
            <ScreenHeader title="Fornecedor" back="/gestao/fornecedores" />
            <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
              <div>
                <h1 className={l.h1} style={{ fontSize: 22 }}>{f.name}</h1>
                <div className={l.sub}>{f.supplies} · fornecedor desde {f.since}</div>
              </div>
              <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={l.strong}>Contato</div>
                <div className={l.sub}>{f.contactName} · {f.phone}<br />{f.email} · {f.doc}</div>
              </div>
              <section className={l.section} aria-labelledby="prod-t">
                <h2 id="prod-t" className={l.h2}>Produtos que fornece</h2>
                <div className={l.linkList}>
                  {f.products.map((p) => (
                    <div key={p.itemId} className={l.spread} style={{ padding: '12px 0', borderTop: '1px solid var(--linha)' }}>
                      <span>{p.name}</span>
                      <span className={`${l.sub} ${l.tabular}`}>{p.lastCostCents != null ? `último custo ${formatBRL(p.lastCostCents)}` : ''}</span>
                    </div>
                  ))}
                </div>
              </section>
              <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={l.sumRow}><span>Pagamento padrão</span><span style={{ color: 'var(--texto)' }}>{paymentTerms[f.defaultPayment].label.replace(' após receber', '')}</span></div>
                <div className={l.sumRow}><span>Prazo de entrega</span><span style={{ color: 'var(--texto)' }}>{f.leadTime}</span></div>
                <div className={l.sumRow}><span>Comprado em {new Date().getFullYear()}</span><span style={{ color: 'var(--texto)' }}>{formatBRL(f.purchasedThisYearCents)}</span></div>
                <div className={l.sumRow}><span>Contas em aberto</span><span style={{ color: 'var(--texto)' }}>{f.openPayablesCents > 0 ? formatBRL(f.openPayablesCents) : 'nenhuma'}</span></div>
              </div>
              <section className={l.section} aria-labelledby="ult-t">
                <h2 id="ult-t" className={l.h2}>Últimos pedidos</h2>
                {f.recentOrders.length === 0 ? (
                  <div className={l.sub}>Nenhum pedido recebido ainda.</div>
                ) : (
                  <div className={l.linkList}>
                    {f.recentOrders.map((o) => (
                      <AppLink key={o.id} href={`/gestao/compras/${o.id}`} className={l.linkRow}>
                        <span className={l.grow}>
                          <span className={l.optionTitle} style={{ fontWeight: 700 }}>{o.id}</span>
                          <span className={l.optionDetail}>Recebido {formatDayMonth(o.receivedAt)}</span>
                        </span>
                        <span className={l.price}>{formatBRL(o.totalCents)}</span>
                      </AppLink>
                    ))}
                  </div>
                )}
              </section>
            </main>
            <Footer>
              <ButtonLink href={`/gestao/fornecedores/${f.id}/editar`} variant="secondary" fullWidth>Editar fornecedor</ButtonLink>
              <ButtonLink href={`/gestao/compras/novo?fornecedor=${f.id}`} size="lg" fullWidth>Novo pedido para este fornecedor</ButtonLink>
            </Footer>
          </>
        )
      }
    </QueryBoundary>
  )
}
