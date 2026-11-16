// Clientes, entregadores, equipe e relatórios de exemplo (design/Gestao-*.dc.html)
import type { Courier, Customer, TeamMember } from '@/domain/backoffice'
import type { Category } from '@/domain/catalog'
import { daysFromToday } from '@/domain/dates'

export const seedCategories = (): Category[] => [
  { id: 'queijos', name: 'Queijos e laticínios' },
  { id: 'carnes', name: 'Carnes e embutidos' },
  { id: 'farinhas', name: 'Farinhas e grãos' },
  { id: 'doces', name: 'Doces' },
  { id: 'temperos', name: 'Temperos e conservas' },
  { id: 'bebidas', name: 'Bebidas' },
]

const cust = (c: Omit<Customer, 'notes' | 'fiadoCents' | 'history' | 'topItems'> & Partial<Customer>): Customer => ({ notes: '', fiadoCents: 0, history: [], topItems: [], ...c })

export const seedCustomers = (): Customer[] => [
  cust({
    id: 'maria-lima', name: 'Maria Lima', phone: '(00) 90000-0001', address: 'Av. das Palmeiras, 455 · casa 2 — Centro', since: daysFromToday(-250), channel: 'compra pela loja online',
    orderCount: 5, totalCents: 41230, lastOrderLabel: 'último hoje', notes: 'Prefere queijo mais curado.',
    topItems: [{ name: 'Queijo coalho', times: 5 }, { name: 'Farinha de mandioca', times: 3 }, { name: 'Tapioca', times: 2 }],
    history: [
      { number: '1021', date: daysFromToday(-8), line: 'Entrega · 4 itens', totalCents: 9840, status: 'Entregue' },
      { number: '0997', date: daysFromToday(-23), line: 'Retirada · 6 itens', totalCents: 12160, status: 'Retirado' },
    ],
  }),
  cust({ id: 'ana-souza', name: 'Ana Souza', phone: '(00) 90000-0000', address: 'Rua das Camélias, 120 · apto 34 — Jardim das Flores', since: daysFromToday(-120), channel: 'compra pela loja online', orderCount: 3, totalCents: 23610, lastOrderLabel: 'último hoje', topItems: [{ name: 'Queijo coalho', times: 3 }] }),
  cust({ id: 'dona-zefa', name: 'Dona Zefa', phone: '(00) 90000-0006', address: '—', since: daysFromToday(-500), channel: 'compra no balcão', orderCount: 22, totalCents: 102000, fiadoCents: 16000, lastOrderLabel: 'balcão · compra fiado', topItems: [{ name: 'Carne de sol', times: 12 }, { name: 'Farinha de mandioca', times: 9 }] }),
  cust({ id: 'paula-reis', name: 'Paula Reis', phone: '(00) 90000-0003', address: 'Rua do Sol, 88 — Bairro Alto', since: daysFromToday(-400), channel: 'compra pela loja online', orderCount: 8, totalCents: 90470, lastOrderLabel: 'último hoje', topItems: [{ name: 'Queijo coalho', times: 8 }, { name: 'Doce de leite', times: 5 }] }),
  cust({ id: 'joao-pedro', name: 'João Pedro', phone: '(00) 90000-0002', address: '—', since: daysFromToday(-1), channel: 'compra pela loja online', orderCount: 1, totalCents: 4780, lastOrderLabel: 'hoje' }),
]

// H-G26 — entregador próprio recebe por mês; parceiro recebe por entrega
export const seedCouriers = (): Courier[] => [
  { id: 'carlos', name: 'Carlos', kind: 'own', status: 'en_route', note: 'em rota com #1042, volta 15h50' },
  { id: 'bruno', name: 'Bruno', kind: 'own', status: 'available', note: 'na loja' },
  { id: 'parceiros', name: 'Parceiros', kind: 'partner', status: 'online', note: '2 com o app aberto agora' },
]

export const seedTeam = (): TeamMember[] => [
  { id: 'dono', name: '[NOME DO DONO]', role: 'owner', detail: 'Você' },
  { id: 'ana', name: 'Ana', role: 'manager', detail: 'ana@exemplo.com' },
  { id: 'julia', name: 'Júlia', role: 'clerk', detail: 'Balcão' },
  { id: 'raimundo', name: 'Seu Raimundo', role: 'production', detail: 'Cozinha' },
  { id: 'carlos', name: 'Carlos', role: 'courier', detail: 'Próprio' },
  { id: 'bruno', name: 'Bruno', role: 'courier', detail: 'Próprio' },
]

export const seedEstablishment = () => ({
  name: 'Bodeleve',
  cnpj: '',
  address: '',
  whatsapp: '',
  hours: { weekdays: '', saturday: '', sunday: '' },
})

// Relatórios: o histórico de vendas só existe com o PDV e a loja ligados ao banco; até lá, números de exemplo
export const salesReport = {
  days: [1520.4, 980.2, 1104.6, 1210.0, 1388.9, 2105.3, 1284.5],
  periods: [
    { key: 'today', label: 'Hoje', total: 1284.5, sub: '32 vendas · ticket médio R$ 40,14', counter: 892, online: 392.5, pix: 590.1, card: 382.4, cash: 312, top: ['12 un', '9 un', '3,8 kg'] },
    { key: 'week', label: '7 dias', total: 9593.9, sub: '241 vendas · ticket médio R$ 39,81', counter: 6812.4, online: 2781.5, pix: 4410.2, card: 3201.7, cash: 1982, top: ['58 un', '41 un', '19,6 kg'] },
    { key: 'month', label: 'Mês', total: 14326.8, sub: '362 vendas · ticket médio R$ 39,58', counter: 10102.3, online: 4224.5, pix: 6588.9, card: 4790.4, cash: 2947.5, top: ['214 un', '77 un', '36,2 kg'] },
  ],
}
