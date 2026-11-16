import { useEffect, useId, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppLink, ButtonLink, EmptyState, Icon, IndicatorSkeleton, ListSkeleton, SearchField, StatusTag } from '@/components'
import type { CustomerDetail } from '@/domain/customers'
import { orderPlural } from '@/domain/customers'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import { useCustomer, useCustomers, useInvalidateCatalog } from '@/ui/gestao/queries'
import { QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

export function CustomersPage() {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 150)
    return () => clearTimeout(t)
  }, [q])
  const query = useCustomers(debounced)
  return (
    <>
      <ScreenHeader title="Clientes" back="/gestao/mais" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <SearchField label="Nome ou celular" placeholder="Nome ou celular" value={q} onChange={(e) => setQ(e.target.value)} />
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} label="Carregando clientes" />} errorTitle="Não foi possível carregar os clientes">
          {(rows) =>
            rows.length === 0 ? (
              <EmptyState icon="buscar" title={`Nenhum cliente para “${debounced.trim()}”`} description="Confira o nome ou o número do celular." />
            ) : (
              <div className={l.linkList}>
                {rows.map((c) => (
                  <AppLink key={c.id} href={`/gestao/clientes/${c.id}`} className={l.linkRow} style={{ minHeight: 72 }}>
                    <span className={s.disc} style={{ fontWeight: 700 }} aria-hidden="true">{c.initial}</span>
                    <span className={l.grow}>
                      <span className={l.optionTitle}>{c.name}</span>
                      <span className={l.optionDetail}>{c.detail}</span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(c.spentCents)}</span>
                      {c.tag && <StatusTag tone={c.tag.tone}>{c.tag.label}</StatusTag>}
                    </span>
                    <Icon name="avancar" size={18} />
                  </AppLink>
                ))}
              </div>
            )
          }
        </QueryBoundary>
        <div className={l.sub}>Valor ao lado = total comprado. Quem compra na loja sem conta entra aqui pelo celular informado.</div>
      </main>
    </>
  )
}

const h2 = { font: '700 17px/24px var(--fonte-titulo)', margin: 0 } as const
const tone = { info: 'info', success: 'success', neutral: 'neutral' } as const

function Notes({ detail, id }: { detail: CustomerDetail; id: string }) {
  const { admin } = useServices()
  const invalidate = useInvalidateCatalog()
  const [text, setText] = useState(detail.notes)
  const [saved, setSaved] = useState(false)
  const [failed, setFailed] = useState(false)
  const fieldId = useId()
  const save = async () => {
    if (text === detail.notes && !saved) return
    setFailed(false)
    try {
      await admin.customers.saveNotes(id, text)
      await invalidate()
      setSaved(true)
    } catch {
      setFailed(true)
    }
  }
  return (
    <div className={l.stack} style={{ gap: 6 }}>
      <label htmlFor={fieldId} style={{ fontWeight: 600 }}>Observações internas</label>
      <textarea
        id={fieldId}
        rows={2}
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false) }}
        onBlur={save}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)', color: 'var(--texto)' }}
      />
      <div role="status" aria-live="polite" className={l.sub}>
        {saved && 'Observação salva.'}
        {failed && 'Não foi possível salvar a observação. Tente de novo.'}
      </div>
    </div>
  )
}

export function CustomerPage() {
  const { id } = useParams()
  const query = useCustomer(id)
  return (
    <>
      <ScreenHeader title="Cliente" back="/gestao/clientes" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando cliente" />} errorTitle="Não foi possível carregar o cliente">
          {(d) =>
            !d ? (
              <EmptyState icon="perfil" title="Cliente não encontrado" action={<ButtonLink href="/gestao/clientes">Ver clientes</ButtonLink>} />
            ) : (
              <>
                <div className={l.stack} style={{ gap: 4 }}>
                  <h1 className={l.h1}>{d.summary.name}</h1>
                  <div className={l.sub}>{d.since ? `Cliente desde ${d.since} · ` : ''}{d.channel}</div>
                  {d.summary.tag && <div><StatusTag tone={d.summary.tag.tone}>{d.summary.tag.label}</StatusTag></div>}
                </div>
                <div className={s.todayGrid} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                  <div className={l.sub}>Pedidos<div style={{ font: 'var(--corpo)', fontWeight: 700, color: 'var(--texto)' }}>{d.summary.orders || '—'}</div></div>
                  <div className={l.sub}>Total<div style={{ font: 'var(--corpo)', fontWeight: 700, color: 'var(--texto)' }}>{formatBRL(d.summary.spentCents)}</div></div>
                  <div className={l.sub}>Ticket médio<div style={{ font: 'var(--corpo)', fontWeight: 700, color: 'var(--texto)' }}>{d.ticketCents == null ? '—' : formatBRL(d.ticketCents)}</div></div>
                </div>
                <div className={l.stack} style={{ gap: 2 }}>
                  <h2 style={h2}>Contato</h2>
                  <div>{d.phone} · WhatsApp</div>
                  {d.address && <div className={l.sub}>{d.address}</div>}
                </div>
                {d.topProducts.length > 0 && (
                  <section aria-labelledby="mais-compra" className={l.stack} style={{ gap: 6 }}>
                    <h2 id="mais-compra" style={h2}>Mais compra</h2>
                    {d.topProducts.map((p) => <div key={p.productId}>{p.name} · {p.times}×</div>)}
                  </section>
                )}
                <section aria-labelledby="pedidos-cliente" className={l.stack} style={{ gap: 8 }}>
                  <h2 id="pedidos-cliente" style={h2}>Pedidos</h2>
                  {d.orders.length === 0 ? (
                    <div className={l.sub}>Sem pedidos registrados neste sistema{d.summary.orders ? ` (${orderPlural(d.summary.orders)} antes dele)` : ''}.</div>
                  ) : (
                    <div className={l.linkList}>
                      {d.orders.map((o) => (
                        <AppLink key={o.id} href={`/gestao/pedidos/${o.id}`} className={l.linkRow} style={{ minHeight: 64 }}>
                          <span className={l.grow}>
                            <span className={l.optionTitle}>#{o.id} · {o.when}</span>
                            <span className={l.optionDetail}>{o.kind} · {o.items} {o.items === 1 ? 'item' : 'itens'}</span>
                          </span>
                          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(o.totalCents)}</span>
                            <StatusTag tone={tone[o.tone]}>{o.status}</StatusTag>
                          </span>
                          <Icon name="avancar" size={18} />
                        </AppLink>
                      ))}
                    </div>
                  )}
                </section>
                <Notes key={d.summary.id} detail={d} id={d.summary.id} />
                <div className={l.sub}>Dados pessoais só para atender e entregar. Quem comprou pode pedir para apagar a conta.</div>
              </>
            )
          }
        </QueryBoundary>
      </main>
    </>
  )
}
