import type { Courier, Customer, TeamMember } from '@/domain/backoffice'
import type { Category } from '@/domain/catalog'
import { createStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { seedCategories, seedCouriers, seedCustomers, seedEstablishment, seedTeam } from '@/mocks/gestao/people'

// com o Supabase categorias e clientes são cache do banco (peopleRemote); sem ele, dados de exemplo
export const categoriesStore = createStore<Category[]>(supabase ? 'bodeleve.gestao.categorias.remoto' : 'bodeleve.gestao.categorias', () => (supabase ? [] : seedCategories()))
export const customersStore = createStore<Customer[]>(supabase ? 'bodeleve.gestao.clientes.remoto' : 'bodeleve.gestao.clientes', () => (supabase ? [] : seedCustomers()))
// com o Supabase é cache do banco (`couriers` + entregas em andamento), alimentado por peopleRemote
export const couriersStore = createStore<Courier[]>(supabase ? 'bodeleve.gestao.entregadores.remoto' : 'bodeleve.gestao.entregadores', () => (supabase ? [] : seedCouriers()))
export const teamStore = createStore<TeamMember[]>('bodeleve.gestao.equipe', seedTeam)
export const establishmentStore = createStore('bodeleve.gestao.casa', seedEstablishment)
