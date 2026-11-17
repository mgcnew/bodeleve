import type { Courier, CourierRecord, Customer, TeamMember } from '@/domain/backoffice'
import type { Category } from '@/domain/catalog'
import { createStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { seedCategories, seedCouriers, seedCustomers, seedEstablishment, seedTeam } from '@/mocks/gestao/people'

// com o Supabase categorias, clientes, equipe e a casa são cache do banco (peopleRemote); sem ele, dados de exemplo
export const categoriesStore = createStore<Category[]>(supabase ? 'bodeleve.gestao.categorias.remoto' : 'bodeleve.gestao.categorias', () => (supabase ? [] : seedCategories()))
export const customersStore = createStore<Customer[]>(supabase ? 'bodeleve.gestao.clientes.remoto' : 'bodeleve.gestao.clientes', () => (supabase ? [] : seedCustomers()))
// com o Supabase é cache do banco (`couriers` + entregas em andamento), alimentado por peopleRemote
export const couriersStore = createStore<Courier[]>(supabase ? 'bodeleve.gestao.entregadores.remoto' : 'bodeleve.gestao.entregadores', () => (supabase ? [] : seedCouriers()))
// cadastro dos entregadores (inclui inativos); sem o Supabase parte dos entregadores de exemplo
export const courierRegistryStore = createStore<CourierRecord[]>(supabase ? 'bodeleve.gestao.cadastro-entregadores.remoto' : 'bodeleve.gestao.cadastro-entregadores', () =>
  supabase ? [] : seedCouriers().filter((c) => c.kind === 'own').map((c) => ({ id: c.id, name: c.name, kind: 'own' as const, phone: '', vehicle: '', active: true })),
)
export const teamStore = createStore<TeamMember[]>(supabase ? 'bodeleve.gestao.equipe.remoto' : 'bodeleve.gestao.equipe', () => (supabase ? [] : seedTeam()))
export const establishmentStore = createStore(supabase ? 'bodeleve.gestao.casa.remoto' : 'bodeleve.gestao.casa', seedEstablishment)
