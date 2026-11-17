import { Link } from 'react-router-dom'
import { Box } from '@/components/Card'
import { ButtonLink } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { formatCents } from '@/domain/money'
import { itemsStore, recipesStore } from '@/services/gestao/backoffice'
import { margin, unitCostCents } from '@/services/gestao/production'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import { ItemSeal } from '../../components/ItemSeal'

export function Fichas() {
  const recipes = recipesStore.useStore()
  const items = itemsStore.useStore()
  return (
    <div className={o.screen}>
      <Bar title="Fichas técnicas" back="/gestao/producao" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <p className={o.muted}>A ficha diz o que entra, quanto rende e quanto custa cada unidade. É dela que sai a ordem de produção.</p>
        <Box>
          {recipes.map((r) => {
            const product = items.find((i) => i.id === r.productId)!
            const cost = unitCostCents(r, items)
            const m = margin(cost, product.priceCents)
            return (
              <Link key={r.id} to={`/gestao/producao/fichas/${r.id}`} className={o.row} style={{ minHeight: 76 }}>
                <span className={o.rowText}>
                  <span className={o.rowTitle}>{product.name}</span>
                  <span style={{ display: 'block' }}>
                    <ItemSeal item={product} />
                  </span>
                  <span className={o.small}>
                    {r.yieldQty} un por {r.batchLabel}
                  </span>
                </span>
                <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <b style={{ display: 'block' }}>{formatCents(cost)}</b>
                  <span className={o.small} style={{ display: 'block' }}>
                    custo / un{m !== null ? ` · margem ${Math.round(m * 100)}%` : ''}
                  </span>
                </span>
                <Icon name="avancar" size={18} />
              </Link>
            )
          })}
        </Box>
        <ButtonLink to="/gestao/producao/fichas/nova" variant="secondary" block style={{ maxWidth: 480 }}>
          Nova ficha técnica
        </ButtonLink>
        <p className={o.muted}>Produtos de revenda não têm ficha. A Rapadura da Linha Bodeleve é feita por parceiro (Engenho Boa Vista) e entra por compra.</p>
      </main>
    </div>
  )
}
