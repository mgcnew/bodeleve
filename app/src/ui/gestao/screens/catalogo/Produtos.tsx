import { useState } from 'react'
import { Box } from '@/components/Card'
import { ButtonLink } from '@/components/Button'
import { EmptyState } from '@/components/Feedback'
import { FilterChips } from '@/components/Field'
import { normalize } from '@/domain/catalog'
import type { Item } from '@/domain/backoffice'
import { formatCents } from '@/domain/money'
import { itemsStore } from '@/services/gestao/backoffice'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import { ItemSeal } from '../../components/ItemSeal'
import { SearchBox } from '../compras/Fornecedores'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'

type Filter = 'all' | 'house_made' | 'bodeleve_brand' | 'resale' | 'raw_material'

const match = (i: Item, f: Filter) =>
  f === 'all' ||
  (f === 'raw_material' && i.itemType === 'raw_material') ||
  (f === 'resale' && i.itemType !== 'raw_material' && i.origin === 'third_party') ||
  (f === 'house_made' && i.origin === 'house_made') ||
  (f === 'bodeleve_brand' && i.origin === 'bodeleve_brand')

function channel(i: Item) {
  if (i.itemType === 'raw_material') return 'Não vende'
  if (i.soldByWeight) return i.published ? 'Loja e balcão (por peso)' : 'Só balcão (por peso)'
  return i.published ? 'Loja e balcão' : 'Só balcão'
}

export function Produtos() {
  const items = itemsStore.useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const visible = items.filter((i) => match(i, filter) && normalize(i.name).includes(normalize(q.trim())))

  return (
    <div className={o.screen}>
      <Bar title="Produtos" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop}`}>
        <SearchBox label="Buscar produto" value={q} onChange={setQ} />
        <FilterChips
          label="Filtrar por tipo"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'house_made', label: 'Feitos na casa' },
            { value: 'bodeleve_brand', label: 'Marca Bodeleve' },
            { value: 'resale', label: 'Revenda' },
            { value: 'raw_material', label: 'Matéria-prima' },
          ]}
        />
        {visible.length === 0 ? (
          <EmptyState icon="buscar" title="Nenhum produto encontrado" text="Confira a escrita ou mude o filtro." />
        ) : (
          <Box>
            {visible.map((i) => (
              <Link key={i.id} to={`/gestao/produtos/${i.id}`} className={o.row} style={{ minHeight: 76 }}>
                <span className={o.rowText}>
                  <span className={o.rowTitle}>{i.name}</span>
                  <span style={{ display: 'block', paddingTop: 4 }}>
                    <ItemSeal item={i} />
                  </span>
                  <span className={o.small}>{channel(i)}</span>
                </span>
                <b className={o.num} style={{ flex: 'none' }}>
                  {i.priceCents === null ? '—' : `${formatCents(i.priceCents)}${i.soldByWeight ? ' / kg' : ''}`}
                </b>
                <Icon name="avancar" size={18} />
              </Link>
            ))}
          </Box>
        )}
        <div style={{ display: 'flex', gap: 8, maxWidth: 480 }}>
          <ButtonLink to="/gestao/produtos/categorias" variant="secondary" block>
            Categorias
          </ButtonLink>
          <ButtonLink to="/gestao/producao/fichas" variant="secondary" block>
            Fichas técnicas
          </ButtonLink>
        </div>
        <p className={o.muted}>
          {items.length} itens cadastrados{visible.length !== items.length ? `; a lista mostra ${visible.length}` : ''}.
        </p>
      </main>
    </div>
  )
}
