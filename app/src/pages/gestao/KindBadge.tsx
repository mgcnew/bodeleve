import { OriginBadge } from '@/components'
import type { StockRow } from '@/domain/stock'

/** Selo do tipo/origem: "Feito na casa", "Marca Bodeleve", "Revenda" ou "Matéria-prima". */
export function KindBadge({ itemType, origin }: Pick<StockRow, 'itemType' | 'origin'>) {
  if (itemType === 'raw_material' || !origin) {
    return <span style={{ padding: '2px 10px', borderRadius: 999, border: '1px solid var(--texto-secundario)', color: 'var(--texto-secundario)', font: '600 12px/18px var(--fonte-texto)', whiteSpace: 'nowrap' }}>Matéria-prima</span>
  }
  return <OriginBadge origin={origin} />
}
