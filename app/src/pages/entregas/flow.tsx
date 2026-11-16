import { useId, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Banner, Button, ButtonLink, ChoiceOption, ConfirmationCode, EmptyState, Icon, IndicatorSkeleton } from '@/components'
import { hhmm } from '@/domain/deliveries'
import { PROBLEM_REASONS } from '@/domain/courierApp'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import type { CourierDetail } from '@/services/types'
import { useCourierSession } from '@/store/courier'
import { useCourierDelivery, useInvalidateCourier } from '@/ui/entregas/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const h2 = { font: '700 17px/24px var(--fonte-titulo)', margin: 0 } as const
const stage = (n: number, name: string) => <div className={l.sub} style={{ fontWeight: 600 }}>Etapa {n} de 4 · {name}</div>

/** Cada página busca a entrega, e quando ela não é desta pessoa ou não existe, avisa. */
function Delivery({ title, back, children }: { title?: string; back: 'list' | 'detail' | 'route'; children: (d: CourierDetail, act: <T>(f: () => Promise<T>, fail?: string, onCode?: (code: string) => boolean) => Promise<T | null>, state: { busy: boolean; error: string | null }) => React.ReactNode }) {
  const { id } = useParams()
  const query = useCourierDelivery(id)
  const invalidate = useInvalidateCourier()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const act = async <T,>(f: () => Promise<T>, fail = 'Não foi possível concluir. Nada foi alterado. Tente de novo.', onCode?: (code: string) => boolean) => {
    setBusy(true)
    setError(null)
    try {
      const r = await f()
      await invalidate()
      setBusy(false)
      return r
    } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      if (onCode?.(code)) {
        setBusy(false)
        return null
      }
      setError(code === 'wrong_state' ? 'Esta entrega mudou. A tela foi atualizada.' : fail)
      await invalidate()
      setBusy(false)
      return null
    }
  }
  return (
    <>
      <ScreenHeader title={title ?? `Pedido #${id}`} back={back === 'list' ? '/entregas' : back === 'detail' ? `/entregas/pedido/${id}` : `/entregas/pedido/${id}/rota`} />
      <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando a entrega" />} errorTitle="Não foi possível carregar a entrega">
        {(d) =>
          d ? (
            children(d, act, { busy, error })
          ) : (
            <main className={s.main}>
              <EmptyState icon="entregas" title="Entrega não encontrada" description="Ela pode ter sido pega por outra pessoa." action={<ButtonLink href="/entregas">Voltar às entregas</ButtonLink>} />
            </main>
          )
        }
      </QueryBoundary>
    </>
  )
}

const goTo = (d: CourierDetail) => (d.stage === 3 ? `/entregas/pedido/${d.orderId}/rota` : d.stage === 2 ? `/entregas/pedido/${d.orderId}/coleta` : `/entregas/pedido/${d.orderId}`)

