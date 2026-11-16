import { useState } from 'react'
import { Button, ButtonLink } from '@/components/Button'
import { Banner, EmptyState } from '@/components/Feedback'
import { SelectField } from '@/components/Field'
import { Sheet } from '@/components/Sheet'
import { formatCents } from '@/domain/money'
import { cartSubtotal, cartTotal } from '@/domain/pdv'
import { formatQty } from '@/domain/backoffice'
import { applyDiscount, cartStore, discountFor, presetLabels, setLineGrams, setLineQty, stockShortages, type DiscountPreset } from '@/services/pdv'
import { Bar, SumRow, SumTotal } from '../../shared/OpsBits'
import { BigChip, CartLineView, WeightSheet } from '../components/PdvBits'
import { useSellable } from '../components/useSellable'
import o from '@/styles/ops.module.css'
import s from './Pdv.module.css'

const reasons = ['Cliente da casa', 'Produto perto da validade', 'Arredondamento', 'Outro']

export function Sacola() {
  const cart = cartStore.useStore()
  const sellable = useSellable()
  const [discountOpen, setDiscountOpen] = useState(false)
  const [preset, setPreset] = useState<DiscountPreset>('p5')
  const [reason, setReason] = useState(reasons[0])
  const [weighing, setWeighing] = useState<string | null>(null)
  const [grams, setGrams] = useState(500)

  if (cart.lines.length === 0) {
    return (
      <div className={o.screen}>
        <Bar title="Sacola" back="/pdv" />
        <EmptyState bare icon="sacola" title="Sacola vazia" text="Toque num produto para começar a venda." action={<ButtonLink to="/pdv">Voltar a vender</ButtonLink>} />
      </div>
    )
  }

  const subtotal = cartSubtotal(cart)
  const preview = discountFor(preset, subtotal)
  const short = stockShortages(cart, (id) => sellable.find((x) => x.item.id === id)?.available ?? 0)
  const weighLine = cart.lines.find((l) => l.itemId === weighing)

  return (
    <div className={o.screen}>
      <Bar title="Sacola" back="/pdv" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`} style={{ gap: 12 }}>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cart.lines.map((l) => (
            <CartLineView
              key={l.itemId}
              line={l}
              onQty={(n) => setLineQty(l.itemId, n)}
              onWeight={() => {
                setGrams(l.grams ?? 500)
                setWeighing(l.itemId)
              }}
            />
          ))}
        </ul>
        {short.map(({ line, have, need }) => {
          const item = sellable.find((x) => x.item.id === line.itemId)?.item
          return (
            <Banner key={line.itemId} tone="error">
              Estoque insuficiente: há {formatQty(Math.max(0, have), item?.unit ?? 'un')} de {line.name} e a venda pede {formatQty(need, item?.unit ?? 'un')}.
            </Banner>
          )
        })}
        <div className={o.card}>
          <SumRow label="Subtotal" value={formatCents(subtotal)} />
          {cart.discount && <SumRow label={cart.discount.label} value={`− ${formatCents(cart.discount.cents)}`} />}
          <SumTotal value={formatCents(cartTotal(cart))} />
        </div>
        {cart.discount ? (
          <Button variant="secondary" block onClick={() => applyDiscount(null)}>
            Tirar desconto
          </Button>
        ) : (
          <Button variant="secondary" block onClick={() => setDiscountOpen(true)}>
            Dar desconto
          </Button>
        )}
      </main>
      <div className={o.footer}>
        {short.length > 0 ? (
          <Button size="l" block disabled>
            Ajuste a sacola para cobrar
          </Button>
        ) : (
          <ButtonLink to="/pdv/pagamento" size="l" block spread>
            <span>Cobrar</span>
            <span className={o.num}>{formatCents(cartTotal(cart))}</span>
          </ButtonLink>
        )}
      </div>

      {/* H-P5 — desconto por atalhos, com motivo obrigatório */}
      <Sheet open={discountOpen} onClose={() => setDiscountOpen(false)} title="Dar desconto">
        <div className={s.chipRow} role="group" aria-label="Valor do desconto" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(presetLabels) as DiscountPreset[]).map((p) => (
            <BigChip key={p} active={preset === p} onClick={() => setPreset(p)}>
              {presetLabels[p]}
            </BigChip>
          ))}
        </div>
        <SelectField label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} options={reasons.map((r) => ({ value: r, label: r }))} />
        <div aria-live="polite" className={o.muted}>
          {preview.cents > 0 ? `Desconto de ${formatCents(preview.cents)} · total fica ${formatCents(subtotal - preview.cents)}` : 'Esse total já é redondo: não há o que arredondar.'}
        </div>
        <Button
          size="l"
          block
          disabled={preview.cents <= 0}
          onClick={() => {
            applyDiscount({ label: preview.label, cents: preview.cents, reason })
            setDiscountOpen(false)
          }}
        >
          Aplicar desconto
        </Button>
        <Button variant="secondary" block onClick={() => setDiscountOpen(false)}>
          Cancelar
        </Button>
      </Sheet>

      <WeightSheet
        open={!!weighLine}
        name={weighLine?.name ?? ''}
        unitPriceCents={weighLine?.unitPriceCents ?? 0}
        grams={grams}
        onGrams={setGrams}
        onConfirm={() => {
          if (weighing) setLineGrams(weighing, grams)
          setWeighing(null)
        }}
        onClose={() => setWeighing(null)}
        confirmLabel="Atualizar"
      />
    </div>
  )
}
