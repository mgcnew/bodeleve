import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Banner } from '@/components/Feedback'
import { RadioGroup, Segmented } from '@/components/Field'
import { formatCents } from '@/domain/money'
import { formatAddress, type Fulfillment } from '@/domain/order'
import { TopBar } from '../../components/LojaShell'
import { FeeLine, Place, StepProgress } from '../../components/Checkout'
import { useCheckout } from '../../state/checkout'
import { useEstablishment } from '../../state/storeInfo'
import { fulfillmentOptions } from '../Sacola'
import l from '../../loja.module.css'

export function Entrega() {
  const { draft, update, feeCents, windowsFor } = useCheckout()
  const establishment = useEstablishment()
  const navigate = useNavigate()
  const [missingAddress, setMissingAddress] = useState(false)
  const delivery = draft.fulfillment === 'delivery'
  const windows = windowsFor(draft.fulfillment)

  const changeFulfillment = (f: Fulfillment) => {
    setMissingAddress(false)
    update({ fulfillment: f, windowId: windowsFor(f)[0].id })
  }

  const next = () => {
    if (delivery && !draft.address) {
      setMissingAddress(true)
      return
    }
    navigate('/checkout/pagamento')
  }

  const addr = draft.address && formatAddress(draft.address)

  return (
    <div className={`${l.screen} ${l.narrow}`}>
      <TopBar title="Finalizar pedido" back="/checkout/identificacao" cart={false} />
      <main className={`${l.main} ${l.mainForm}`}>
        <StepProgress step={2} />
        <h1 className={l.h1}>Como você quer receber?</h1>
        <Segmented label="Como receber" options={fulfillmentOptions} value={draft.fulfillment} onChange={changeFulfillment} />

        {delivery ? (
          <div className={l.stack} style={{ gap: 16 }}>
            {addr ? (
              <Place
                action={
                  <Link to="/checkout/endereco" className={l.linkInline}>
                    Trocar
                  </Link>
                }
              >
                <div style={{ fontWeight: 600 }}>{addr.line1}</div>
                <div className={l.muted}>{addr.line2}</div>
              </Place>
            ) : (
              <Place
                action={
                  <Link to="/checkout/endereco" className={l.linkInline}>
                    Adicionar
                  </Link>
                }
              >
                <div style={{ fontWeight: 600 }}>Endereço de entrega</div>
                <div className={l.muted}>Informe onde vamos entregar.</div>
              </Place>
            )}
            {missingAddress && <Banner tone="error">Adicione o endereço de entrega para continuar.</Banner>}
            <RadioGroup
              legend="Quando entregar?"
              name="quando"
              value={draft.windowId}
              onChange={(windowId) => update({ windowId })}
              options={windows.map((w) => ({ value: w.id, title: w.title, sub: w.sub }))}
            />
            <FeeLine label="Taxa de entrega" value={formatCents(feeCents)} />
          </div>
        ) : (
          <div className={l.stack} style={{ gap: 16 }}>
            <Place>
              <div style={{ fontWeight: 600 }}>{establishment.name}</div>
              <div className={l.muted}>
                {establishment.address}
                <br />
                {establishment.hours}
              </div>
            </Place>
            <RadioGroup
              legend="Quando retirar?"
              name="quandor"
              value={draft.windowId}
              onChange={(windowId) => update({ windowId })}
              options={windows.map((w) => ({ value: w.id, title: w.title, sub: w.sub }))}
            />
            <FeeLine label="Retirada na loja" value="Grátis" free />
          </div>
        )}
      </main>
      <div className={l.footer}>
        <Button size="l" block onClick={next}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
