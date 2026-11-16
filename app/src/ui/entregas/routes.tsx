import type { RouteObject } from 'react-router-dom'
import { EntregasShell, type EntHandle } from './EntregasShell'
import { Coleta } from './screens/Coleta'
import { Confirmacao } from './screens/Confirmacao'
import { Detalhe } from './screens/Detalhe'
import { Entrar } from './screens/Entrar'
import { Historico } from './screens/Historico'
import { Lista } from './screens/Lista'
import { Perfil } from './screens/Perfil'
import { Problema } from './screens/Problema'
import { Rota } from './screens/Rota'

const tabs: EntHandle = { tabs: true }

// D — Entregas (9 telas): entregador próprio ou parceiro
export const entregasRoutes: RouteObject[] = [
  { path: '/entregas/entrar', element: <Entrar /> },
  {
    path: '/entregas',
    element: <EntregasShell />,
    children: [
      { index: true, element: <Lista />, handle: tabs },
      { path: 'historico', element: <Historico />, handle: tabs },
      { path: 'perfil', element: <Perfil />, handle: tabs },
      { path: 'pedido/:id', element: <Detalhe /> },
      { path: 'pedido/:id/coleta', element: <Coleta /> },
      { path: 'pedido/:id/rota', element: <Rota /> },
      { path: 'pedido/:id/entrega', element: <Confirmacao /> },
      { path: 'pedido/:id/problema', element: <Problema /> },
    ],
  },
]
