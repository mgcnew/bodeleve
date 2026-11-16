// Datas dos dados de exemplo são relativas a hoje, para as telas fazerem sentido em qualquer dia

export function daysFromToday(days: number, hour = 12, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function todayAt(hour: number, minute = 0) {
  return daysFromToday(0, hour, minute)
}

export function minutesBefore(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

/** dd/mm */
export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/** dd/mm/aaaa */
export function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

/** 15h20 */
export function hourMinute(iso: string) {
  const d = new Date(iso)
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`
}

/** "Sábado, 14 de novembro · 15h30" */
export function longNow(now = new Date()) {
  const day = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${hourMinute(now.toISOString())}`
}

export function greeting(now = new Date()) {
  const h = now.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

/** Diferença em dias inteiros entre hoje e a data (negativo = passado) */
export function daysUntil(iso: string) {
  const a = new Date()
  a.setHours(0, 0, 0, 0)
  const b = new Date(iso)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function minutesAgo(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
}
