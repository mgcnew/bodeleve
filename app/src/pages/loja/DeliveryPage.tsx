import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppLink, Banner, Button, Icon, Segmented } from '@/components'
import { storefront } from '@/config/storefront'
import { addressLine, validateAddress } from '@/domain/checkout'
import { formatBRL } from '@/lib/format'
import { useBag, useCheckout } from '@/store/bag'
import { useStoreContent } from '@/ui/loja/queries'
import { Footer, RadioCard, ScreenHeader, StepProgress } from '@/ui/loja/parts'
import s from '@/ui/loja/loja.module.css'

export function DeliveryPage() {
  const navigate = useNavigate()
  const empty = useBag((b) => Object.keys(b.items).length === 0)
  const fulfillment = useBag((b) => b.fulfillment)
  const setFulfillment = useBag((b) => b.setFulfillment)
  const { address, deliveryWindowId, pickupWindowId, setDeliveryWindow, setPickupWindow } = useCheckout()
  const content = useStoreContent()
  const [tried, setTried] = useState(false)
  const delivery = fulfillment === 'delivery'
  const hasAddress = Object.keys(validateAddress(address)).length === 0

  if (empty) return <Navigate to="/sacola" replace />

  const next = () => {
    if (delivery && !hasAddress) {
      setTried(true)
      return
    }
    navigate('/finalizar/pagamento')
  }

  return (
    <>
      <ScreenHeader title="Finalizar pedido" back="/finalizar/identificacao" />
      <main className={`${s.main} ${s.narrow}`}>
        <StepProgress step={2} title="Entrega" />
        <h1 className={s.h1}>Como você quer receber?</h1>
        <Segmented
          label="Como receber"
          value={fulfillment}
          onChange={setFulfillment}
          options={[{ value: 'delivery', label: 'Entrega' }, { value: 'pickup', label: 'Retirar na loja' }]}
        />

        {delivery ? (
          <div className={s.stack} style={{ gap: 16 }}>
            <div className={`${s.card} ${s.cardRow}`}>
              <Icon name="local" size={22} />
              <div className={s.grow}>
                {hasAddress ? (
                  <>
                    <div className={s.strong}>{addressLine(address)}</div>
                    <div className={s.sub}>{address.district}</div>
                  </>
                ) : (
                  <div className={s.strong}>Nenhum endereço informado</div>
                )}
              </div>
              <AppLink href="/finalizar/endereco" className={s.link}>{hasAddress ? 'Trocar' : 'Informar'}</AppLink>
            </div>
            {tried && !hasAddress && <Banner tone="error">Informe o endereço de entrega para continuar.</Banner>}

            <fieldset className={s.fieldset}>
              <legend className={s.legend}>Quando entregar?</legend>
              {storefront.deliveryWindows.map((w) => (
                <RadioCard key={w.id} name="quando" value={w.id} checked={deliveryWindowId === w.id} onChange={setDeliveryWindow} title={w.label} detail={w.detail} />
              ))}
            </fieldset>

            <div className={`${s.card} ${s.spread}`}>
              <span>Taxa de entrega</span>
              <b className={s.tabular}>{formatBRL(storefront.deliveryFeeCents)}</b>
            </div>
          </div>
        ) : (
          <div className={s.stack} style={{ gap: 16 }}>
            <div className={`${s.card} ${s.cardRow}`}>
              <Icon name="local" size={22} />
              <div>
                <div className={s.strong}>Bodeleve</div>
                <div className={s.sub}>{content.data?.address}<br />{content.data?.hours}</div>
              </div>
            </div>
            <fieldset className={s.fieldset}>
              <legend className={s.legend}>Quando retirar?</legend>
              {storefront.pickupWindows.map((w) => (
                <RadioCard key={w.id} name="quandor" value={w.id} checked={pickupWindowId === w.id} onChange={setPickupWindow} title={w.label} detail={w.detail} />
              ))}
            </fieldset>
            <div className={`${s.card} ${s.spread}`}>
              <span>Retirada na loja</span>
              <b>Grátis</b>
            </div>
          </div>
        )}
      </main>
      <Footer>
        <Button size="lg" fullWidth onClick={next}>Continuar</Button>
      </Footer>
    </>
  )
}
