import type { Role } from './roles'

// H-G27 — acesso por módulo para cada papel fixo (hipótese; sem permissão por pessoa)
export type Module =
  | 'inicio'
  | 'pedidos'
  | 'estoque'
  | 'financeiro'
  | 'compras'
  | 'fornecedores'
  | 'producao'
  | 'produtos'
  | 'clientes'
  | 'entregas'
  | 'relatorios'
  | 'configuracoes'

const all: Module[] = ['inicio', 'pedidos', 'estoque', 'financeiro', 'compras', 'fornecedores', 'producao', 'produtos', 'clientes', 'entregas', 'relatorios', 'configuracoes']

export const moduleAccess: Record<Role, Module[]> = {
  owner: all,
  manager: all.filter((m) => m !== 'configuracoes'),
  clerk: ['inicio', 'pedidos'],
  production: ['inicio', 'estoque', 'producao'],
  courier: [],
}

export function canAccess(role: Role, module: Module) {
  return moduleAccess[role].includes(module)
}
