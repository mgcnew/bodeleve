import type { RouteObject } from 'react-router-dom'
import { EnvLayout } from '@/components/EnvLayout'
import { Placeholder } from '@/components/Placeholder'

const env = 'Gestão'

// A — Gestão: 5 destinos com "Mais" (P-D)
export const gestaoRoutes: RouteObject = {
  path: '/gestao',
  element: (
    <EnvLayout
      background="operacao"
      nav={[
        { to: '/gestao', label: 'Início', icon: 'inicio', end: true },
        { to: '/gestao/pedidos', label: 'Pedidos', icon: 'pedidos' },
        { to: '/gestao/estoque', label: 'Estoque', icon: 'estoque' },
        { to: '/gestao/financeiro', label: 'Financeiro', icon: 'financeiro' },
        { to: '/gestao/mais', label: 'Mais', icon: 'mais' },
      ]}
    />
  ),
  children: [
    { index: true, element: <Placeholder env={env} title="Início" design="Gestao-Inicio.dc.html" /> },
    { path: 'pedidos', element: <Placeholder env={env} title="Pedidos" design="Gestao-Pedidos.dc.html" /> },
    { path: 'estoque', element: <Placeholder env={env} title="Estoque" design="Gestao-Estoque.dc.html" /> },
    { path: 'financeiro', element: <Placeholder env={env} title="Financeiro" design="Gestao-Financeiro.dc.html" /> },
    { path: 'mais', element: <Placeholder env={env} title="Mais" design="Gestao-Mais.dc.html" /> },
  ],
}