export function DetailPage() {
  const { admin } = useServices()
  const courierId = useCourierSession((x) => x.courierId)!
  return (
    <Delivery back="list">
      {(d, act, { busy, error }) => {
        const partner = d.partnerFeeCents != null
        const mine = d.state === 'assigned' || d.state === 'reserved'
        return (
          <>
            <main className={s.main} style={{ gap: 16, paddingTop: 12 }}>
              {d.stage === 1 && stage(1, 'Aceite')}
              {d.stage === 2 && stage(2, 'Coleta')}
              <section aria-label="Coletar em" className={l.stack} style={{ gap: 4 }}>
                <div className={l.sub}>Coletar em</div>
                <div style={{ display: 'flex', gap: 8 }}><Icon name="local" size={20} /><div><b>Bodeleve</b><div className={l.sub}>{d.storeAddress} · balcão</div></div></div>
              </section>
              <section aria-label="Entregar para" className={l.stack} style={{ gap: 4 }}>
                <div className={l.sub}>Entregar para</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Icon name="perfil" size={20} />
                  <div>
                    <b>{d.customer}</b>
                    <div className={l.sub}>{d.street} · {d.district}</div>
                    {d.reference && <div className={l.sub}>Ponto de referência: {d.reference}</div>}
                  </div>
                </div>
              </section>
              <div className={l.linkList}>
                <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Distância</span><b>{d.km ?? '—'}</b></div>
                <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Volumes</span><b>1 sacola</b></div>
                <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Itens</span><b>{d.items}</b></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}><Icon name="caixa" size={20} /><div>{d.payLine}</div></div>
              {partner && (
                <div className={l.linkList}>
                  <div className={s.plainRow} style={{ justifyContent: 'space-between', fontWeight: 700 }}><span>Você recebe por esta entrega</span><span>{formatBRL(d.partnerFeeCents!)}</span></div>
                </div>
              )}
              {d.state === 'delivered' && <Banner tone="success">Entrega concluída{d.at ? ` às ${hhmm(d.at)}` : ''}.</Banner>}
              {d.state === 'returned' && <Banner tone="warning">Devolvida à loja{d.problemReason ? `: ${d.problemReason.toLowerCase()}` : ''}.</Banner>}
              {d.state === 'published' && <Banner tone="warning">Publicada para parceiros. Aceite para ficar com ela.</Banner>}
              {error && <Banner tone="error">{error}</Banner>}
            </main>
            <Footer>
              {d.state === 'accepted' && (
                <>
                  <div role="status" className={l.sub}>Entrega aceita. A loja foi avisada.</div>
                  <ButtonLink href={`/entregas/pedido/${d.orderId}/coleta`} size="lg" fullWidth>Ir para a coleta</ButtonLink>
                </>
              )}
              {d.state === 'en_route' && <ButtonLink href={goTo(d)} size="lg" fullWidth>Voltar à rota</ButtonLink>}
              {(d.state === 'free' || d.state === 'published') && (
                <Button size="lg" fullWidth loading={busy} onClick={() => act(() => admin.courier.take(courierId, d.orderId))}>{partner ? `Aceitar por ${formatBRL(d.partnerFeeCents!)}` : 'Pegar esta entrega'}</Button>
              )}
              {mine && (
                <Button size="lg" fullWidth loading={busy} onClick={() => act(() => admin.courier.accept(courierId, d.orderId))}>{partner ? `Aceitar por ${formatBRL(d.partnerFeeCents!)}` : 'Aceitar entrega'}</Button>
              )}
              {(d.state === 'delivered' || d.state === 'returned') && <ButtonLink href="/entregas" size="lg" fullWidth>Voltar às entregas</ButtonLink>}
            </Footer>
          </>
        )
      }}
    </Delivery>
  )
}

export function PickupPage() {
  const { admin } = useServices()
  const courierId = useCourierSession((x) => x.courierId)!
  const navigate = useNavigate()
  const [checked, setChecked] = useState<boolean[]>([false, false, false])
  return (
    <Delivery title="Coleta" back="detail">
      {(d, act, { busy, error }) => {
        if (d.stage !== 2) {
          return (
            <main className={s.main}>
              <EmptyState icon="entregas" title={d.stage === 3 ? 'Esta entrega já saiu' : 'Aceite a entrega primeiro'} action={<ButtonLink href={goTo(d)}>Continuar</ButtonLink>} />
            </main>
          )
        }
        const items = [
          '1 sacola térmica, lacrada',
          `Nota da casa com o pedido #${d.orderId}`,
          d.cashDueCents === 0 ? `Nada para cobrar (${d.payLine.replace(/\. Nada a cobrar\.$/, '').replace(/^P/, 'p')})` : d.payLine.replace(/\.$/, ''),
        ]
        const n = checked.filter(Boolean).length
        return (
          <>
            <main className={s.main} style={{ gap: 16, paddingTop: 12 }}>
              {stage(2, 'Coleta')}
              <h1 className={l.h1} style={{ fontSize: 22 }}>Confira antes de sair</h1>
              <div className={l.linkList}>
                {items.map((label, i) => (
                  <ChoiceOption key={label} type="checkbox" checked={checked[i]} onChange={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}>{label}</ChoiceOption>
                ))}
              </div>
              <div className={l.sub}>Se faltar algo, avise o balcão antes de sair.</div>
              {error && <Banner tone="error">{error}</Banner>}
            </main>
            <Footer>
              {n === 3 ? (
                <Button size="lg" fullWidth loading={busy} onClick={async () => { const r = await act(() => admin.courier.depart(courierId, d.orderId)); if (r) navigate(`/entregas/pedido/${d.orderId}/rota`, { replace: true }) }}>Saí da loja</Button>
              ) : (
                <Button size="lg" fullWidth disabled>Confira os itens · {n} de 3</Button>
              )}
            </Footer>
          </>
        )
      }}
    </Delivery>
  )
}

