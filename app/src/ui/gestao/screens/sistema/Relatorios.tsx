import { Box } from '@/components/Card'
import { formatCents } from '@/domain/money'
import { productionStore, itemsStore } from '@/services/gestao/backoffice'
import { stockStore } from '@/services/gestao/backoffice'
import { salesReport } from '@/mocks/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar, ListRow } from '../../../shared/OpsBits'

export function Relatorios() {
  const production = productionStore.useStore().filter((p) => p.status === 'done')
  const items = itemsStore.useStore()
  const { movements } = stockStore.useStore()
  const losses = movements.filter((m) => m.type === 'loss')
  const lossCents = losses.reduce((n, m) => n + Math.abs(m.qty) * (items.find((i) => i.id === m.itemId)?.costCents ?? 0), 0)
  const produced = production.reduce((n, p) => n + (p.goodQty ?? 0), 0)
  const planned = production.reduce((n, p) => n + p.plannedQty, 0)
  const month = salesReport.periods[2]

  return (
    <div className={o.screen}>
      <Bar title="Relatórios" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <p className={o.muted}>Números do mês até hoje. Toque em Vendas para ver por período.</p>
        <Box>
          <ListRow title="Vendas" sub="Balcão e loja online, por dia e forma de pagamento" end={<b>{formatCents(Math.round(month.total * 100))}</b>} to="/gestao/relatorios/vendas" />
          <ListRow title="Produtos" sub="Mais vendido: Queijo coalho · 214 un" end={<b>{items.filter((i) => i.published).length} itens</b>} />
          <ListRow title="Estoque e perdas" sub={`Perdas registradas: ${losses.length} ${losses.length === 1 ? 'lançamento' : 'lançamentos'}`} end={<b>− {formatCents(lossCents)}</b>} />
          <ListRow title="Produção" sub={`${production.length} ordens concluídas · rendimento ${planned ? Math.round((produced / planned) * 100) : 0}%`} end={<b>{produced} un</b>} />
          <ListRow title="Resultado do mês" sub="Vendas menos custos e despesas pagas" end={<b>R$ 3.912,60</b>} />
        </Box>
        <p className={o.muted}>
          Vendas e resultado usam números de exemplo até o PDV e a loja gravarem no banco. Estoque, perdas e produção já saem dos lançamentos.
        </p>
      </main>
    </div>
  )
}
