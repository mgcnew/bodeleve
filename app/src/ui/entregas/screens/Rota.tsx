import { ButtonLink } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { hourMinute } from '@/domain/dates'
import { Bar } from '../../shared/OpsBits'
import { Destino, StepHeader, useOrder } from './Detalhe'
import o from '@/styles/ops.module.css'

export function Rota() {
  const order = useOrder()
  if (!order) return null
  const query = encodeURIComponent(`${order.address?.line1 ?? ''}, ${order.address?.line2 ?? ''}`)

  return (
    <div className={o.screen}>
      <Bar title="Em rota" back={`/entregas/pedido/${order.id}/coleta`} />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <StepHeader step={3} />
        <div role="img" aria-label="Espaço para o mapa da rota" style={{ height: 200, borderRadius: 16, background: 'var(--superficie)', border: '1px dashed var(--texto-secundario)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 12px var(--fonte-texto)', color: 'var(--texto-secundario)' }}>
          [MAPA DA ROTA]
        </div>
        <div className={o.card} style={{ gap: 10 }}>
          <Destino order={order} />
          <div className={`${o.cardHead} ${o.muted} ${o.num}`}>
            <span>{order.distanceKm ? `${order.distanceKm.toLocaleString('pt-BR')} km · cerca de ${Math.max(5, Math.round(order.distanceKm * 3))} min` : 'Distância não informada'}</span>
            <span>Cliente avisada às {hourMinute(new Date().toISOString())}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noopener noreferrer" className={o.card} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 56, fontWeight: 600, gap: 8 }}>
            <Icon name="local" size={20} />
            Abrir no mapa
          </a>
          <a href={`tel:+55${order.customer.phone.replace(/\D/g, '')}`} className={o.card} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 56, fontWeight: 600, gap: 8 }}>
            <Icon name="perfil" size={20} />
            Ligar
          </a>
        </div>
        <p className={o.muted}>“Abrir no mapa” usa o app de mapas do celular; nesta versão, sem rastreio em tempo real.</p>
      </main>
      <div className={o.footer}>
        <ButtonLink to={`/entregas/pedido/${order.id}/entrega`} size="l" block>
          Cheguei
        </ButtonLink>
        <ButtonLink to={`/entregas/pedido/${order.id}/problema`} variant="secondary" block>
          Problema na entrega
        </ButtonLink>
      </div>
    </div>
  )
}
