import type { RouteObject } from 'react-router-dom'
import { LojaShell, type LojaHandle } from './components/LojaShell'
import { Buscar } from './screens/Buscar'
import { Categoria } from './screens/Categoria'
import { Entrar } from './screens/Entrar'
import { Inicio } from './screens/Inicio'
import { Linha } from './screens/Linha'
import { Perfil } from './screens/Perfil'
import { Produto } from './screens/Produto'
import { Sacola } from './screens/Sacola'
import { Sobre } from './screens/Sobre'
import { Endereco } from './screens/checkout/Endereco'
import { Entrega } from './screens/checkout/Entrega'
import { RequireCart } from './screens/checkout/guard'
import { Identificacao } from './screens/checkout/Identificacao'
import { Pagamento } from './screens/checkout/Pagamento'
import { Revisao } from './screens/checkout/Revisao'
import { Confirmado } from './screens/pedidos/Confirmado'
import { Pedido } from './screens/pedidos/Pedido'
import { Pedidos } from './screens/pedidos/Pedidos'

const tabs: LojaHandle = { tabs: true }
const tabsAndCart: LojaHandle = { tabs: true, cartBar: true }

// C — Loja online (18 telas). Catálogo público, checkout sem conta (D5, P-H).
export const lojaRoutes: RouteObject = {
  path: '/',
  element: <LojaShell />,
  children: [
    { index: true, element: <Inicio />, handle: tabsAndCart },
    { path: 'buscar', element: <Buscar />, handle: tabs },
    { path: 'categoria/:id', element: <Categoria />, handle: tabsAndCart },
    { path: 'pedidos', element: <Pedidos />, handle: tabs },
    { path: 'perfil', element: <Perfil />, handle: tabs },
    { path: 'produto/:id', element: <Produto /> },
    { path: 'linha', element: <Linha /> },
    { path: 'sobre', element: <Sobre /> },
    { path: 'sacola', element: <Sacola /> },
    { path: 'entrar', element: <Entrar /> },
    {
      path: 'checkout',
      children: [
        { path: 'identificacao', element: <RequireCart><Identificacao /></RequireCart> },
        { path: 'entrega', element: <RequireCart><Entrega /></RequireCart> },
        { path: 'endereco', element: <Endereco /> },
        { path: 'pagamento', element: <RequireCart><Pagamento /></RequireCart> },
        { path: 'revisao', element: <RequireCart><Revisao /></RequireCart> },
      ],
    },
    { path: 'pedidos/:id', element: <Pedido /> },
    { path: 'pedidos/:id/confirmado', element: <Confirmado /> },
  ],
}
