import { BagItem, ButtonLink, EmptyState, Icon, ListSkeleton, QuantityStepper, Segmented, ValueSummary } from '@/components'
import { formatBRL } from '@/lib/format'
import { itemsLabel } from '@/domain/bag'
import { useBag } from '@/store/bag'
import { useBagSummary } from '@/ui/loja/useBagSummary'
import { Footer, ScreenHeader } from '@/ui/loja/parts'
import { AppLink } from '@/components'
import s from '@/ui/loja/loja.module.css'

export function BagPage() {
  const { lines, totals, fulfillment, isPending, rawCount } = useBagSummary()
  const setQty = useBag((b) => b.setQty)
  const setFulfillment = useBag((b) => b.setFulfillment)

  if (isPending && rawCount > 0) {
    return (
      <>
        <ScreenHeader title="Sacola" back="/" />
        <main className={`${s.main} ${s.narrow}`}><ListSkeleton rows={3} label="Carregando sacola" /></main>
      </>
    )
  }

  if (lines.length === 0) {
    return (
      <>
        <ScreenHeader title="Sacola" back="/" />
        <main className={s.centerBox}>
          <EmptyState icon="sacola" title="Sua sacola está vazia" description="Os produtos que você adicionar aparecem aqui." action={<ButtonLink href="/buscar">Ver produtos</ButtonLink>} />
        </main>
      </>
    )
  }

  return (
    <>
      <ScreenHeader title="Sacola" back="/" />
      <main className={`${s.main} ${s.narrow}`} style={{ gap: 16 }}>
        <div className={s.stack} style={{ gap: 10 }}>
          {lines.map((l) => (
            <BagItem
              key={l.product.id}
              compact
              name={l.product.name}
              detail={`${l.product.unit} · ${formatBRL(l.product.priceCents)}`}
              subtotal={formatBRL(l.totalCents)}
              trailing={<QuantityStepper variant="compact" label={`Quantidade de ${l.product.name}`} value={l.qty} min={0} onChange={(n) => setQty(l.product.id, n)} />}
            />
          ))}
        </div>

        <AppLink href="/buscar" className={s.link}>
          <Icon name="adicionar" size={18} /> Adicionar mais produtos
        </AppLink>

        <div className={s.stack} style={{ gap: 8 }}>
          <div className={s.strong}>Como você quer receber?</div>
          <Segmented
            label="Como receber"
            value={fulfillment}
            onChange={setFulfillment}
            options={[{ value: 'delivery', label: 'Entrega' }, { value: 'pickup', label: 'Retirar na loja' }]}
          />
        </div>

        <ValueSummary
          lines={[
            { label: 'Subtotal', value: formatBRL(totals.subtotalCents) },
            { label: fulfillment === 'delivery' ? 'Entrega (estimada)' : 'Retirada na loja', value: fulfillment === 'delivery' ? formatBRL(totals.deliveryFeeCents) : 'Grátis' },
          ]}
          total={{ label: 'Total', value: formatBRL(totals.totalCents) }}
        />
        <div className={s.sub}>Você não precisa criar conta para comprar.</div>
        <div className="sr-only" aria-live="polite">{itemsLabel(totals.itemCount)} na sacola</div>
      </main>
      <Footer>
        <ButtonLink href="/finalizar/identificacao" size="lg" fullWidth style={{ justifyContent: 'space-between' }}>
          <span>Continuar</span>
          <span className={s.tabular}>{formatBRL(totals.totalCents)}</span>
        </ButtonLink>
      </Footer>
    </>
  )
}
