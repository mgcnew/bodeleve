import type { SalesDay } from '@/domain/reports'
import { dayKey } from '@/domain/reports'
import { dashboardSeed } from './adminSeed'

/**
 * Vendas de EXEMPLO dos dias anteriores (base antes do PDV existir). Valores por dia da semana seguem o gráfico do quadro
 * (domingo a sábado); a partir de hoje, as vendas saem dos pedidos.
 */
const byWeekday = [1520.4, 980.2, 1104.6, 1210.0, 1388.9, 2105.3, 2250.0] // domingo..sábado
const per = { 'queijo-coalho': 107, 'farinha-de-mandioca': 143, 'carne-de-sol': 338, 'queijo-manteiga': 180, 'rapadura': 200, 'doce-de-leite': 260, 'tapioca-granulada': 220 } as const

export function buildSalesHistory(now: Date, days = 31): SalesDay[] {
  const out: SalesDay[] = []
  for (let n = days; n >= 1; n--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - n)
    const jitter = 1 + (((n * 7) % 5) - 2) * 0.02
    const total = Math.round(byWeekday[d.getDay()] * jitter * 100)
    const online = Math.round(total * 0.3)
    const pix = Math.round(total * 0.46)
    const card = Math.round(total * 0.33)
    out.push({
      date: dayKey(d),
      counterCents: total - online,
      onlineCents: online,
      count: Math.round(total / 3970),
      pixCents: pix,
      cardCents: card,
      cashCents: total - pix - card,
      products: Object.fromEntries(Object.entries(per).map(([id, k]) => [id, Math.max(1, Math.round(total / 100 / k))])),
    })
  }
  return out
}

/** Balcão de hoje enquanto o PDV não existe: 26 vendas, R$ 892,00 (quadro Início). */
export const todayCounterSeed = {
  count: dashboardSeed.counterSales.count,
  cents: dashboardSeed.counterSales.cents,
  // Quadro Caixa: dinheiro R$ 312,00, Pix R$ 197,60, cartão R$ 382,40.
  pixCents: 19760,
  cardCents: 38240,
  cashCents: 31200,
  products: { 'queijo-coalho': 7, 'farinha-de-mandioca': 5, 'carne-de-sol': 2 } as Record<string, number>,
}
