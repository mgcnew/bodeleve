/**
 * Hipóteses da entrega (DECISIONS.md, H-I69 em diante). Ficam aqui para trocar sem refazer telas quando o dono responder Q6–Q8.
 * Nada aqui é regra confirmada.
 */
export const delivery = {
  /**
   * Entregadores cadastrados pela casa (só entra quem está aqui, quadro Entrar). Próprios recebem por mês; parceiros, por entrega.
   * Exemplo: passa a vir do cadastro de equipe (P47). Os celulares são de teste.
   */
  couriers: [
    { id: 'carlos', name: 'Carlos', kind: 'own', phone: '(00) 90000-0301', vehicle: 'Moto · [PLACA]' },
    { id: 'bruno', name: 'Bruno', kind: 'own', phone: '(00) 90000-0300', vehicle: 'Moto · [PLACA]' },
    { id: 'diego', name: 'Diego', kind: 'partner', phone: '(00) 90000-0302', vehicle: 'Moto · [PLACA]' },
  ] as ReadonlyArray<{ id: string; name: string; kind: 'own' | 'partner'; phone: string; vehicle: string }>,
  /** Devolução à loja paga metade ao parceiro (quadro Histórico). */
  partnerReturnFeeCents: 450,
  /** Estimativa de tempo de rota: minutos por km (exemplo). */
  minutesPerKm: 3,
  /** Parceiro avulso recebe por entrega, neste valor (quadro Atribuir). */
  partnerFeeCents: 900,
  /** Parceiros com o app aberto agora: exemplo, passa a vir do app de entregas (Etapa 6). */
  partnersOnline: 2,
  /** Se ninguém aceitar em tantos minutos, a entrega volta para a casa. */
  partnerTimeoutMinutes: 10,
  /** Distância da loja por bairro, em km (exemplo; depende da área de entrega, Q6). */
  districtKm: { Centro: 1.8, 'Bairro Alto': 4.1, 'Jardim das Flores': 3.3, 'Vila Nova': 2.6 } as Record<string, number>,
} as const
