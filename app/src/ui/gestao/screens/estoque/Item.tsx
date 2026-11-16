import { useParams } from 'react-router-dom'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { formatQty } from '@/domain/backoffice'
import { daysUntil, fullDate, hourMinute } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { balanceOf, lotsOf } from '@/services/gestao/stock'
import { useStockContext } from '@/services/gestao/useBackoffice'
import o from '@/styles/ops.module.css'
import { Bar, SumRow } from '../../../shared/OpsBits'
import { ItemSeal, itemTypeLabels } from '../../components/ItemSeal'
import s from './Estoque.module.css'

export function expiryTag(expiry: string | null) {
  if (!expiry) return <Tag tone="success">Sem validade</Tag>
  const d = daysUntil(expiry)
  if (d < 0) return <Tag tone="error">Vencido</Tag>
  if (d === 0) return <Tag tone="error">Vence hoje</Tag>
  if (d <= 7) return <Tag tone="warning">Vence em {d} {d === 1 ? 'dia' : 'dias'}</Tag>
  return <Tag tone="success">No prazo</Tag>
}

export function Item() {
  const { id = '' } = useParams()
  const ctx = useStockContext()
  const item = ctx.items.find((i) => i.id === id)

  if (!item) {
    return (
      <div className={o.screen}>
        <Bar title="Item" back="/gestao/estoque" />
        <EmptyState bare icon="estoque" title="Item não encontrado" action={<ButtonLink to="/gestao/estoque">Ver estoque</ButtonLink>} />
      </div>
    )
  }

  const b = balanceOf(item.id, ctx)
  const lots = lotsOf(item.id, ctx.lots, ctx.movements)
  const reservingOrders = ctx.orders.filter((x) => ['new', 'separating', 'ready'].includes(x.status) && x.items.some((i) => i.productId === item.id)).length
  const production = ctx.production?.filter((p) => p.productId === item.id && p.status === 'in_progress') ?? []
  const low = b.available < item.minStock
  const q = (n: number) => formatQty(n, item.unit)

  return (
    <div className={o.screen}>
      <Bar title={item.name} back="/gestao/estoque" />
      <main className={`${o.main} ${o.mainTop}`}>
        <div className={o.cardHead} style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          <ItemSeal item={item} />
          {low && <Tag tone="warning">Estoque baixo</Tag>}
        </div>
        <div className={s.balances}>
          <div className={`${s.bal} ${s.balStrong}`}>
            <span>Disponível</span>
            <b>{q(b.available)}</b>
            <small>pode ser vendido agora</small>
          </div>
          <div className={s.bal}>
            <span>Físico</span>
            <b>{q(b.physical)}</b>
            <small>na prateleira</small>
          </div>
          <div className={s.bal}>
            <span>Reservado</span>
            <b>{q(b.reserved)}</b>
            <small>{reservingOrders ? `${reservingOrders} ${reservingOrders === 1 ? 'pedido online' : 'pedidos online'}` : 'nenhum pedido'}</small>
          </div>
          <div className={s.bal}>
            <span>Projetado</span>
            <b>{q(b.projected)}</b>
            <small>
              {[b.inProduction && `+ ${b.inProduction} em produção`, b.incoming && `+ ${b.incoming} a receber`].filter(Boolean).join(' · ') || 'sem entradas previstas'}
            </small>
          </div>
        </div>
        <p className={o.muted}>
          Mínimo: {q(item.minStock)}.{' '}
          {low && production[0]
            ? `Com a produção em andamento (${production[0].number}, termina ${daysUntil(production[0].endAt) === 0 ? 'hoje' : fullDate(production[0].endAt)} às ${hourMinute(production[0].endAt)}), o saldo ${b.projected >= item.minStock ? 'volta acima do mínimo' : 'ainda fica abaixo do mínimo'}.`
            : low && b.incoming
              ? `Com a compra a receber, o saldo ${b.projected >= item.minStock ? 'volta acima do mínimo' : 'ainda fica abaixo do mínimo'}.`
              : low
                ? 'Nada previsto para repor: vale fazer um pedido de compra ou uma ordem de produção.'
                : ''}
        </p>

        {item.tracksLots && (
          <section className={o.section}>
            <h2 className={o.h2}>Lotes</h2>
            {lots.length === 0 ? (
              <p className={o.muted}>Nenhum lote com saldo.</p>
            ) : (
              <Box>
                {lots.map((l, i) => (
                  <div key={l.id} className={s.lot}>
                    <Icon name="validade" size={22} />
                    <div style={{ flex: '1 1 0', minWidth: 0 }}>
                      <div className={o.bold}>Lote {l.code}</div>
                      <div className={o.small}>
                        {l.expiry ? `Vence ${fullDate(l.expiry)}` : 'Sem validade'} · {q(l.qty)}
                      </div>
                      {i === 0 && <div className={s.next}>Próximo a sair</div>}
                    </div>
                    {expiryTag(l.expiry)}
                  </div>
                ))}
              </Box>
            )}
            {/* H-G11 — sai primeiro o lote que vence antes */}
            <p className={o.muted}>Vendas e pedidos usam primeiro o lote que vence antes.</p>
          </section>
        )}

        <div className={o.card}>
          <SumRow label="Tipo" value={itemTypeLabels[item.itemType]} />
          <SumRow label={item.itemType === 'finished' ? 'Custo de produção' : 'Custo'} value={`${formatCents(item.costCents)} / ${item.unit}`} />
          {item.priceCents !== null && <SumRow label="Preço de venda" value={formatCents(item.priceCents)} />}
          {item.itemType !== 'raw_material' && <SumRow label="Na loja online" value={item.published ? 'Publicado' : 'Não publicado'} />}
        </div>
      </main>
      <div className={o.footer}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <ButtonLink to={`/gestao/estoque/${item.id}/movimentacoes`} variant="secondary" block>
            <Icon name="historico" size={20} />
            Movimentações
          </ButtonLink>
          <ButtonLink to={`/gestao/estoque/ajuste?item=${item.id}`} variant="secondary" block>
            <Icon name="remover" size={20} />
            Ajustar
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
