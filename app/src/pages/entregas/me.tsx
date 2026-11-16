import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, IndicatorSkeleton, ListSkeleton, StatusTag, Switch, TextField } from '@/components'
import { hhmm } from '@/domain/deliveries'
import { formatBRL } from '@/lib/format'
import { useServices } from '@/services'
import { useCourierSession } from '@/store/courier'
import { useCourierHistory, useCourierProfile, useInvalidateCourier } from '@/ui/entregas/queries'
import { QueryBoundary } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

const num = { fontVariantNumeric: 'tabular-nums' } as const
const km = (v: number) => `${v.toFixed(1).replace('.', ',')} km`

export function HistoryPage() {
  const query = useCourierHistory()
  const profile = useCourierProfile()
  const partner = profile.data?.kind === 'partner'
  const now = new Date()
  return (
    <>
      <header className={s.header}>
        <div>
          <h1 className={s.title} style={{ margin: 0 }}>Histórico</h1>
          <div className={s.date}>Hoje, {String(now.getDate()).padStart(2, '0')}/{String(now.getMonth() + 1).padStart(2, '0')}</div>
        </div>
      </header>
      <main className={s.main} style={{ gap: 16, paddingTop: 8 }}>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={3} label="Carregando o histórico" />} errorTitle="Não foi possível carregar o histórico">
          {(h) => (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                <div className={l.sub}>Entregas<div style={{ font: 'var(--corpo)', fontWeight: 700, color: 'var(--texto)', ...num }}>{h.delivered}</div></div>
                <div className={l.sub}>{h.returned === 1 ? 'Devolução' : 'Devoluções'}<div style={{ font: 'var(--corpo)', fontWeight: 700, color: 'var(--texto)', ...num }}>{h.returned}</div></div>
                <div className={l.sub}>Rodados<div style={{ font: 'var(--corpo)', fontWeight: 700, color: 'var(--texto)', ...num }}>{km(h.km)}</div></div>
              </div>
              {h.rows.length === 0 ? (
                <div className={l.sub}>Nenhuma entrega hoje ainda.</div>
              ) : (
                <div className={l.linkList}>
                  {h.rows.map((r) => (
                    <div key={r.orderId} className={s.plainRow} style={{ minHeight: 64 }}>
                      <span className={l.grow}>
                        <span className={l.optionTitle}>#{r.orderId} · {r.district}</span>
                        <span className={l.optionDetail}>{hhmm(r.at)} · {r.km == null ? '—' : km(r.km)}</span>
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <StatusTag tone={r.status === 'delivered' ? 'success' : 'warning'}>{r.status === 'delivered' ? 'Entregue' : 'Devolvido'}</StatusTag>
                        {partner && r.payoutCents != null && <span style={{ fontWeight: 600, ...num }}>{formatBRL(r.payoutCents)}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {partner && h.payoutCents != null ? (
                <div className={l.linkList}>
                  <div className={s.plainRow} style={{ justifyContent: 'space-between', fontWeight: 700 }}><span>A receber hoje</span><span style={num}>{formatBRL(h.payoutCents)}</span></div>
                  <div className={s.plainRow}><span className={l.sub}>{h.payoutDetail}</span></div>
                </div>
              ) : (
                <div className={l.sub}>Entregador da casa: o pagamento é mensal, combinado com a loja. O histórico serve para conferência.</div>
              )}
            </>
          )}
        </QueryBoundary>
      </main>
    </>
  )
}

export function ProfilePage() {
  const { admin } = useServices()
  const navigate = useNavigate()
  const signOut = useCourierSession((x) => x.signOut)
  const courierId = useCourierSession((x) => x.courierId)!
  const invalidate = useInvalidateCourier()
  const query = useCourierProfile()
  const [pix, setPix] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  return (
    <>
      <header className={s.header}><h1 className={s.title} style={{ margin: 0 }}>Perfil</h1></header>
      <main className={s.main} style={{ gap: 16, paddingTop: 8 }}>
        <QueryBoundary query={query} skeleton={<IndicatorSkeleton label="Carregando o perfil" />} errorTitle="Não foi possível carregar o perfil">
          {(c) =>
            !c ? null : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={s.disc} style={{ width: 56, height: 56, fontWeight: 700, fontSize: 22 }} aria-hidden="true">{c.name.charAt(0)}</span>
                  <div>
                    <div style={{ font: '700 20px/26px var(--fonte-titulo)' }}>{c.name}</div>
                    <StatusTag tone="neutral">{c.kind === 'partner' ? 'Parceiro' : 'Entregador da casa'}</StatusTag>
                  </div>
                </div>
                <div>
                  <Switch label="Disponível para entregas" checked={c.available} onChange={async (v) => { await admin.courier.setAvailable(courierId, v); await invalidate() }} />
                  <div className={l.sub}>Desligue quando parar o turno.</div>
                </div>
                <div className={l.linkList}>
                  <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Veículo</span><b>{c.vehicle}</b></div>
                  <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Celular</span><b>{c.phone}</b></div>
                  <div className={s.plainRow} style={{ justifyContent: 'space-between' }}><span>Pagamento</span><b>{c.kind === 'partner' ? 'Por entrega, Pix às segundas' : 'Mensal, pela casa'}</b></div>
                </div>
                {c.kind === 'partner' && (
                  <div className={l.stack} style={{ gap: 8 }}>
                    <TextField label="Chave Pix para receber" placeholder="[CHAVE PIX]" value={pix ?? c.pixKey} onChange={(e) => { setPix(e.target.value); setSaved(false) }} onBlur={async () => { if (pix != null && pix !== c.pixKey) { await admin.courier.savePix(courierId, pix); await invalidate(); setSaved(true) } }} />
                    <div role="status" aria-live="polite" className={l.sub}>{saved && 'Chave Pix salva. Ela só será usada quando o pagamento for ligado.'}</div>
                  </div>
                )}
                <Button variant="secondary" onClick={() => { signOut(); navigate('/entregas/entrar') }}>Sair</Button>
              </>
            )
          }
        </QueryBoundary>
      </main>
    </>
  )
}
