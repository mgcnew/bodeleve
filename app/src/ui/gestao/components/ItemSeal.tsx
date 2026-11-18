import { Seal } from '@/components/Badges'
import type { Item } from '@/domain/backoffice'

const outline = (label: string, filled?: boolean) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      border: `1px solid ${filled ? 'var(--linha)' : 'var(--texto-secundario)'}`,
      background: filled ? 'var(--fundo-suave)' : undefined,
      color: filled ? 'var(--texto)' : 'var(--texto-secundario)',
      font: '600 12px/18px var(--fonte-texto)',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
)

/** H-G10 — itens à venda e matérias-primas juntos, diferenciados por selo */
export function ItemSeal({ item }: { item: Item }) {
  if (item.itemType === 'raw_material') return outline('Matéria-prima', true)
  if (item.origin === 'house_made' || item.origin === 'bodeleve_brand') return <Seal origin={item.origin} />
  return outline('Revenda')
}

export const itemTypeLabels: Record<Item['itemType'], string> = {
  resale: 'Revenda',
  raw_material: 'Matéria-prima',
  finished: 'Produto acabado',
}
