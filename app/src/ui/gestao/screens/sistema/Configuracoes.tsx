import { Box } from '@/components/Card'
import { hypotheses } from '@/config/hypotheses'
import { formatCents } from '@/domain/money'
import { teamStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar, ListRow } from '../../../shared/OpsBits'

export function Configuracoes() {
  const team = teamStore.useStore()
  const roles = new Set(team.map((t) => t.role)).size
  return (
    <div className={o.screen}>
      <Bar title="Configurações" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <Box>
          <ListRow title="A casa" sub="Nome, endereço, horários, WhatsApp, logotipo" to="/gestao/configuracoes/casa" />
          <ListRow title="Equipe e permissões" sub={`${team.length} pessoas · ${roles} papéis`} to="/gestao/configuracoes/equipe" />
          <ListRow title="Loja online" sub={`Entrega: taxa fixa ${formatCents(hypotheses.deliveryFee)} · retirada grátis`} />
          <ListRow title="Formas de pagamento" sub="Pix, cartão na entrega, dinheiro" />
          <ListRow title="Nota fiscal" sub="Não configurado · aguardando decisão" />
        </Box>
        {/* H-G29 — configurações visíveis, mas dependem de respostas pendentes */}
        <p className={o.muted}>Loja online, pagamentos e nota fiscal dependem de respostas pendentes (Q6 a Q8 e Q12).</p>
      </main>
    </div>
  )
}
