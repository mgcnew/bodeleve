import type { RouteObject } from 'react-router-dom'
import { Placeholder } from '@/components/Placeholder'
import { GestaoShell, type GestaoHandle } from './GestaoShell'
import { Entrar } from './screens/Entrar'
import { Inicio } from './screens/Inicio'
import { Mais } from './screens/Mais'
import { Pedido } from './screens/Pedido'
import { Pedidos } from './screens/Pedidos'

const env = 'Gestão'
const tabs: GestaoHandle = { tabs: true }
const todo = (title: string, design: string) => <Placeholder env={env} title={title} design={design} />

// A — Gestão (36 telas)
export const gestaoRoutes: RouteObject[] = [
  { path: '/gestao/entrar', element: <Entrar /> },
  {
    path: '/gestao',
    element: <GestaoShell />,
    children: [
      { index: true, element: <Inicio />, handle: tabs },
      { path: 'pedidos', element: <Pedidos />, handle: tabs },
      { path: 'pedidos/:id', element: <Pedido /> },
      { path: 'mais', element: <Mais />, handle: tabs },
      { path: 'estoque/*', element: todo('Estoque', 'Gestao-Estoque.dc.html'), handle: tabs },
      { path: 'financeiro/*', element: todo('Financeiro', 'Gestao-Financeiro.dc.html'), handle: tabs },
      { path: 'compras/*', element: todo('Compras', 'Gestao-Compras.dc.html') },
      { path: 'fornecedores/*', element: todo('Fornecedores', 'Gestao-Fornecedores.dc.html') },
      { path: 'producao/*', element: todo('Produção', 'Gestao-Producao.dc.html') },
      { path: 'produtos/*', element: todo('Produtos', 'Gestao-Produtos.dc.html') },
      { path: 'clientes/*', element: todo('Clientes', 'Gestao-Clientes.dc.html') },
      { path: 'entregas/*', element: todo('Entregas', 'Gestao-Entregas.dc.html') },
      { path: 'relatorios/*', element: todo('Relatórios', 'Gestao-Relatorios.dc.html') },
      { path: 'configuracoes/*', element: todo('Configurações', 'Gestao-Configuracoes.dc.html') },
    ],
  },
]
