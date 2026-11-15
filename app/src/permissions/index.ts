/**
 * Papéis fixos e acesso por módulo (H-G27; quadro "Equipe e permissões").
 * Esta é a regra da interface. Quando o Supabase entrar (D19), a mesma matriz vira política RLS: a tela esconder algo
 * nunca é a proteção, só a conveniência.
 */
export type Role = 'owner' | 'manager' | 'clerk' | 'production' | 'courier'

export type Module = 'dashboard' | 'orders' | 'pos' | 'stock' | 'purchasing' | 'production' | 'finance' | 'deliveries' | 'team'

export const roleLabel: Record<Role, string> = {
  owner: 'Dono',
  manager: 'Gestor',
  clerk: 'Atendente',
  production: 'Produção',
  courier: 'Entregador',
}

export const moduleLabel: Record<Module, string> = {
  dashboard: 'Início e relatórios',
  orders: 'Pedidos',
  pos: 'PDV (balcão)',
  stock: 'Estoque',
  purchasing: 'Compras',
  production: 'Produção',
  finance: 'Financeiro',
  deliveries: 'Entregas',
  team: 'Equipe e configurações',
}

const all: Module[] = ['dashboard', 'orders', 'pos', 'stock', 'purchasing', 'production', 'finance', 'deliveries', 'team']

export const access: Record<Role, readonly Module[]> = {
  owner: all,
  manager: all.filter((m) => m !== 'team'),
  clerk: ['orders', 'pos'],
  production: ['stock', 'production'],
  courier: ['deliveries'],
}

export function can(role: Role | null | undefined, module: Module): boolean {
  return !!role && access[role].includes(module)
}

/** Módulos do app de Gestão (o PDV e as Entregas têm app próprio). */
export const gestaoModules: Module[] = ['dashboard', 'orders', 'stock', 'purchasing', 'production', 'finance', 'deliveries', 'team']

/**
 * Hipótese H-I14: o quadro de permissões não cita Produtos nem Clientes. Produtos e categorias seguem "Estoque";
 * clientes seguem "Pedidos". A confirmar com o dono.
 */
export const catalogModule: Module = 'stock'
export const customersModule: Module = 'orders'
