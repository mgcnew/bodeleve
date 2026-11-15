import { useSearchParams } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { AppLink, Button, ButtonLink, Chip, EmptyState, Icon, Indicator, IndicatorSkeleton, ListSkeleton, OriginBadge, StatusTag } from '@/components'
import { compactMoney, type StockRow } from '@/domain/stock'
import { formatBRL, formatDayMonth } from '@/lib/format'
import { formatBrDate } from '@/domain/purchasing'
import { useStockItem, useStockOverview } from '@/ui/gestao/queries'
import { Footer, QueryBoundary, ScreenHeader } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

type Filter = 'todos' | 'baixo' | 'vencendo'

/** Selo do tipo/origem: "Feito na casa", "Marca Bodeleve", "Revenda" ou "Matéria-prima". */
export function KindBadge({ itemType, origin }: Pick<StockRow, 'itemType' | 'origin'>) {
  if (itemType === 'raw_material' || !origin) {
    return <span style={{ padding: '2px 10px', borderRadius: 999, border: '1px solid var(--texto-secundario)', color: 'var(--texto-secundario)', font: '600 12px/18px var(--fonte-texto)', whiteSpace: 'nowrap' }}>Matéria-prima</span>
  }
  return <OriginBadge origin={origin} />
}

export function StockPage() {
  const query = useStockOverview()
  const [params, setParams] = useSearchParams()
  const filter = (params.get('filtro') as Filter) ?? 'todos'
  const setFilter = (f: Filter) => setParams(f === 'todos' ? {} : { filtro: f }, { replace: true })
  return (
    <>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Estoque</h1>
          <div className={s.date}>Saldo disponível = físico menos reservado</div>
        </div>
      </header>
      <main className={s.main} style={{ gap: 16 }}>
        <QueryBoundary query={query} skeleton={<><IndicatorSkeleton label="Carregando estoque" /><ListSkeleton rows={5} label="Carregando itens" /></>} errorTitle="Não foi possível carregar o estoque">
          {(o) => {
            const rows = o.rows.filter((r) => filter === 'todos' || (filter === 'baixo' && r.level !== 'ok') || (filter === 'vencendo' && r.expiringSoon))
            return (
              <>
                <div className={s.todayGrid} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                  <Indicator label="Baixo" value={String(o.lowCount)} tone={o.lowCount ? 'warning' : 'default'} />
                  <Indicator label="Vencendo" value={String(o.expiringCount)} tone={o.expiringCount ? 'warning' : 'default'} />
                  <Indicator label="Valor" value={compactMoney(o.valueCents)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ButtonLink href="/gestao/estoque/contagem" variant="secondary" style={{ flex: 1, minWidth: 0, padding: '0 10px' }}><Icon name="confirmar" size={20} /> Contar estoque</ButtonLink>
                  <ButtonLink href="/gestao/estoque/ajuste" variant="secondary" style={{ flex: 1, minWidth: 0, padding: '0 10px' }}><Icon name="remover" size={20} /> Registrar perda</ButtonLink>
                </div>
                <div role="group" aria-label="Filtrar itens" className={s.filters}>
                  <Chip selected={filter === 'todos'} onClick={() => setFilter('todos')}>Todos · {o.rows.length}</Chip>
                  <Chip selected={filter === 'baixo'} onClick={() => setFilter('baixo')}>Baixo · {o.lowCount}</Chip>
                  <Chip selected={filter === 'vencendo'} onClick={() => setFilter('vencendo')}>Vencendo · {o.rows.filter((r) => r.expiringSoon).length}</Chip>
                </div>
                {rows.length === 0 ? (
                  <EmptyState icon="estoque" title="Nenhum item neste filtro" description="Mostre todos para ver o estoque inteiro." action={<Button variant="secondary" onClick={() => setFilter('todos')}>Ver todos</Button>} />
                ) : (
                  <div className={l.linkList}>
                    {rows.map((r) => (
                      <AppLink key={r.itemId} href={`/gestao/estoque/${r.itemId}`} className={l.linkRow} style={{ minHeight: 72, alignItems: 'center', padding: '12px 0' }}>
                        <span className={l.grow} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className={l.optionTitle}>{r.name}</span>
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <KindBadge itemType={r.itemType} origin={r.origin} />
                            {r.level === 'out' ? <StatusTag tone="error">Sem estoque</StatusTag> : r.level === 'low' ? <StatusTag tone="warning">Baixo</StatusTag> : null}
                            {r.expiringSoon && <StatusTag tone="warning">Vencendo</StatusTag>}
                          </span>
                          {r.expiringSoon && r.nextExpiry && <span className={l.optionDetail}>Lote vence {formatDayMonth(r.nextExpiry)}</span>}
                          {r.incomingToday > 0 && <span className={l.optionDetail}>{r.incomingToday} un chegam hoje</span>}
                        </span>
                        <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          <span className={l.optionTitle}>{r.available} un</span>
                          <span className={l.optionDetail}>mín. {r.min}</span>
                        </span>
                        <Icon name="avancar" size={18} />
                      </AppLink>
                    ))}
                  </div>
                )}
                <div className={l.sub}>Itens à venda e matérias-primas ficam juntos; o selo mostra o tipo de cada um.</div>
              </>
            )
          }}
        </QueryBoundary>
      </main>
    </>
  )
}

const typeLabel = { finished: 'Produto acabado', resale: 'Revenda', raw_material: 'Matéria-prima' } as const

export function StockItemPage() {
  const { id } = useParams()
  const query = useStockItem(id)
  return (
    <QueryBoundary query={query} skeleton={<><ScreenHeader back="/gestao/estoque" /><main className={s.main}><IndicatorSkeleton label="Carregando item" /></main></>} errorTitle="Não foi possível carregar o item">
      {(it) =>
        !it ? (
          <>
            <ScreenHeader back="/gestao/estoque" />
            <main className={s.main}><EmptyState icon="estoque" title="Item não encontrado" action={<ButtonLink href="/gestao/estoque">Ver estoque</ButtonLink>} /></main>
          </>
        ) : (
          <>
            <ScreenHeader title={it.name} back="/gestao/estoque" />
            <main className={s.main} style={{ gap: 16, paddingTop: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <KindBadge itemType={it.itemType} origin={it.origin} />
                {it.level === 'out' ? <StatusTag tone="error">Sem estoque</StatusTag> : it.level === 'low' ? <StatusTag tone="warning">Estoque baixo</StatusTag> : <StatusTag tone="success">Em estoque</StatusTag>}
              </div>
              <div className={s.todayGrid}>
                <Indicator label="Disponível" value={String(it.available)} caption="pode ser vendido agora" />
                <Indicator label="Físico" value={String(it.physical)} caption="na prateleira" />
                <Indicator
                  label="Reservado"
                  value={String(it.reserved)}
                  caption={
                    [it.reservedOrders > 0 ? `${it.reservedOrders} ${it.reservedOrders === 1 ? 'pedido online' : 'pedidos online'}` : '', it.reservedManual > 0 ? `${it.reservedManual} ${it.reservedManual === 1 ? 'reserva manual' : 'reservas manuais'}` : '']
                      .filter(Boolean).join(' e ') || 'nada reservado'
                  }
                />
                <Indicator
                  label="Projetado"
                  value={String(it.projected)}
                  caption={[it.incoming > 0 ? `+ ${it.incoming} a receber` : '', it.inProduction > 0 ? `+ ${it.inProduction} em produção` : ''].filter(Boolean).join(' ') || 'sem entradas previstas'}
                />
              </div>
              <div className={l.sub}>
                Mínimo: {it.min} un.
                {it.level !== 'ok' && it.projected > it.min ? ` Com o que está a caminho, o saldo projetado fica acima do mínimo.` : ''}
              </div>

              <section className={l.section} aria-labelledby="lotes-t">
                <h2 id="lotes-t" className={l.h2}>Lotes</h2>
                {it.lots.length === 0 ? (
                  <div className={l.card}>Nenhum lote com saldo.</div>
                ) : (
                  <div className={l.linkList}>
                    {it.lots.map((lot) => (
                      <div key={lot.id} className={l.cardRow} style={{ alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--linha)' }}>
                        <Icon name="validade" size={22} />
                        <div className={l.grow}>
                          <div className={l.strong}>Lote {lot.code}</div>
                          <div className={`${l.small} ${l.tabular}`}>{lot.expiresAt ? `Vence ${formatBrDate(lot.expiresAt)}` : 'Sem validade'} · {lot.balance} un</div>
                          {lot.isNext && <span className={l.small} style={{ color: 'var(--cor-terracota-pressionado)', fontWeight: 600 }}>Próximo a sair</span>}
                        </div>
                        {lot.daysLeft == null ? <StatusTag>Sem validade</StatusTag> : lot.daysLeft < 0 ? <StatusTag tone="error">Vencido</StatusTag> : lot.daysLeft <= 7 ? <StatusTag tone="warning">{lot.daysLeft === 0 ? 'Vence hoje' : `Vence em ${lot.daysLeft} ${lot.daysLeft === 1 ? 'dia' : 'dias'}`}</StatusTag> : <StatusTag tone="success">No prazo</StatusTag>}
                      </div>
                    ))}
                  </div>
                )}
                <div className={l.sub}>Vendas e pedidos usam primeiro o lote que vence antes.</div>
              </section>

              <div className={l.card} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={l.sumRow}><span>Tipo</span><span style={{ color: 'var(--texto)' }}>{typeLabel[it.itemType]}</span></div>
                {it.unitCostCents != null && <div className={l.sumRow}><span>{it.itemType === 'finished' ? 'Custo de produção' : 'Custo'}</span><span style={{ color: 'var(--texto)' }}>{formatBRL(it.unitCostCents)} / un</span></div>}
                {it.priceCents != null && <div className={l.sumRow}><span>Preço de venda</span><span style={{ color: 'var(--texto)' }}>{formatBRL(it.priceCents)}</span></div>}
                {it.published != null && <div className={l.sumRow}><span>Na loja online</span><span style={{ color: 'var(--texto)' }}>{it.published ? 'Publicado' : 'Não publicado'}</span></div>}
              </div>
            </main>
            <Footer>
              <div style={{ display: 'flex', gap: 8 }}>
                <ButtonLink href={`/gestao/estoque/${it.itemId}/movimentacoes`} variant="secondary" style={{ flex: 1, minWidth: 0, padding: '0 10px' }}><Icon name="historico" size={20} /> Movimentações</ButtonLink>
                <ButtonLink href={`/gestao/estoque/${it.itemId}/ajuste`} variant="secondary" style={{ flex: 1, minWidth: 0, padding: '0 10px' }}><Icon name="remover" size={20} /> Ajustar</ButtonLink>
              </div>
            </Footer>
          </>
        )
      }
    </QueryBoundary>
  )
}
