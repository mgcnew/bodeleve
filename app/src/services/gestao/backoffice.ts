// Dados da gestão em stores no aparelho. Cada store corresponde a tabelas do
// DATA_MODEL_DRAFT.md e vira consulta ao Supabase na implementação do banco.
import type { Account, FinancialEntry, Item, LedgerTx, Lot, Movement, ProductionOrder, Purchase, Recipe, Supplier } from '@/domain/backoffice'
import { createStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { seedAccounts, seedEntries, seedLedger, seedItemsList, seedProduction, seedPurchases, seedRecipes, seedStock, suppliers as seedSuppliers } from '@/mocks/gestao/backoffice'

// Com o Supabase ligado, estes stores são caches do banco (começam vazios e têm chave própria);
// sem ele, dados de exemplo no aparelho.
const remote = supabase !== null

export const itemsStore = createStore<Item[]>(remote ? 'bodeleve.gestao.itens.remoto' : 'bodeleve.gestao.itens', remote ? () => [] : seedItemsList)
export const suppliersStore = createStore<Supplier[]>(remote ? 'bodeleve.gestao.fornecedores.remoto' : 'bodeleve.gestao.fornecedores', () => (remote ? [] : seedSuppliers))
export const stockStore = createStore<{ lots: Lot[]; movements: Movement[] }>(remote ? 'bodeleve.gestao.estoque.remoto' : 'bodeleve.gestao.estoque', () => (remote ? { lots: [], movements: [] } : seedStock(itemsStore.get())))
export const purchasesStore = createStore<Purchase[]>(remote ? 'bodeleve.gestao.compras.remoto' : 'bodeleve.gestao.compras', remote ? () => [] : seedPurchases)
export const entriesStore = createStore<FinancialEntry[]>(remote ? 'bodeleve.gestao.financeiro.remoto' : 'bodeleve.gestao.financeiro', remote ? () => [] : seedEntries)
export const accountsStore = createStore<Account[]>(remote ? 'bodeleve.gestao.contas.remoto' : 'bodeleve.gestao.contas', remote ? () => [] : seedAccounts)
export const ledgerStore = createStore<LedgerTx[]>(remote ? 'bodeleve.gestao.lancamentos.remoto' : 'bodeleve.gestao.lancamentos', remote ? () => [] : seedLedger)
// fichas e ordens de produção: com o Supabase são cache do banco; sem ele, dados de exemplo
export const recipesStore = createStore<Recipe[]>(remote ? 'bodeleve.gestao.fichas.remoto' : 'bodeleve.gestao.fichas', remote ? () => [] : seedRecipes)
export const productionStore = createStore<ProductionOrder[]>(remote ? 'bodeleve.gestao.producao.remoto' : 'bodeleve.gestao.producao', remote ? () => [] : seedProduction)

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function itemById(id: string) {
  return itemsStore.get().find((i) => i.id === id) ?? null
}

export function supplierById(id: string) {
  return suppliersStore.get().find((s) => s.id === id) ?? null
}
