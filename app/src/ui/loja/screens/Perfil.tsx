import { ButtonLink } from '@/components/Button'
import { Box, RowLink } from '@/components/Card'
import { useEstablishment } from '../state/storeInfo'
import { PageHeader } from '../components/LojaShell'
import { useCheckout } from '../state/checkout'
import l from '../loja.module.css'

export function Perfil() {
  const establishment = useEstablishment()
  const { draft } = useCheckout()
  const addr = draft.address ? `${draft.address.street}, ${draft.address.number}` : 'Nenhum endereço salvo'

  return (
    <div className={l.screen}>
      <PageHeader title="Perfil" />
      <main className={l.main} style={{ gap: 20 }}>
        <div className={l.card} style={{ padding: 20, borderRadius: 'var(--raio-folha)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h2 className={l.h2}>Você está comprando sem conta</h2>
            <p className={l.muted}>Com uma conta você vê seus pedidos em qualquer aparelho e pede de novo em um toque.</p>
          </div>
          <ButtonLink to="/entrar" block>
            Entrar ou criar conta
          </ButtonLink>
        </div>
        <Box>
          <RowLink icon="pedidos" title="Meus pedidos" sub="Acompanhar e pedir de novo" to="/pedidos" />
          <RowLink icon="local" title="Endereço de entrega" sub={addr} to="/checkout/endereco" />
        </Box>
        <Box>
          <RowLink icon="vender" title="Linha Bodeleve" sub="Produtos com a marca da casa" to="/linha" />
          <RowLink icon="inicio" title="Sobre a Bodeleve" sub="A casa, o que produz e onde fica" to="/sobre" />
        </Box>
        <p className={l.muted}>
          Atendimento: {establishment.whatsapp} · {establishment.hours}
        </p>
      </main>
    </div>
  )
}
