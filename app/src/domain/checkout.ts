import type { Address, Contact } from './types'
import { parseDecimal } from '@/lib/format'

const digits = (s: string) => s.replace(/\D/g, '')

/**
 * (11) 98765-4321 ou (11) 3333-4444. Aceita DDI 55 colado. O formato é decidido pelo dígito depois do DDD
 * (9 = celular, 5+4; senão fixo, 4+4), para o hífen não mudar de lugar enquanto a pessoa digita.
 */
export function formatPhone(raw: string): string {
  let d = digits(raw)
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  const mobile = d[2] === '9'
  d = d.slice(0, mobile ? 11 : 10)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  const ddd = d.slice(0, 2)
  const rest = d.slice(2)
  const cut = mobile ? 5 : 4
  return rest.length <= cut ? `(${ddd}) ${rest}` : `(${ddd}) ${rest.slice(0, cut)}-${rest.slice(cut)}`
}

export function isValidPhone(raw: string): boolean {
  const d = digits(raw)
  return d.length === 10 || d.length === 11
}

/** 00000-000 */
export function formatCep(raw: string): string {
  const d = digits(raw).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function isValidCep(raw: string): boolean {
  return digits(raw).length === 8
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

/** As mensagens dizem como corrigir (DESIGN_SYSTEM.md). */
export function validateContact(c: Contact): FieldErrors<Contact> {
  const e: FieldErrors<Contact> = {}
  if (c.name.trim().length < 2) e.name = 'Informe seu nome.'
  if (!isValidPhone(c.phone)) e.phone = 'Informe o celular com DDD, por exemplo (11) 98765-4321.'
  return e
}

export function validateAddress(a: Address): FieldErrors<Address> {
  const e: FieldErrors<Address> = {}
  if (!isValidCep(a.cep)) e.cep = 'Informe o CEP com 8 números.'
  if (a.street.trim().length < 2) e.street = 'Informe a rua.'
  if (a.number.trim().length < 1) e.number = 'Informe o número ou escreva "s/n".'
  if (a.district.trim().length < 2) e.district = 'Informe o bairro.'
  return e
}

/** Troco "para quanto": vazio = sem troco; senão precisa cobrir o total. Devolve centavos ou um erro legível. */
export function parseChangeFor(text: string, totalCents: number): { cents: number | null; error?: string } {
  const cleaned = text.replace(/R\$\s?/i, '').trim()
  if (cleaned === '') return { cents: null }
  const value = parseDecimal(cleaned)
  if (value == null) return { cents: null, error: 'Informe um valor, por exemplo 100,00.' }
  const cents = Math.round(value * 100)
  if (cents < totalCents) return { cents: null, error: 'O valor do troco precisa ser maior ou igual ao total do pedido.' }
  return { cents }
}

export function addressLine(a: Address): string {
  const base = `${a.street}, ${a.number}`
  return a.complement.trim() ? `${base} · ${a.complement.trim()}` : base
}
