import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppLink, Banner, Button, ButtonLink, Chip, EmptyState, Icon, IndicatorSkeleton, ListSkeleton, StatusTag } from '@/components'
import type { AssignOption, Tab } from '@/domain/deliveries'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import type { AssignView } from '@/services/types'
import { useAssignView, useDeliveries, useInvalidateDeliveries } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'out', label: 'Para sair' },
  { key: 'route', label: 'Em rota' },
  { key: 'done', label: 'Entregues' },
]

export function DeliveriesPage() {
  const query = useDeliveries()
  const [tab, setTab] = useState<Tab>('out')
  return (
    <>
      <ScreenHeader title="Entregas" back="/gestao/mais" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={4} label="Carregando entregas" />} errorTitle="Não foi possível carregar as entregas">
          {(d) => {
            const shown = d.rows.filter((r) => r.tab === tab)
            return (
              <>
                <div role="group" aria-label="Situação da entrega" className={s.filters}>
                  {tabs.map((t) => (
                    <Chip key={t.key} selected={tab === t.key} onClick={() => setTab(t.key)}>{t.label} · {d.rows.filter((r) => r.tab === t.key).length}</Chip>
                  ))}
                </div>
                {shown.length === 0 ? (
                  <EmptyState icon="entregas" title={tab === 'out' ? 'Nenhuma entrega para sair' : tab === 'route' ? 'Nada em rota agora' : 'Nenhuma entrega concluída hoje'} description="Os pedidos com entrega aparecem aqui conforme ficam prontos." />
                ) : (
                  <div className={l.linkList}>
                    {shown.map((r) => {
                      const body = (
                        <>
                          <span className={l.grow}>
                            <span className={l.optionTitle}>#{r.orderId} · {r.customer}</span>
                            <span className={l.optionDetail}>{r.detail}</span>
                          </span>
                          <StatusTag tone={r.tone}>{r.label}</StatusTag>
                          {r.href && <Icon name="avancar" size={18} />}
                        </>
                      )
                      return r.href ? (
                        <AppLink key={r.orderId} href={r.href} className={l.linkRow} style={{ minHeight: 72 }}>{body}</AppLink>
                      ) : (
                        <div key={r.orderId} className={s.plainRow} style={{ minHeight: 72 }}>{body}</div>
                      )
                    })}
                  </div>
                )}
                <section aria-labelledby="entregadores" className={l.stack} style={{ gap: 8 }}>
                  <h2 id="entregadores" style={{ font: '700 17px/24px var(--fonte-titulo)', margin: 0 }}>Entregadores</h2>
                  <div className={l.linkList}>
                    {d.couriers.map((c) => (
                      <div key={c.id} className={s.plainRow} style={{ minHeight: 64 }}>
                        <span className={s.disc} style={{ fontWeight: 700 }} aria-hidden="true">{c.initial}</span>
                        <span className={l.grow}>
                          <span className={l.optionTitle}>{c.name}</span>
                          <span className={l.optionDetail}>{c.detail}</span>
                        </span>
                        <StatusTag tone={c.tag.tone}>{c.tag.label}</StatusTag>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )
          }}
        </QueryBoundary>
      </main>
    </>
  )
}

function OptionCard({ option, selected, onSelect }: { option: AssignOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 72, padding: '12px 16px', textAlign: 'left', borderRadius: 12, border: selected ? '2px solid var(--texto)' : '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)', color: 'var(--texto)', cursor: 'pointer' }}
    >
      <span className={l.grow}>
        <span className={l.optionTitle}>{option.title}</span>
        <span className={l.optionDetail}>{option.detail}</span>
      </span>
      {option.tag && <StatusTag tone={option.tag.tone}>{option.tag.label}</StatusTag>}
      {option.priceCents != null && <span style={{ fontWeight: 600 }}>{formatBRL(option.priceCents)}</span>}
    </button>
  )
}

function AssignBody({ view }: { view: AssignView }) {
  const { admin } = useServices()
  const invalidate = useInvalidateDeliveries()
  const [chosen, setChosen] = useState(view.options[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const option = view.options.find((o) => o.id === chosen) ?? view.options[0]

  const send = async () => {
    setBusy(true)
    setError(null)
    try {
      await admin.deliveries.assign(view.orderId, option.id)
      await invalidate()
    } catch (e) {
      setError((e as Error).message === 'not_ready' ? 'O pedido ainda não está pronto. Marque como pronto em Pedidos.' : 'Não foi possível enviar. Nada foi alterado. Tente de novo.')
    }
    setBusy(false)
  }
  const undo = async () => {
    setBusy(true)
    setError(null)
    try {
      await admin.deliveries.undoAssign(view.orderId)
      await invalidate()
    } catch {
      setError('Não foi possível desfazer: a entrega já saiu.')
    }
    setBusy(false)
  }

  if (view.current) {
    return (
      <>
        <div className={l.stack} style={{ alignItems: 'center', gap: 12, paddingTop: 24, textAlign: 'center' }}>
          <div className={s.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
          <h1 className={l.h1}>{view.current.title}</h1>
          <div className={l.sub}>{view.current.summary}</div>
          {error && <Banner tone="error">{error}</Banner>}
        </div>
        <Footer>
          <ButtonLink href="/gestao/entregas" size="lg" fullWidth>Voltar às entregas</ButtonLink>
          <Button variant="ghost" fullWidth loading={busy} onClick={undo}>Desfazer</Button>
        </Footer>
      </>
    )
  }

  return (
    <>
      <div className={l.stack} style={{ gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <h1 className={l.h1} style={{ fontSize: 22 }}>{view.customer}</h1>
          <StatusTag tone={view.ready ? 'success' : 'warning'}>{view.statusLabel}</StatusTag>
        </div>
        <div>{view.address}</div>
        <div className={l.sub}>{view.summary}</div>
      </div>
      {!view.ready ? (
        <Banner tone="warning">O pedido ainda não está pronto. Marque como pronto em Pedidos para escolher quem leva.</Banner>
      ) : (
        <section aria-labelledby="quem-leva" className={l.stack} style={{ gap: 8 }}>
          <h2 id="quem-leva" style={{ font: '700 17px/24px var(--fonte-titulo)', margin: 0 }}>Quem leva</h2>
          {view.options.map((o) => <OptionCard key={o.id} option={o} selected={option.id === o.id} onSelect={() => setChosen(o.id)} />)}
          <div className={l.sub}>Entregador próprio recebe por mês; parceiro recebe por entrega, no valor mostrado.</div>
          {error && <Banner tone="error">{error}</Banner>}
        </section>
      )}
      <Footer>
        <Button size="lg" fullWidth loading={busy} disabled={!view.ready} onClick={send}>{option.button}</Button>
      </Footer>
    </>
  )
}

export function AssignPage() {
  const { id } = useParams()
  const query = useAssignView(id)
  return (
    <>
      <ScreenHeader title={`Enviar pedido #${id}`} back="/gestao/entregas" />
      <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando pedido" />} errorTitle="Não foi possível carregar o pedido">
          {(v) => (v ? <AssignBody key={v.orderId} view={v} /> : <EmptyState icon="entregas" title="Pedido não encontrado ou sem entrega" action={<ButtonLink href="/gestao/entregas">Ver entregas</ButtonLink>} />)}
        </QueryBoundary>
      </main>
    </>
  )
}
