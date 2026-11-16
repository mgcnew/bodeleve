import type { PaymentTermId } from './purchasing'

/**
 * Cadastros que a casa faz sozinha: fornecedor, ficha técnica e entregador (D33: o banco real começa vazio).
 * Só regras de validação e formatos; quem grava é o serviço.
 */

const digits = (s: string) => s.replace(/\D/g, '')
const phoneOk = (s: string) => [10, 11].includes(digits(s).length)

// ───────── Fornecedor ─────────
export type SupplierInput = {
  name: string
  /** "Leite, requeijão, nata" */
  supplies: string
  contactName: string
  phone: string
  email: string
  doc: string
  defaultPayment: PaymentTermId
  /** Dias para entregar; vazio = não informado. */
  leadTimeDays: number | null
}
export type SupplierErrors = Partial<Record<'name' | 'phone' | 'email' | 'leadTime', string>>

export function validateSupplier(i: SupplierInput): SupplierErrors {
  const e: SupplierErrors = {}
  if (!i.name.trim()) e.name = 'Informe o nome do fornecedor.'
  if (i.phone.trim() && !phoneOk(i.phone)) e.phone = 'Use o DDD e o número, por exemplo (00) 90000-0000.'
  if (i.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email.trim())) e.email = 'Confira o e-mail, por exemplo contato@fornecedor.com.'
  if (i.leadTimeDays != null && (!Number.isInteger(i.leadTimeDays) || i.leadTimeDays < 0 || i.leadTimeDays > 90)) e.leadTime = 'Informe os dias de 0 a 90.'
  return e
}

/** "3 a 5 dias" → 3; "2 dias" → 2; vazio → null (para abrir o cadastro de um fornecedor que já existe). */
export function leadDaysOf(text: string): number | null {
  const m = text.match(/\d+/)
  return m ? Number(m[0]) : null
}

// ───────── Ficha técnica ─────────
export type RecipeInput = {
  /** Produto acabado que sai da ficha. */
  itemId: string
  yieldPerBatch: number
  batchLabel: string
  shelfLifeDays: number
  lotPrefix: string
  overheadCents: number
  method: string
  /** Quantidade por fornada, em unidades de estoque. */
  lines: Array<{ itemId: string; qtyPerBatch: number }>
}
export type RecipeErrors = Partial<Record<'item' | 'yield' | 'shelfLife' | 'lines', string>>

export function validateRecipe(i: RecipeInput): RecipeErrors {
  const e: RecipeErrors = {}
  if (!i.itemId) e.item = 'Escolha o produto que sai desta ficha.'
  if (!(i.yieldPerBatch > 0)) e.yield = 'Informe quantas unidades rende cada fornada.'
  if (!(i.shelfLifeDays >= 0) || !Number.isInteger(i.shelfLifeDays)) e.shelfLife = 'Informe os dias de validade (0 se não tem).'
  const lines = i.lines.filter((l) => l.itemId)
  if (lines.length === 0) e.lines = 'Acrescente pelo menos um insumo.'
  else if (lines.some((l) => !(l.qtyPerBatch > 0) || l.itemId === i.itemId)) e.lines = 'Cada insumo precisa de uma quantidade maior que zero, e o produto não pode ser insumo dele mesmo.'
  else if (new Set(lines.map((l) => l.itemId)).size !== lines.length) e.lines = 'Um insumo aparece duas vezes. Junte as quantidades numa linha só.'
  return e
}

export type RecipeFormOptions = { products: Array<{ id: string; label: string }>; inputs: Array<{ id: string; label: string }> }

// ───────── Entregador ─────────
export type CourierInput = { name: string; kind: 'own' | 'partner'; phone: string; vehicle: string }
export type CourierErrors = Partial<Record<'name' | 'phone', string>>

export function validateCourier(i: CourierInput): CourierErrors {
  const e: CourierErrors = {}
  if (!i.name.trim()) e.name = 'Informe o nome.'
  if (!phoneOk(i.phone)) e.phone = 'Use o DDD e o número do celular, por exemplo (00) 90000-0000. É com ele que a pessoa entra no app.'
  return e
}
