/**
 * Hipóteses (H-*) de docs/DECISIONS.md usadas nas telas.
 * Hipótese não é regra: ficam aqui para trocar sem refazer telas.
 * Quando uma for confirmada ou mudar, atualize também DECISIONS.md.
 */
import type { Cents } from '@/domain/money'

export const hypotheses = {
  /** H-L1 — taxa de entrega fixa de exemplo, mostrada como "estimada" (Q6) */
  deliveryFee: 800 as Cents,
  /** H-L2 — retirada na loja sem custo (Q7) */
  pickupFee: 0 as Cents,
  /** H-L7 — janelas de entrega e retirada de exemplo (Q7) */
  deliveryWindows: [
    { id: 'asap', title: 'O quanto antes', sub: 'Hoje, em 40 a 60 minutos' },
    { id: 'afternoon', title: 'Hoje à tarde', sub: 'Entre 17h e 18h' },
    { id: 'tomorrow', title: 'Amanhã cedo', sub: 'Entre 9h e 10h' },
  ],
  pickupWindows: [
    { id: 'asap', title: 'Assim que estiver pronto', sub: 'Avisamos pelo WhatsApp' },
    { id: 'afternoon', title: 'Hoje à tarde', sub: 'Entre 17h e 18h' },
  ],
  /** H-L8 — Pix agora; cartão ou dinheiro ao receber; sem cartão online (Q8) */
  payNow: ['pix'],
  payOnDelivery: ['card_on_delivery', 'cash'],
  /** H-L4 / H-E5 — código de confirmação de entrega */
  deliveryCodeLength: 4,
  /** H-L10 / H-E1 — código de login por WhatsApp */
  loginCodeLength: 4,
  /** H-G26 — valor pago ao parceiro por entrega; minutos até voltar para a loja (Q11) */
  partnerFeePerDelivery: 900 as Cents,
  partnerAcceptTimeoutMin: 10,
  /** H-E6 — devolução paga metade ao parceiro (Q11) */
  partnerReturnFee: 450 as Cents,
  /** H-P2 — atalhos de peso no PDV, em gramas; ajuste fino (Q2) */
  weightShortcutsG: [250, 500, 1000],
  weightStepG: 50,
} as const

/** Identificador da casa no banco (estabelecimento) usado pelas funções públicas da loja */
export const STORE_SLUG = 'bodeleve'
