import { Link } from 'react-router-dom'
import { ButtonLink } from '@/components/Button'
import { Panel, SummaryRow, SummaryTotal } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { Segmented } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/components/QuantityStepper'
import { formatCents } from '@/domain/money'
import type { Fulfillment } from '@/domain/order'
import { TopBar } from '../components/LojaShell'
import { ProductPhoto } from '../components/ProductCard'
import { useCart } from '../state/cart'
import { useCheckout } from '../state/checkout'
import l from '../loja.module.css'
import s from './Sacola.module.css'

export const fulfillmentOptions: { value: Fulfillment; label: string }[] = [
  { value: 'delivery', label: 'Entrega' },
  { value: 'pickup', label: 'Retirar na loja' },
]

export function Sacola() {
  const { lines, setQuantity, subtotalCents } = useCart()
  const { draft, update, feeCents, windowsFor } = useCheckout()
  const delivery = draft.fulfillment === 'delivery'

  if (lines.length === 0) {
    return (
      <div className={`${l.screen} ${l.narrow}`}>
        <TopBar title="Sacola" back="history" cart={false} />
        <EmptyState
          bare
          icon="sacola"
          title="Sua sacola está vazia"
          text="Os produtos que você adicionar aparecem aqui."
          action={<ButtonLink to="/">Ver produtos</ButtonLink>}
        />
      </div>
    )
  }

  const changeFulfillment = (f: Fulfillment) => update({ fulfillment: f, windowId: windowsFor(f)[0].id })

  return (
    <div className={`${l.screen} ${l.narrow}`}>
      <TopBar title="Sacola" back="history" cart={false} />
      <main className={`${l.main} ${l.mainTight}`}>
        <ul className={s.list} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {lines.map((line) => (
            <li key={line.productId} className={s.item}>
              <ProductPhoto className={s.thumb} label="" />
              <div className={s.itemText}>
                <Link to={`/produto/${line.productId}`} className={s.itemName} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {line.name}
                </Link>
                <div className={`${l.small} ${l.num}`}>
                  {line.sizeLabel} · {formatCents(line.unitPriceCents)}
                </div>
                <div className={s.itemTotal}>{formatCents(line.quantity * line.unitPriceCents)}</div>
              </div>
              <QuantityStepper
                label={`Quantidade de ${line.name}`}
                value={line.quantity}
                onChange={(q) => setQuantity(line.productId, q)}
              />
            </li>
          ))}
        </ul>

        <Link to="/" className={l.linkArrow} style={{ color: 'var(--cor-primaria)' }}>
          <Icon name="adicionar" size={18} />
          Adicionar mais produtos
        </Link>

        <div className={l.stack}>
          <div style={{ fontWeight: 600 }}>Como você quer receber?</div>
          <Segmented label="Como receber" options={fulfillmentOptions} value={draft.fulfillment} onChange={changeFulfillment} />
        </div>

        <Panel>
          <SummaryRow label="Subtotal" value={formatCents(subtotalCents)} />
          {/* H-L1 — taxa fixa mostrada já na sacola como estimada */}
          <SummaryRow
            label={delivery ? 'Entrega (estimada)' : 'Retirada na loja'}
            value={feeCents ? formatCents(feeCents) : 'Grátis'}
          />
          <SummaryTotal value={formatCents(subtotalCents + feeCents)} />
        </Panel>
        <p className={l.muted}>Você não precisa criar conta para comprar.</p>
      </main>
      <div className={l.footer}>
        <ButtonLink to="/checkout/identificacao" size="l" block spread>
          <span>Continuar</span>
          <span className={l.num}>{formatCents(subtotalCents + feeCents)}</span>
        </ButtonLink>
      </div>
    </div>
  )
}
