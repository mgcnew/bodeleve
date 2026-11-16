import type { RouteObject } from 'react-router-dom'
import { Placeholder } from '@/components/Placeholder'
import { GestaoShell, type GestaoHandle } from './GestaoShell'
import { Entrar } from './screens/Entrar'
import { Inicio } from './screens/Inicio'
import { Mais } from './screens/Mais'
import { Pedido } from './screens/Pedido'
import { Pedidos } from './screens/Pedidos'
import { Compra } from './screens/compras/Compra'
import { CompraNova } from './screens/compras/CompraNova'
import { Compras } from './screens/compras/Compras'
import { Fornecedor } from './screens/compras/Fornecedor'
import { Fornecedores } from './screens/compras/Fornecedores'
import { Recebimento } from './screens/compras/Recebimento'

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
      { path: 'compras', element: <Compras /> },
      { path: 'compras/nova', element: <CompraNova /> },
      { path: 'compras/:id', element: <Compra /> },
      { path: 'compras/:id/receber', element: <Recebimento /> },
      { path: 'fornecedores', element: <Fornecedores /> },
      { path: 'fornecedores/:id', element: <Fornecedor /> },
      { path: 'producao/*', element: todo('Produção', 'Gestao-Producao.dc.html') },
      { path: 'produtos/*', element: todo('Produtos', 'Gestao-Produtos.dc.html') },
      { path: 'clientes/*', element: todo('Clientes', 'Gestao-Clientes.dc.html') },
      { path: 'entregas/*', element: todo('Entregas', 'Gestao-Entregas.dc.html') },
      { path: 'relatorios/*', element: todo('Relatórios', 'Gestao-Relatorios.dc.html') },
      { path: 'configuracoes/*', element: todo('Configurações', 'Gestao-Configuracoes.dc.html') },
    ],
  },
]
