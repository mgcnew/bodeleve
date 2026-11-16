import type { Courier, Customer, TeamMember } from '@/domain/backoffice'
import type { Category } from '@/domain/catalog'
import { createStore } from '@/lib/store'
import { seedCategories, seedCouriers, seedCustomers, seedEstablishment, seedTeam } from '@/mocks/gestao/people'

export const categoriesStore = createStore<Category[]>('bodeleve.gestao.categorias', seedCategories)
export const customersStore = createStore<Customer[]>('bodeleve.gestao.clientes', seedCustomers)
export const couriersStore = createStore<Courier[]>('bodeleve.gestao.entregadores', seedCouriers)
export const teamStore = createStore<TeamMember[]>('bodeleve.gestao.equipe', seedTeam)
export const establishmentStore = createStore('bodeleve.gestao.casa', seedEstablishment)
