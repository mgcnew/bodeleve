import type { Role } from '@/permissions'
import type { DashboardAlert } from '@/services/types'

/** Equipe de EXEMPLO (quadro "Equipe e permissões"). Em desenvolvimento a senha de todos é a mesma. */
export const MOCK_ADMIN_PASSWORD = 'bodeleve'

export const adminUsers: Array<{ id: string; name: string; email: string; role: Role }> = [
  { id: 'u-dono', name: '[NOME DO DONO]', email: 'dono@exemplo.com', role: 'owner' },
  { id: 'u-ana', name: 'Ana', email: 'ana@exemplo.com', role: 'manager' },
  { id: 'u-julia', name: 'Júlia', email: 'julia@exemplo.com', role: 'clerk' },
  { id: 'u-raimundo', name: 'Seu Raimundo', email: 'raimundo@exemplo.com', role: 'production' },
  { id: 'u-carlos', name: 'Carlos', email: 'carlos@exemplo.com', role: 'courier' },
]

/**
 * Parte do Início que ainda não vem de módulo próprio. Estes valores são de EXEMPLO e passam a ser calculados quando
 * Financeiro (lote 5), Estoque (lote 3), Produção (lote 4) e PDV (Etapa 5) existirem.
 */
export const dashboardSeed = {
  counterSales: { count: 26, cents: 89200 },
  yesterdayUntilNowCents: 110200,
  inProduction: { count: 2, detail: 'Queijo coalho · Doce de leite' },
  payableToday: { cents: 64000, count: 2 },
  receivableWeek: { cents: 115000, detail: 'cartões e fiado' },
  alerts: [
    { id: 'rent', icon: 'alerta', title: 'Aluguel atrasado', detail: 'Venceu em 10/11 · R$ 1.800,00', href: '/gestao/financeiro/pagar' },
    { id: 'due', icon: 'financeiro', title: '2 contas vencem hoje', detail: 'R$ 640,00 · Laticínios Serra Verde e energia', href: '/gestao/financeiro/contas' },
    { id: 'lots', icon: 'validade', title: '3 lotes vencem em até 7 dias', detail: 'Queijo coalho, Doce de leite, Nata', href: '/gestao/estoque' },
    { id: 'low', icon: 'estoque', title: '7 itens com estoque baixo', detail: 'Tapioca granulada, Rapadura e mais 5', href: '/gestao/estoque' },
  ] satisfies DashboardAlert[],
}
