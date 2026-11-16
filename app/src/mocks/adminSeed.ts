import type { Role } from '@/permissions'

/** Equipe de EXEMPLO (quadro "Equipe e permissões"). Em desenvolvimento a senha de todos é a mesma. */
export const MOCK_ADMIN_PASSWORD = 'bodeleve'

export const adminUsers: Array<{ id: string; name: string; email: string; role: Role }> = [
  { id: 'u-dono', name: '[NOME DO DONO]', email: 'dono@exemplo.com', role: 'owner' },
  { id: 'u-ana', name: 'Ana', email: 'ana@exemplo.com', role: 'manager' },
  { id: 'u-julia', name: 'Júlia', email: 'julia@exemplo.com', role: 'clerk' },
  { id: 'u-raimundo', name: 'Seu Raimundo', email: 'raimundo@exemplo.com', role: 'production' },
  { id: 'u-carlos', name: 'Carlos', email: 'carlos@exemplo.com', role: 'courier' },
  { id: 'u-bruno', name: 'Bruno', email: 'bruno@exemplo.com', role: 'courier' },
]

/**
 * Parte do Início que ainda não vem de módulo próprio. Estes valores são de EXEMPLO e passam a ser calculados quando
 * o PDV (Etapa 5) existir. Estoque, Produção e Financeiro já são calculados. Estoque baixo e lotes vencendo já são calculados.
 */
export const dashboardSeed = {
  counterSales: { count: 26, cents: 89200 },
  yesterdayUntilNowCents: 110200,
}

/** Detalhe de cada pessoa na lista da equipe (o e-mail aparece para quem gerencia). */
export const teamNotes: Record<string, string> = {
  'u-dono': '',
  'u-ana': 'ana@exemplo.com',
  'u-julia': 'Balcão',
  'u-raimundo': 'Cozinha',
  'u-carlos': 'Próprio',
  'u-bruno': 'Próprio',
}
