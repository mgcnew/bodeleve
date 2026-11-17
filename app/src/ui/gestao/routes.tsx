import type { RouteObject } from 'react-router-dom'
import { GestaoShell, type GestaoHandle } from './GestaoShell'
import { Entrar } from './screens/Entrar'
import { EsqueciSenha } from './screens/EsqueciSenha'
import { RedefinirSenha } from './screens/RedefinirSenha'
import { Inicio } from './screens/Inicio'
import { Mais } from './screens/Mais'
import { Pedido } from './screens/Pedido'
import { Pedidos } from './screens/Pedidos'
import { Compra } from './screens/compras/Compra'
import { CompraNova } from './screens/compras/CompraNova'
import { Compras } from './screens/compras/Compras'
import { Fornecedor } from './screens/compras/Fornecedor'
import { Fornecedores } from './screens/compras/Fornecedores'
import { FornecedorForm } from './screens/compras/FornecedorForm'
import { Entregadores } from './screens/relacionamento/Entregadores'
import { Perfil } from './screens/sistema/Perfil'
import { Recebimento } from './screens/compras/Recebimento'
import { Ajuste } from './screens/estoque/Ajuste'
import { Estoque } from './screens/estoque/Estoque'
import { Inventario } from './screens/estoque/Inventario'
import { Item } from './screens/estoque/Item'
import { Movimentacoes } from './screens/estoque/Movimentacoes'
import { Categorias } from './screens/catalogo/Categorias'
import { Produto } from './screens/catalogo/Produto'
import { Produtos } from './screens/catalogo/Produtos'
import { Baixa } from './screens/financeiro/Baixa'
import { Contas } from './screens/financeiro/Contas'
import { Financeiro } from './screens/financeiro/Financeiro'
import { Lancamentos } from './screens/financeiro/Lancamentos'
import { Casa } from './screens/sistema/Casa'
import { Configuracoes } from './screens/sistema/Configuracoes'
import { Equipe } from './screens/sistema/Equipe'
import { RelatorioVendas } from './screens/sistema/RelatorioVendas'
import { Relatorios } from './screens/sistema/Relatorios'
import { Atribuir } from './screens/relacionamento/Atribuir'
import { Cliente } from './screens/relacionamento/Cliente'
import { Clientes } from './screens/relacionamento/Clientes'
import { Entregas } from './screens/relacionamento/Entregas'
import { Ficha } from './screens/producao/Ficha'
import { Fichas } from './screens/producao/Fichas'
import { Ordem } from './screens/producao/Ordem'
import { Producao } from './screens/producao/Producao'

const tabs: GestaoHandle = { tabs: true }

// A — Gestão (36 telas)
export const gestaoRoutes: RouteObject[] = [
  { path: '/gestao/entrar', element: <Entrar /> },
  { path: '/gestao/esqueci-senha', element: <EsqueciSenha /> },
  { path: '/gestao/redefinir-senha', element: <RedefinirSenha /> },
  {
    path: '/gestao',
    element: <GestaoShell />,
    children: [
      { index: true, element: <Inicio />, handle: tabs },
      { path: 'pedidos', element: <Pedidos />, handle: tabs },
      { path: 'pedidos/:id', element: <Pedido /> },
      { path: 'mais', element: <Mais />, handle: tabs },
      { path: 'estoque', element: <Estoque />, handle: tabs },
      { path: 'estoque/ajuste', element: <Ajuste /> },
      { path: 'estoque/inventario', element: <Inventario /> },
      { path: 'estoque/:id', element: <Item /> },
      { path: 'estoque/:id/movimentacoes', element: <Movimentacoes /> },
      { path: 'financeiro', element: <Financeiro />, handle: tabs },
      { path: 'financeiro/contas', element: <Contas /> },
      { path: 'financeiro/contas/:id', element: <Baixa /> },
      { path: 'financeiro/lancamentos', element: <Lancamentos /> },
      { path: 'compras', element: <Compras /> },
      { path: 'compras/nova', element: <CompraNova /> },
      { path: 'compras/:id', element: <Compra /> },
      { path: 'compras/:id/receber', element: <Recebimento /> },
      { path: 'fornecedores', element: <Fornecedores /> },
      { path: 'fornecedores/novo', element: <FornecedorForm /> },
      { path: 'fornecedores/:id', element: <Fornecedor /> },
      { path: 'fornecedores/:id/editar', element: <FornecedorForm /> },
      { path: 'producao', element: <Producao /> },
      { path: 'producao/fichas', element: <Fichas /> },
      { path: 'producao/fichas/:id', element: <Ficha /> },
      { path: 'producao/ordens/:id', element: <Ordem /> },
      { path: 'produtos', element: <Produtos /> },
      { path: 'produtos/categorias', element: <Categorias /> },
      { path: 'produtos/:id', element: <Produto /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'clientes/:id', element: <Cliente /> },
      { path: 'entregas', element: <Entregas /> },
      { path: 'entregas/atribuir/:id', element: <Atribuir /> },
      { path: 'entregas/entregadores', element: <Entregadores /> },
      { path: 'relatorios', element: <Relatorios /> },
      { path: 'relatorios/vendas', element: <RelatorioVendas /> },
      { path: 'configuracoes', element: <Configuracoes /> },
      { path: 'configuracoes/casa', element: <Casa /> },
      { path: 'configuracoes/equipe', element: <Equipe /> },
      { path: 'perfil', element: <Perfil /> },
    ],
  },
]
