import type { PaymentMethod, TimeWindow } from '@/domain/types'

/**
 * Hipóteses da loja (DECISIONS.md, H-L*). Ficam aqui, num lugar só, para trocar sem refazer telas
 * quando o dono responder Q6–Q8. Nada aqui é regra confirmada.
 */
export const storefront = {
  /** H-L1 / Q6: taxa fixa de exemplo, mostrada já na sacola como "estimada". */
  deliveryFeeCents: 800,
  /** H-L4: código de entrega de 4 dígitos. */
  deliveryCodeLength: 4,
  /** H-L7 / Q7: janelas de exemplo. */
  deliveryWindows: [
    { id: 'asap', label: 'O quanto antes', detail: 'Hoje, em 40 a 60 minutos' },
    { id: 'afternoon', label: 'Hoje à tarde', detail: 'Entre 17h e 18h' },
    { id: 'tomorrow', label: 'Amanhã cedo', detail: 'Entre 9h e 10h' },
  ] satisfies TimeWindow[],
  /** H-L2: retirada sem custo. */
  pickupWindows: [
    { id: 'asap', label: 'Assim que estiver pronto', detail: 'Avisamos pelo WhatsApp' },
    { id: 'afternoon', label: 'Hoje à tarde', detail: 'Entre 17h e 18h' },
  ] satisfies TimeWindow[],
  /** P8: enquanto o provedor de Pix não for escolhido e aprovado (D21), nada é cobrado e o QR é só um marcador. */
  pixProviderConnected: false,
  /** H-L8 / Q8: Pix agora; cartão ou dinheiro ao receber. Sem cartão online. */
  payments: {
    payNow: [{ method: 'pix', label: 'Pix', detail: 'O código aparece ao confirmar o pedido' }],
    payOnReceipt: [
      { method: 'card_on_delivery', label: 'Cartão na entrega', detail: 'Débito ou crédito, na maquininha' },
      { method: 'cash', label: 'Dinheiro', detail: 'Informe abaixo se precisa de troco' },
    ],
  } satisfies Record<string, Array<{ method: PaymentMethod; label: string; detail: string }>>,
} as const

export const paymentLabel: Record<PaymentMethod, string> = {
  pix: 'Pix',
  card_on_delivery: 'Cartão na entrega',
  cash: 'Dinheiro',
}
