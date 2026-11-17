import { useEffect } from 'react'
import { Box } from '@/components/Card'
import { formatCents } from '@/domain/money'
import { entriesStore, productionStore, itemsStore, stockStore } from '@/services/gestao/backoffice'
import { useSalesReport } from '@/services/gestao/reports'
import { refreshSales } from '@/services/gestao/reportsRemote'
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
  const month = useSalesReport().month
  const entries = entriesStore.useStore()
  useEffect(() => {
    void refreshSales()
  }, [])
  // despesas do mês: contas a pagar quitadas neste mês (compras, contas fixas e lançamentos)
  const now = new Date()
  const spent = entries
    .filter((e) => e.direction === 'payable' && e.paidAt && new Date(e.paidAt).getFullYear() === now.getFullYear() && new Date(e.paidAt).getMonth() === now.getMonth())
    .reduce((n, e) => n + e.paidAmountCents, 0)
  const result = month.total - spent

  return (
    <div className={o.screen}>
      <Bar title="Relatórios" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <p className={o.muted}>Números do mês até hoje. Toque em Vendas para ver por período.</p>
        <Box>
          <ListRow title="Vendas" sub="Balcão e loja online, por dia e forma de pagamento" end={<b>{formatCents(month.total)}</b>} to="/gestao/relatorios/vendas" />
          <ListRow title="Produtos" sub={month.top[0] ? `Mais vendido no mês: ${month.top[0].name} · ${month.top[0].qty}` : 'Ainda sem vendas no mês'} end={<b>{items.filter((i) => i.published).length} itens</b>} />
          <ListRow title="Estoque e perdas" sub={`Perdas registradas: ${losses.length} ${losses.length === 1 ? 'lançamento' : 'lançamentos'}`} end={<b>− {formatCents(lossCents)}</b>} />
          <ListRow title="Produção" sub={`${production.length} ordens concluídas · rendimento ${planned ? Math.round((produced / planned) * 100) : 0}%`} end={<b>{produced} un</b>} />
          <ListRow title="Resultado do mês" sub="Vendas do mês menos contas pagas no mês" end={<b>{result < 0 ? '− ' : ''}{formatCents(Math.abs(result))}</b>} />
        </Box>
        <p className={o.muted}>
          Vendas, estoque, perdas e produção saem dos registros do sistema. O resultado é uma conta simples de caixa: vendas do mês menos contas pagas no mês (compras, despesas fixas e lançamentos).
        </p>
      </main>
    </div>
  )
}
