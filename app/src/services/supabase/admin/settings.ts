import { storefront } from '@/config/storefront'
import { checkInvite, cleanHouse, rolesInUse, validateHouse, type House, type TeamMember } from '@/domain/settings'
import type { Role } from '@/permissions'
import type { SettingsService } from '@/services/types'
import type { AdminContext } from './context'

/** A casa e a equipe sobre o Supabase. O convite só registra a pessoa: quando ela cria a conta com o mesmo e-mail, o banco liga o papel sozinho (D21: nenhum e-mail sai). */
export function createSupabaseSettings(ctx: AdminContext): SettingsService {
  const { client } = ctx

  async function team(): Promise<TeamMember[]> {
    const est = await ctx.establishment()
    const { data, error } = await client.from('memberships').select('id, email, display_name, role, status, note, created_at').eq('establishment_id', est).neq('status', 'disabled').order('created_at')
    if (error) throw new Error(error.message)
    return (data ?? []).map((m): TeamMember => ({
      id: m.id,
      name: m.display_name?.trim() || m.email.split('@')[0],
      email: m.email,
      role: m.role as Role,
      note: m.status === 'invited' ? 'Convite pendente' : m.note,
      ...(m.status === 'invited' ? { pending: true } : {}),
    }))
  }

  async function getHouse(): Promise<House> {
    const est = await ctx.establishment()
    const { data, error } = await client.from('establishments').select('name, cnpj, address, whatsapp, hours').eq('id', est).single()
    if (error) throw new Error(error.message)
    const h = (data.hours ?? {}) as Partial<House['hours']>
    return { name: data.name, cnpj: data.cnpj ?? '', address: data.address ?? '', whatsapp: data.whatsapp ?? '', hours: { weekdays: h.weekdays ?? '', saturday: h.saturday ?? '', sunday: h.sunday ?? '' } }
  }

  return {
    async overview() {
      const est = await ctx.establishment()
      const people = await team()
      const { data } = await client.from('establishments').select('settings').eq('id', est).single()
      const fee = Number((data?.settings as { delivery_fee_cents?: number } | null)?.delivery_fee_cents ?? storefront.deliveryFeeCents)
      return { people: people.length, roles: rolesInUse(people), deliveryFeeCents: fee, paymentLabels: [...storefront.payments.payNow, ...storefront.payments.payOnReceipt].map((p) => p.label) }
    },
    getHouse,
    async saveHouse(house) {
      const clean = cleanHouse(house)
      if (Object.keys(validateHouse(clean)).length) throw new Error('invalid')
      const est = await ctx.establishment()
      const { error } = await client.from('establishments').update({ name: clean.name, cnpj: clean.cnpj || null, address: clean.address, whatsapp: clean.whatsapp, hours: clean.hours }).eq('id', est)
      if (error) throw new Error(error.message)
      return getHouse()
    },
    team,
    async invite(email, role) {
      const est = await ctx.establishment()
      const err = checkInvite(email, role, await team())
      if (err) throw new Error(err)
      const e = email.trim().toLowerCase()
      const { data, error } = await client.from('memberships').insert({ establishment_id: est, email: e, role, status: 'invited', note: 'Convite pendente' }).select('id').single()
      if (error) throw new Error(error.code === '23505' ? 'duplicate' : error.message)
      return { id: data.id, name: e.split('@')[0], email: e, role, note: 'Convite pendente', pending: true }
    },
  }
}
