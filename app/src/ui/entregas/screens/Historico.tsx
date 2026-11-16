import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { hypotheses } from '@/config/hypotheses'
import { hourMinute, isTodayIso, longNow } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { deliveryLogStore } from '@/services/entregas'
import { PageHeader } from '../../shared/OpsBits'
import { useCourier } from '../useCourier'
import o from '@/styles/ops.module.css'

export function Historico() {
  const { account } = useCourier()
  const log = deliveryLogStore.useStore()
  if (!account) return null

  const mine = log.filter((l) => l.courierId === account.id && isTodayIso(l.at)).sort((a, b) => b.at.localeCompare(a.at))
  const delivered = mine.filter((l) => l.result === 'delivered')
  const returned = mine.filter((l) => l.result === 'returned')
  const km = mine.reduce((n, l) => n + (l.km ?? 0), 0)
  const partner = account.kind === 'partner'
  const fee = hypotheses.partnerFeePerDelivery
  const ret = hypotheses.partnerReturnFee
  const earned = delivered.length * fee + returned.length * ret

  return (
    <div className={o.screen}>
      <PageHeader title="Histórico" sub={longNow().split(' · ')[0]} />
      <main className={`${o.main} ${o.narrow}`} style={{ gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {[
            ['Entregas', String(delivered.length)],
            ['Devolução', String(returned.length)],
            ['Rodados', `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`],
          ].map(([t, v]) => (
            <div key={t} className={o.kpi} style={{ padding: 12 }}>
              <span className={o.kpiLabel}>{t}</span>
              <b style={{ fontSize: 20 }}>{v}</b>
            </div>
          ))}
        </div>
        {mine.length === 0 ? (
          <EmptyState icon="historico" title="Nenhuma entrega hoje" text="As entregas e devoluções do dia aparecem aqui." />
        ) : (
          <Box>
            {mine.map((l) => (
              <div key={l.id} className={o.row} style={{ minHeight: 64 }}>
                <span className={o.rowText}>
                  <span className={o.rowTitle}>
                    #{l.orderNumber} · {l.place}
                  </span>
                  <span className={`${o.small} ${o.num}`}>
                    {hourMinute(l.at)}
                    {l.km ? ` · ${l.km.toLocaleString('pt-BR')} km` : ''}
                  </span>
                </span>
                <span className={o.rowEnd}>
                  {l.result === 'delivered' ? <Tag tone="success">Entregue</Tag> : <Tag tone="warning">Devolvido</Tag>}
                  {partner && <span className={`${o.small} ${o.num}`}>{formatCents(l.result === 'delivered' ? fee : ret)}</span>}
                </span>
              </div>
            ))}
          </Box>
        )}
        {partner ? (
          <div className={o.card} style={{ background: 'var(--cor-terracota-suave)', border: 0 }}>
            <div className={`${o.cardHead} ${o.num}`} style={{ fontWeight: 600, fontSize: 18 }}>
              <span>A receber hoje</span>
              <span>{formatCents(earned)}</span>
            </div>
            {/* H-E6/H-E7 — devolução paga metade; parceiro recebe por Pix semanal */}
            <div className={o.muted}>
              {delivered.length} {delivered.length === 1 ? 'entrega' : 'entregas'} × {formatCents(fee)} + {returned.length} {returned.length === 1 ? 'devolução' : 'devoluções'} × {formatCents(ret)}. Pago por Pix toda segunda.
            </div>
          </div>
        ) : (
          <p className={o.muted}>Entregador da casa: o pagamento é mensal, combinado com a loja. O histórico serve para conferência.</p>
        )}
      </main>
    </div>
  )
}
