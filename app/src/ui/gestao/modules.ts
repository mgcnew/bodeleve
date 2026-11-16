import type { IconName } from '@/components'
import { catalogModule, customersModule, type Module } from '@/permissions'

/** Todo item de navegação da Gestão, com o módulo de permissão que o libera. Fonte única para menu lateral, "Mais" e abas. */
export type GestaoEntry = {
  key: string
  label: string
  detail: string
  icon: IconName
  to: string
  module: Module
  group: 'Balcão' | 'Abastecer' | 'Catálogo' | 'Relacionamento' | 'Análise' | 'Sistema' | 'Principal'
}

export const entries: GestaoEntry[] = [
  { key: 'inicio', label: 'Início', detail: 'O que pede ação hoje', icon: 'inicio', to: '/gestao', module: 'dashboard', group: 'Principal' },
  { key: 'pedidos', label: 'Vendas e pedidos', detail: 'Loja e balcão, do dia', icon: 'pedidos', to: '/gestao/pedidos', module: 'orders', group: 'Principal' },
  { key: 'estoque', label: 'Estoque', detail: 'Saldos, lotes e validades', icon: 'estoque', to: '/gestao/estoque', module: 'stock', group: 'Principal' },
  { key: 'financeiro', label: 'Financeiro', detail: 'Caixa, contas a pagar e a receber', icon: 'financeiro', to: '/gestao/financeiro', module: 'finance', group: 'Principal' },
  { key: 'pdv', label: 'PDV (balcão)', detail: 'Vender, vendas do dia e caixa', icon: 'caixa', to: '/pdv', module: 'pos', group: 'Balcão' },
  { key: 'compras', label: 'Compras', detail: 'Pedidos de compra e recebimento', icon: 'compras', to: '/gestao/compras', module: 'purchasing', group: 'Abastecer' },
  { key: 'fornecedores', label: 'Fornecedores', detail: 'Contatos e histórico de compras', icon: 'entregas', to: '/gestao/fornecedores', module: 'purchasing', group: 'Abastecer' },
  { key: 'producao', label: 'Produção', detail: 'Fichas técnicas e ordens de produção', icon: 'producao', to: '/gestao/producao', module: 'production', group: 'Abastecer' },
  { key: 'produtos', label: 'Produtos e categorias', detail: 'Preço, origem, publicação na loja', icon: 'vender', to: '/gestao/produtos', module: catalogModule, group: 'Catálogo' },
  { key: 'clientes', label: 'Clientes', detail: 'Histórico e contato', icon: 'perfil', to: '/gestao/clientes', module: customersModule, group: 'Relacionamento' },
  { key: 'entregas', label: 'Entregas', detail: 'Atribuir e acompanhar entregadores', icon: 'local', to: '/gestao/entregas', module: 'deliveries', group: 'Relacionamento' },
  { key: 'relatorios', label: 'Relatórios', detail: 'Vendas, estoque, financeiro', icon: 'historico', to: '/gestao/relatorios', module: 'dashboard', group: 'Análise' },
  { key: 'configuracoes', label: 'Configurações', detail: 'Casa, equipe e permissões', icon: 'mais', to: '/gestao/configuracoes', module: 'team', group: 'Sistema' },
]

export const groupsInOrder: GestaoEntry['group'][] = ['Balcão', 'Abastecer', 'Catálogo', 'Relacionamento', 'Análise', 'Sistema']

/** Abas da barra inferior no celular (P-D: 5 abas, a última é "Mais"). */
export const tabKeys = ['inicio', 'pedidos', 'estoque', 'financeiro'] as const

/** Primeira tela que a pessoa pode usar depois de entrar. */
export function homeFor(can: (m: Module) => boolean): string {
  return entries.find((e) => can(e.module))?.to ?? '/gestao/mais'
}