export function RoutePage() {
  return (
    <Delivery title="Em rota" back="detail">
      {(d) => {
        if (d.stage !== 3) {
          return (
            <main className={s.main}>
              <EmptyState icon="entregas" title={d.state === 'delivered' ? 'Entrega concluída' : d.state === 'returned' ? 'Entrega devolvida' : 'Esta entrega ainda não saiu'} action={<ButtonLink href={d.stage === 0 ? '/entregas' : goTo(d)}>Continuar</ButtonLink>} />
            </main>
          )
        }
        const phone = d.phone.replace(/\D/g, '')
        return (
          <>
            <main className={s.main} style={{ gap: 16, paddingTop: 12 }}>
              {stage(3, 'Em rota')}
              <div className={l.sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, borderRadius: 12, border: '1.5px dashed var(--linha)' }}>[MAPA DA ROTA]</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Icon name="local" size={20} />
                <div>
                  <b>{d.customer}</b>
                  <div className={l.sub}>{d.street} · {d.district}</div>
                  {d.reference && <div className={l.sub}>Ponto de referência: {d.reference}</div>}
                </div>
              </div>
              <div>{d.km ?? '—'}{d.minutes != null ? ` · cerca de ${d.minutes} min` : ''}</div>
              {d.at && <div className={l.sub}>Pedido a caminho desde {hhmm(d.at)} no acompanhamento da loja.</div>}
              <div className={s.filters}>
                <a href={d.mapsUrl} target="_blank" rel="noreferrer" className={l.linkRow} style={{ minHeight: 48, padding: '0 16px', border: '1.5px solid var(--linha)', borderRadius: 8, textDecoration: 'none' }}><Icon name="local" size={20} /> Abrir no mapa</a>
                <a href={`tel:${phone}`} className={l.linkRow} style={{ minHeight: 48, padding: '0 16px', border: '1.5px solid var(--linha)', borderRadius: 8, textDecoration: 'none' }}><Icon name="perfil" size={20} /> Ligar</a>
              </div>
              <div className={l.sub}>“Abrir no mapa” usa o app de mapas do celular; nesta versão, sem rastreio em tempo real.</div>
            </main>
            <Footer>
              <ButtonLink href={`/entregas/pedido/${d.orderId}/entregar`} size="lg" fullWidth>Cheguei</ButtonLink>
              <ButtonLink href={`/entregas/pedido/${d.orderId}/problema`} variant="secondary" size="lg" fullWidth>Problema na entrega</ButtonLink>
            </Footer>
          </>
        )
      }}
    </Delivery>
  )
}

