// Cinco papéis fixos com acesso por módulo; sem permissão por pessoa (H-G27 — hipótese)

export const roles = ['owner', 'manager', 'clerk', 'production', 'courier'] as const
export type Role = (typeof roles)[number]

export const roleLabels: Record<Role, string> = {
  owner: 'Dono',
  manager: 'Gestor',
  clerk: 'Atendente',
  production: 'Produção',
  courier: 'Entregador',
}
