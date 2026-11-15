import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import { AppLink, Button, ErrorState, Icon, type IconName, ListSkeleton } from '@/components'
import { cx } from '@/lib/cx'
import { useBag } from '@/store/bag'
import s from './loja.module.css'

/** Voltar: volta no histórico se houver; senão vai para a tela indicada. */
export function BackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <button type="button" aria-label="Voltar" className={s.iconLink} onClick={() => (location.key !== 'default' ? navigate(-1) : navigate(fallback))}>
      <Icon name="voltar" />
    </button>
  )
}

export function BagLink() {
  const count = useBag((b) => Object.values(b.items).reduce((a, n) => a + n, 0))
  return (
    <AppLink href="/sacola" aria-label={count > 0 ? `Abrir sacola, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Abrir sacola'} className={cx(s.iconLink, s.mobileOnly)}>
      <Icon name="sacola" />
      {count > 0 && <span className={s.badge} aria-hidden="true">{count}</span>}
    </AppLink>
  )
}

/** Cabeçalho de tela com voltar. `bag` mostra o atalho da sacola à direita. */
export function ScreenHeader({ title, back, bag = false }: { title?: string; back: string; bag?: boolean }) {
  return (
    // div, não <header>: o único "banner" da página é o topo de computador; este cabeçalho é só a barra da tela.
    <div className={s.header}>
      <BackButton fallback={back} />
      <div className={s.headerTitle}>{title}</div>
      {bag && <BagLink />}
    </div>
  )
}

/** Título das telas de aba (Buscar, Pedidos, Perfil). */
export function TabTitle({ children }: { children: ReactNode }) {
  return <h1 className={s.tabTitle}>{children}</h1>
}

/** Etapa do checkout: barras e "Etapa 2 de 4 · Entrega". */
export function StepProgress({ step, title }: { step: number; title: string }) {
  return (
    <div className={s.steps}>
      <div className={s.bars} aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={cx(s.bar, n < step && s.barDone, n === step && s.barNow)} />
        ))}
      </div>
      <div className={s.sub}>Etapa {step} de 4 · {title}</div>
    </div>
  )
}

export function Footer({ children }: { children: ReactNode }) {
  return (
    <div className={s.footer}>
      <div className={s.footerInner}>{children}</div>
    </div>
  )
}

export function Section({ title, subtitle, id, children }: { title: string; subtitle?: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className={s.section} aria-labelledby={id ? `${id}-t` : undefined}>
      <div>
        <h2 id={id ? `${id}-t` : undefined} className={s.h2}>{title}</h2>
        {subtitle && <div className={s.sub}>{subtitle}</div>}
      </div>
      {children}
    </section>
  )
}

type LinkRowProps = { href: string; icon: IconName; title: string; detail?: string }

export function LinkList({ rows }: { rows: LinkRowProps[] }) {
  return (
    <div className={s.linkList}>
      {rows.map((r) => (
        <AppLink key={r.href + r.title} href={r.href} className={s.linkRow}>
          <Icon name={r.icon} size={22} />
          <span className={s.grow}>
            <span className={s.optionTitle}>{r.title}</span>
            {r.detail && <span className={s.optionDetail}>{r.detail}</span>}
          </span>
          <Icon name="avancar" size={18} />
        </AppLink>
      ))}
    </div>
  )
}

/** Opção de escolha única em cartão (janela de entrega, pagamento). */
export function RadioCard({ name, value, checked, onChange, title, detail }: { name: string; value: string; checked: boolean; onChange: (v: string) => void; title: string; detail?: string }) {
  return (
    <label className={s.option}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span className={s.optionText}>
        <span className={s.optionTitle}>{title}</span>
        {detail && <span className={s.optionDetail}>{detail}</span>}
      </span>
    </label>
  )
}

/** Mostra esqueleto enquanto carrega e falha com "Tentar de novo" (estados do design system). */
export function QueryBoundary<T>({ query, skeleton, children, errorTitle = 'Não foi possível carregar' }: { query: UseQueryResult<T>; skeleton?: ReactNode; children: (data: T) => ReactNode; errorTitle?: string }) {
  if (query.isPending) return <>{skeleton ?? <ListSkeleton rows={4} />}</>
  if (query.isError) {
    return (
      <ErrorState
        title={errorTitle}
        description="Verifique a conexão e tente de novo. Nada foi alterado."
        action={<Button onClick={() => query.refetch()}>Tentar de novo</Button>}
      />
    )
  }
  return <>{children(query.data)}</>
}
