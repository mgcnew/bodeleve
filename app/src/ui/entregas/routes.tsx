import type { RouteObject } from 'react-router-dom'
import { EnvLayout } from '@/components/EnvLayout'
import { Placeholder } from '@/components/Placeholder'

const env = 'Entregas'

// D — Entregas: 3 destinos (P-D)
export const entregasRoutes: RouteObject = {
  path: '/entregas',
  element: (
    <EnvLayout
      background="operacao"
      nav={[
        { to: '/entregas', label: 'Entregas', icon: 'entregas', end: true },
        { to: '/entregas/historico', label: 'Histórico', icon: 'historico' },
        { to: '/entregas/perfil', label: 'Perfil', icon: 'perfil' },
      ]}
    />
  ),
  children: [
    { index: true, element: <Placeholder env={env} title="Entregas" design="Ent-Lista.dc.html" /> },
    { path: 'historico', element: <Placeholder env={env} title="Histórico" design="Ent-Historico.dc.html" /> },
    { path: 'perfil', element: <Placeholder env={env} title="Perfil" design="Ent-Perfil.dc.html" /> },
  ],
}
