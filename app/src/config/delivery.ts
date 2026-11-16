/**
 * Hipóteses da entrega (DECISIONS.md, H-I69 em diante). Ficam aqui para trocar sem refazer telas quando o dono responder Q6–Q8.
 * Nada aqui é regra confirmada.
 */
export const delivery = {
  /** Entregadores próprios (recebem por mês). */
  ownCouriers: [
    { id: 'carlos', name: 'Carlos' },
    { id: 'bruno', name: 'Bruno' },
  ],
  /** Parceiro avulso recebe por entrega, neste valor (quadro Atribuir). */
  partnerFeeCents: 900,
  /** Parceiros com o app aberto agora: exemplo, passa a vir do app de entregas (Etapa 6). */
  partnersOnline: 2,
  /** Se ninguém aceitar em tantos minutos, a entrega volta para a casa. */
  partnerTimeoutMinutes: 10,
  /** Distância da loja por bairro, em km (exemplo; depende da área de entrega, Q6). */
  districtKm: { Centro: 1.8, 'Bairro Alto': 4.1, 'Jardim das Flores': 3.2 } as Record<string, number>,
} as const
