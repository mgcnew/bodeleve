import type { Tone } from '@/components/Badges'
import type { Purchase } from '@/domain/backoffice'
import { daysUntil, shortDate } from '@/domain/dates'

export function purchaseTag(p: Purchase): { label: string; tone: Tone } {
  if (p.status === 'received') return { label: 'Recebido', tone: 'success' }
  if (p.status === 'partially_received') return { label: 'Recebido parcial', tone: 'warning' }
  if (p.status === 'cancelled') return { label: 'Cancelado', tone: 'error' }
  if (p.status === 'draft') return { label: 'Rascunho', tone: 'info' }
  const d = daysUntil(p.expectedAt)
  if (d < 0) return { label: 'Atrasado', tone: 'error' }
  if (d === 0) return { label: 'Chega hoje', tone: 'warning' }
  return { label: 'Enviado', tone: 'info' }
}

export function purchaseLine(p: Purchase) {
  const n = `${p.items.length} ${p.items.length === 1 ? 'item' : 'itens'}`
  if (p.status === 'received' || p.status === 'partially_received') {
    const missing = p.items.filter((i) => i.receivedQty < i.qty).length
    const when = p.receivedAt ? shortDate(p.receivedAt) : ''
    return missing && p.status === 'partially_received'
      ? `Recebido ${when} · faltou ${missing} ${missing === 1 ? 'item' : 'itens'}`
      : `Recebido ${when} · ${n}`
  }
  const d = daysUntil(p.expectedAt)
  return `${d === 0 ? 'Chega hoje' : `Chega ${shortDate(p.expectedAt)}`} · ${n}`
}

export function isOpen(p: Purchase) {
  return p.status === 'sent' || p.status === 'draft'
}
