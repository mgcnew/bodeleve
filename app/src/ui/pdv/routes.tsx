import type { RouteObject } from 'react-router-dom'
import { EnvLayout } from '@/components/EnvLayout'
import { Placeholder } from '@/components/Placeholder'

const env = 'PDV'

// B — PDV: 3 destinos (P-D)
export const pdvRoutes: RouteObject = {
  path: '/pdv',
  element: (
    <EnvLayout
      background="operacao"
      nav={[
        { to: '/pdv', label: 'Vender', icon: 'vender', end: true },
        { to: '/pdv/vendas', label: 'Vendas', icon: 'historico' },
        { to: '/pdv/caixa', label: 'Caixa', icon: 'caixa' },
      ]}
    />
  ),
  children: [
    { index: true, element: <Placeholder env={env} title="Vender" design="PDV-Vender.dc.html" /> },
    { path: 'vendas', element: <Placeholder env={env} title="Vendas" design="PDV-Vendas.dc.html" /> },
    { path: 'caixa', element: <Placeholder env={env} title="Caixa" design="PDV-Caixa.dc.html" /> },
  ],
}