export function HandoverPage() {
  const { admin } = useServices()
  const courierId = useCourierSession((x) => x.courierId)!
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(false)
  return (
    <Delivery title="Entregar" back="route">
      {(d, act, { busy, error }) => {
        if (d.state === 'delivered') {
          return (
            <>
              <main className={s.main} style={{ gap: 12, paddingTop: 32 }}>
                <div className={l.stack} style={{ alignItems: 'center', gap: 8, textAlign: 'center' }}>
                  <div className={s.disc} style={{ width: 64, height: 64, background: 'var(--sucesso-fundo)', color: 'var(--sucesso)' }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
                  <h1 className={l.h1}>Entregue</h1>
                  <div className={l.sub}>Pedido #{d.orderId}{d.at ? ` · ${hhmm(d.at)}` : ''} · a loja e quem comprou veem o pedido como entregue.</div>
                </div>
              </main>
              <Footer>
                <ButtonLink href="/entregas" size="lg" fullWidth>Próxima entrega</ButtonLink>
                <ButtonLink href="/entregas/historico" variant="secondary" size="lg" fullWidth>Ver histórico</ButtonLink>
              </Footer>
            </>
          )
        }
        if (d.stage !== 3) {
          return (
            <main className={s.main}>
              <EmptyState icon="entregas" title={d.state === 'returned' ? 'Entrega devolvida' : 'Esta entrega ainda não saiu'} action={<ButtonLink href={goTo(d)}>Continuar</ButtonLink>} />
            </main>
          )
        }
        return (
          <>
            <main className={s.main} style={{ gap: 16, paddingTop: 12 }}>
              {stage(4, 'Entrega')}
              <h1 className={l.h1} style={{ fontSize: 22 }}>Peça o código a quem comprou</h1>
              <div className={l.sub}>{d.customer} recebe um código de 4 números na tela de acompanhamento do pedido.</div>
              <ConfirmationCode label="Código de entrega" value={code} onChange={(v) => { setCode(v); setWrong(false) }} invalid={wrong} />
              {wrong && <Banner tone="error">Código não confere. Confira com quem comprou.</Banner>}
              {error && <Banner tone="error">{error}</Banner>}
              <ButtonLink href={`/entregas/pedido/${d.orderId}/problema?motivo=codigo`} variant="ghost">Quem comprou não tem o código</ButtonLink>
            </main>
            <Footer>
              <Button
                size="lg"
                fullWidth
                loading={busy}
                disabled={code.length < 4}
                onClick={() => act(() => admin.courier.confirm(courierId, d.orderId, code), 'Não foi possível confirmar. Nada foi alterado. Tente de novo.', (c) => { if (c === 'wrong_code') { setWrong(true); return true } return false })}
              >
                Confirmar entrega
              </Button>
            </Footer>
          </>
        )
      }}
    </Delivery>
  )
}

export function ProblemPage() {
  const { admin } = useServices()
  const courierId = useCourierSession((x) => x.courierId)!
  const [params] = useSearchParams()
  const [reason, setReason] = useState(params.get('motivo') === 'codigo' ? PROBLEM_REASONS[3] : PROBLEM_REASONS[0])
  const [note, setNote] = useState('')
  const noteId = useId()
  const photoId = useId()
  return (
    <Delivery title="Problema na entrega" back="route">
      {(d, act, { busy, error }) => {
        if (d.state === 'returned') {
          return (
            <>
              <main className={s.main} style={{ gap: 12, paddingTop: 32 }}>
                <div className={l.stack} style={{ alignItems: 'center', gap: 8, textAlign: 'center' }}>
                  <div className={s.disc} style={{ width: 64, height: 64 }} aria-hidden="true"><Icon name="confirmar" size={32} /></div>
                  <h1 className={l.h1}>Devolução registrada</h1>
                  <div className={l.sub}>Leve o pedido #{d.orderId} de volta à loja e entregue no balcão. A loja foi avisada e decide se reenvia.</div>
                </div>
                {error && <Banner tone="error">{error}</Banner>}
              </main>
              <Footer>
                <ButtonLink href="/entregas" size="lg" fullWidth>Voltar às entregas</ButtonLink>
                <Button variant="ghost" fullWidth loading={busy} onClick={() => act(() => admin.courier.undoProblem(courierId, d.orderId), 'Não foi possível desfazer: a loja já mexeu neste pedido.')}>Desfazer</Button>
              </Footer>
            </>
          )
        }
        if (d.stage !== 3) {
          return (
            <main className={s.main}>
              <EmptyState icon="entregas" title="Esta entrega não está em rota" action={<ButtonLink href={d.stage === 0 ? '/entregas' : goTo(d)}>Continuar</ButtonLink>} />
            </main>
          )
        }
        return (
          <>
            <main className={s.main} style={{ gap: 16, paddingTop: 12 }}>
              <fieldset className={l.fieldset}>
                <legend style={h2}>O que aconteceu?</legend>
                {PROBLEM_REASONS.map((r) => <ChoiceOption key={r} type="radio" name="motivo" checked={reason === r} onChange={() => setReason(r)}><b>{r}</b></ChoiceOption>)}
              </fieldset>
              <div className={l.stack} style={{ gap: 6 }}>
                <label htmlFor={noteId} style={{ fontWeight: 600 }}>Detalhe (opcional)</label>
                <textarea id={noteId} rows={2} value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--linha)', background: 'var(--superficie)', font: 'var(--corpo)', color: 'var(--texto)' }} />
              </div>
              <div className={l.stack} style={{ gap: 6 }}>
                <label htmlFor={photoId} style={{ fontWeight: 600 }}>Foto do local (opcional)</label>
                <input id={photoId} type="file" accept="image/*" capture="environment" />
                <div className={l.sub}>A foto ainda não é guardada nesta versão.</div>
              </div>
              <div className={l.sub}>A loja recebe o aviso na hora e pode ligar para quem comprou.</div>
              {error && <Banner tone="error">{error}</Banner>}
            </main>
            <Footer>
              <ButtonLink href={`/entregas/pedido/${d.orderId}/rota`} variant="secondary" size="lg" fullWidth>Tentar de novo</ButtonLink>
              <Button size="lg" fullWidth loading={busy} onClick={() => act(() => admin.courier.problem(courierId, d.orderId, reason, note))}>Devolver à loja</Button>
            </Footer>
          </>
        )
      }}
    </Delivery>
  )
}
