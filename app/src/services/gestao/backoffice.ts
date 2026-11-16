// Dados da gestão em stores no aparelho. Cada store corresponde a tabelas do
// DATA_MODEL_DRAFT.md e vira consulta ao Supabase na implementação do banco.
import type { FinancialEntry, Item, Lot, Movement, Purchase, Supplier } from '@/domain/backoffice'
import { createStore } from '@/lib/store'
import { seedEntries, seedItemsList, seedPurchases, seedStock, suppliers as seedSuppliers } from '@/mocks/gestao/backoffice'

export const itemsStore = createStore<Item[]>('bodeleve.gestao.itens', seedItemsList)
export const suppliersStore = createStore<Supplier[]>('bodeleve.gestao.fornecedores', () => seedSuppliers)
export const stockStore = createStore<{ lots: Lot[]; movements: Movement[] }>('bodeleve.gestao.estoque', () => seedStock(itemsStore.get()))
export const purchasesStore = createStore<Purchase[]>('bodeleve.gestao.compras', seedPurchases)
export const entriesStore = createStore<FinancialEntry[]>('bodeleve.gestao.financeiro', seedEntries)

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function itemById(id: string) {
  return itemsStore.get().find((i) => i.id === id) ?? null
}

export function supplierById(id: string) {
  return suppliersStore.get().find((s) => s.id === id) ?? null
}
