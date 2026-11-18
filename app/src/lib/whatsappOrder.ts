// Pedido da loja pelo WhatsApp (D19): a mensagem sai pronta, por escrito, para o WhatsApp da casa.
import { formatCents } from '@/domain/money'
import { orderTotal, type Order } from '@/domain/order'
import { readJSON, writeJSON } from './storage'

const KEY = 'bodeleve.whatsapp'

export function orderMessage(order: Order, note: string, storeName: string) {
  const lines = order.items.map((i) => `• ${i.quantity} × ${i.name} — ${formatCents(i.quantity * i.unitPriceCents)}`)
  return [
    `Olá, ${storeName}! Quero fazer um pedido para retirar na loja.`,
    '',
    `Pedido ${order.number}`,
    ...lines,
    '',
    `Total: ${formatCents(orderTotal(order))} (pagamento na retirada)`,
    `Retirada: ${order.windowLabel}`,
    `Nome: ${order.contact.name}`,
    `Celular: ${order.contact.phone}`,
    ...(note.trim() ? [`Observação: ${note.trim()}`] : []),
    '',
    'Se precisar de entrega, me avise por aqui que combinamos.',
  ].join('\n')
}

/** Guarda o texto para o botão "Abrir WhatsApp" da confirmação funcionar mesmo depois de recarregar */
export function saveWhatsappText(orderId: string, text: string) {
  writeJSON(KEY, { ...readJSON<Record<string, string>>(KEY, {}), [orderId]: text })
}

export function getWhatsappText(order: Order, storeName: string) {
  return readJSON<Record<string, string>>(KEY, {})[order.id] ?? orderMessage(order, '', storeName)
}
