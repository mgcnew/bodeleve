import { access, moduleLabel, roleLabel, type Module, type Role } from '@/permissions'

/** Configurações da casa e da equipe. */

export type House = {
  name: string
  cnpj: string
  address: string
  whatsapp: string
  hours: { weekdays: string; saturday: string; sunday: string }
}

export const emptyHouse: House = { name: 'Bodeleve', cnpj: '', address: '', whatsapp: '', hours: { weekdays: '', saturday: '', sunday: '' } }

export type HouseErrors = Partial<Record<'name' | 'cnpj' | 'whatsapp', string>>

const digits = (s: string) => s.replace(/\D/g, '')

export function validateHouse(h: House): HouseErrors {
  const e: HouseErrors = {}
  if (!h.name.trim()) e.name = 'Informe o nome da casa.'
  if (h.cnpj.trim() && digits(h.cnpj).length !== 14) e.cnpj = 'O CNPJ tem 14 números. Confira e tente de novo.'
  if (h.whatsapp.trim() && ![10, 11].includes(digits(h.whatsapp).length)) e.whatsapp = 'Use o DDD e o número, por exemplo (00) 90000-0000.'
  return e
}

export const cleanHouse = (h: House): House => ({
  name: h.name.trim(),
  cnpj: h.cnpj.trim(),
  address: h.address.trim(),
  whatsapp: h.whatsapp.trim(),
  hours: { weekdays: h.hours.weekdays.trim(), saturday: h.hours.saturday.trim(), sunday: h.hours.sunday.trim() },
})

/** Texto de horário que a loja mostra: só o que foi preenchido; vazio se nada foi. */
export function hoursText(h: House['hours']): string {
  const parts: string[] = []
  if (h.weekdays) parts.push(`Segunda a sexta: ${h.weekdays}`)
  if (h.saturday) parts.push(`Sábado: ${h.saturday}`)
  if (h.sunday) parts.push(`Domingo: ${h.sunday}`)
  return parts.join(' · ')
}

export type TeamMember = {
  id: string
  name: string
  email: string
  role: Role
  /** "Balcão", "Cozinha", "Próprio"; para convite pendente, o aviso. */
  note: string
  pending?: boolean
}

export const invitableRoles: Role[] = ['clerk', 'manager', 'production', 'courier']

export type InviteError = 'invalid_email' | 'duplicate' | 'invalid_role'

export function checkInvite(email: string, role: Role, team: TeamMember[]): InviteError | null {
  const e = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'invalid_email'
  if (!invitableRoles.includes(role)) return 'invalid_role'
  if (team.some((m) => m.email.toLowerCase() === e)) return 'duplicate'
  return null
}

export const rolesInUse = (team: TeamMember[]) => new Set(team.map((m) => m.role)).size

export type MatrixRow = { module: Module; label: string; allowed: boolean }

export const roleMatrix = (role: Role): MatrixRow[] =>
  (Object.keys(moduleLabel) as Module[]).map((m) => ({ module: m, label: moduleLabel[m], allowed: access[role].includes(m) }))

export const roleOrder: Role[] = ['owner', 'manager', 'clerk', 'production', 'courier']
export { roleLabel }

/** Senha de gestor para cancelar venda no balcão: 4 a 8 números. */
export const PIN_RULE = /^\d{4,8}$/
export type PinError = 'format' | 'mismatch'
export function checkPin(pin: string, again: string): PinError | null {
  if (!PIN_RULE.test(pin)) return 'format'
  return pin === again ? null : 'mismatch'
}
