import { Link } from 'react-router-dom'
import { Box } from '@/components/Card'
import { Banner } from '@/components/Feedback'
import { hypotheses } from '@/config/hypotheses'
import { hasWhatsapp } from '@/services/gestao/purchases'
import { establishmentStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar, ListRow } from '../../../shared/OpsBits'

/** Como a loja online recebe pedidos hoje (D19). Só leitura: o número se muda em Dados da casa. */
export function Loja() {
  const { whatsapp } = establishmentStore.useStore()
  const ok = hasWhatsapp(whatsapp)
  const whatsappMode = hypotheses.checkoutMode === 'whatsapp'
  return (
    <div className={o.screen}>
      <Bar title="Loja online" back="/gestao/configuracoes" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        {whatsappMode &&
          (ok ? (
            <Banner tone="success">Pedidos por WhatsApp ligados. Os clientes enviam o pedido para {whatsapp}.</Banner>
          ) : (
            <Banner tone="warning">
              O número do WhatsApp ainda não foi cadastrado, então a loja não consegue receber pedidos.{' '}
              <Link to="/gestao/configuracoes/casa" style={{ fontWeight: 600 }}>
                Cadastrar agora
              </Link>
            </Banner>
          ))}
        <Box>
          <ListRow title="Como o cliente pede" sub={whatsappMode ? 'Escolhe os itens e envia o pedido por escrito para o WhatsApp da casa' : 'Checkout completo, com entrega e pagamento'} />
          <ListRow title="Recebimento" sub={whatsappMode ? 'Só retirada na loja. Entrega, quando pedida, é combinada na conversa' : 'Entrega ou retirada'} />
          <ListRow title="Pagamento" sub={whatsappMode ? 'Na retirada' : 'Pix, cartão ou dinheiro'} />
          <ListRow title="Nota fiscal" sub="Ainda não configurado" />
        </Box>
        <p className={o.muted}>O pedido fica salvo em Pedidos antes de abrir o WhatsApp. Entrega e pagamento online ficam guardados para quando a casa crescer.</p>
      </main>
    </div>
  )
}
