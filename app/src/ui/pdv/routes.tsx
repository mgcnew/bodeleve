import type { RouteObject } from 'react-router-dom'
import { PdvShell, type PdvHandle } from './PdvShell'
import { Abertura } from './screens/Abertura'
import { Caixa } from './screens/Caixa'
import { Combinado } from './screens/Combinado'
import { Concluida } from './screens/Concluida'
import { Pagamento } from './screens/Pagamento'
import { Sacola } from './screens/Sacola'
import { Vender } from './screens/Vender'
import { Venda } from './screens/Venda'
import { Vendas } from './screens/Vendas'

const tabs: PdvHandle = { tabs: true }
const tabsAndCart: PdvHandle = { tabs: true, cartBar: true }

// B — PDV (12 telas em 9 quadros: peso, desconto e sangria são folhas dentro de Vender, Sacola e Caixa)
export const pdvRoutes: RouteObject = {
  path: '/pdv',
  element: <PdvShell />,
  children: [
    { index: true, element: <Vender />, handle: tabsAndCart },
    { path: 'abertura', element: <Abertura /> },
    { path: 'sacola', element: <Sacola /> },
    { path: 'pagamento', element: <Pagamento /> },
    { path: 'combinado', element: <Combinado /> },
    { path: 'concluida/:id', element: <Concluida /> },
    { path: 'vendas', element: <Vendas />, handle: tabs },
    { path: 'vendas/:id', element: <Venda /> },
    { path: 'caixa', element: <Caixa />, handle: tabs },
  ],
}
