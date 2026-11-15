import { useLocation } from 'react-router-dom'
import { ButtonLink, EmptyState } from '@/components'
import { entries } from '@/ui/gestao/modules'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

/** Módulo ainda não implementado: o menu já é o definitivo, e cada módulo entra no lote indicado pelo roadmap (D13). */
export function ModulePlaceholder() {
  const { pathname } = useLocation()
  const entry = entries.find((e) => e.to !== '/gestao' && (pathname === e.to || pathname.startsWith(`${e.to}/`)))
  return (
    <>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>{entry?.label ?? 'Em construção'}</h1>
          <div className={s.date}>{entry?.detail}</div>
        </div>
      </header>
      <main className={`${s.main} ${l.centerBox}`}>
        <EmptyState icon="alerta" title="Este módulo chega nos próximos lotes" description="O desenho está pronto; a implementação entra na sequência da Etapa 4." action={<ButtonLink href="/gestao" variant="secondary">Voltar ao início</ButtonLink>} />
      </main>
    </>
  )
}
