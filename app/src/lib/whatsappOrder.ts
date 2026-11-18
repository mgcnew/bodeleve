// Pedido da loja pelo WhatsApp (D19): a mensagem sai pronta, por escrito, para o WhatsApp da casa.
import { plural } from '@/domain/catalog'
import { formatCents } from '@/domain/money'
import type { Order } from '@/domain/order'
import { readJSON, writeJSON } from './storage'

const KEY = 'bodeleve.whatsapp'

/**
 * Texto do pedido para o WhatsApp. Usa o que o WhatsApp entende: *negrito*, linhas em branco entre
 * os blocos e um item por linha, com o produto em destaque.
 */
export type MessageOrder = Pick<Order, 'number' | 'windowLabel' | 'contact' | 'items' | 'feeCents'>

export function orderMessage(order: MessageOrder, note: string, storeName: string) {
  const items = order.items.flatMap((i) => {
    const line = formatCents(i.quantity * i.unitPriceCents)
    return [
      `• *${i.quantity} × ${i.name}*`,
      i.quantity > 1 ? `   ${formatCents(i.unitPriceCents)} cada · ${line}` : `   ${line}`,
    ]
  })
  const count = order.items.reduce((n, i) => n + i.quantity, 0)
  const blocks = [
    [`Olá, *${storeName}*! Gostaria de fazer um pedido para retirar na loja.`],
    [`*PEDIDO ${/^\d/.test(order.number) ? `#${order.number}` : order.number}*`],
    ['*Itens*', ...items],
    [`*Total: ${formatCents(order.items.reduce((n, i) => n + i.quantity * i.unitPriceCents, 0) + order.feeCents)}*`, `${plural(count, 'item', 'itens')} · pagamento na retirada`],
    ['*Retirada na loja*', order.windowLabel],
    ['*Meus dados*', `Nome: ${order.contact.name}`, `Celular: ${order.contact.phone}`],
    ...(note.trim() ? [['*Observação*', note.trim()]] : []),
    ['Precisa de entrega? Combinamos por aqui. Obrigado!'],
  ]
  return blocks.map((b) => b.join('\n')).join('\n\n')
}

/** Guarda o texto para o botão "Abrir WhatsApp" da confirmação funcionar mesmo depois de recarregar */
export function saveWhatsappText(orderId: string, text: string) {
  writeJSON(KEY, { ...readJSON<Record<string, string>>(KEY, {}), [orderId]: text })
}

export function getWhatsappText(order: Order, storeName: string) {
  return readJSON<Record<string, string>>(KEY, {})[order.id] ?? orderMessage(order, '', storeName)
}
