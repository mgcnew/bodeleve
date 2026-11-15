/**
 * Formatação pt-BR. Dinheiro é inteiro em centavos (DATA_MODEL_DRAFT.md); só aqui vira texto.
 * O espaço entre "R$" e o número é inseparável, para o símbolo não ficar sozinho na linha.
 */
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(cents: number): string {
  return brl.format(cents / 100)
}

/** Valor com sinal explícito para lançamentos: "+ R$ 392,50", "− R$ 420,00" (sinal de menos verdadeiro). */
export function formatSignedBRL(cents: number): string {
  if (cents === 0) return formatBRL(0)
  return `${cents > 0 ? '+' : '−'} ${formatBRL(Math.abs(cents))}`
}

/** Quantidade decimal: formatDecimal(0.5, 3) -> "0,500". */
export function formatDecimal(value: number, fractionDigits = 0): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/** Lê "0,500" ou "0.5" digitado; devolve null se não for número válido e não negativo. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(/\./g, '').replace(',', '.')
  if (normalized === '') return null
  const n = Number(normalized)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Primeira letra minúscula, sem mexer no resto ("Avisamos pelo WhatsApp" -> "avisamos pelo WhatsApp"). */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

/** "02/11" e "02/11/2026" a partir de um ISO; "Hoje" quando é o mesmo dia de `now`. */
export function formatShortDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const same = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  if (same) return 'Hoje'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatFullDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** "15h20" a partir de um ISO, no horário do aparelho. */
export function formatClock(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

/** "dd/MM" a partir de um ISO. */
export function formatDayMonth(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** "Sábado, 14 de novembro" */
export function formatLongDate(d: Date): string {
  const text = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function greeting(d: Date): string {
  const h = d.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

/** Lê dinheiro digitado ("R$ 1.800,00", "1800,5", "12") e devolve centavos; null se não for um valor válido (zero é válido). */
export function parseMoney(text: string): number | null {
  const cleaned = text.replace(/R\$\s?/i, '').replace(/\s/g, '')
  if (cleaned === '' || /[^0-9.,]/.test(cleaned)) return null
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/\.(?=\d{3}(\D|$))/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}
