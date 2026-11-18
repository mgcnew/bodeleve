import { useState } from 'react'
import { Icon } from './Icon'
import styles from './Pagination.module.css'

export const PAGE_SIZE = 20

/**
 * Divide uma lista em páginas. `resetKey` volta para a página 1 quando o filtro ou a busca mudam
 * (dados novos que chegam em tempo real não tiram a pessoa da página em que está).
 */
export function usePagination<T>(items: T[], resetKey: string = '', size: number = PAGE_SIZE) {
  const [state, setState] = useState({ page: 1, key: resetKey })
  const pages = Math.max(1, Math.ceil(items.length / size))
  let page = Math.min(state.page, pages)
  if (state.key !== resetKey) {
    setState({ page: 1, key: resetKey })
    page = 1
  }
  const from = (page - 1) * size
  return {
    items: items.slice(from, from + size),
    page,
    pages,
    total: items.length,
    from: items.length === 0 ? 0 : from + 1,
    to: Math.min(from + size, items.length),
    onPage: (next: number) => setState({ page: Math.min(Math.max(1, next), pages), key: resetKey }),
  }
}

type Props = { page: number; pages: number; total: number; from: number; to: number; onPage: (p: number) => void }

/** "21–40 de 87" e Anterior / Próxima; some quando cabe tudo numa página */
export function Pagination({ page, pages, total, from, to, onPage }: Props) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Paginação" className={styles.bar}>
      <span className={styles.range} aria-live="polite">
        {from}–{to} de {total}
      </span>
      <span className={styles.actions}>
        <button type="button" className={styles.btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior">
          <span className={styles.flip}>
            <Icon name="avancar" size={18} />
          </span>
          <span className={styles.label}>Anterior</span>
        </button>
        <span className={styles.page}>
          {page} de {pages}
        </span>
        <button type="button" className={styles.btn} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Próxima página">
          <span className={styles.label}>Próxima</span>
          <Icon name="avancar" size={18} />
        </button>
      </span>
    </nav>
  )
}
