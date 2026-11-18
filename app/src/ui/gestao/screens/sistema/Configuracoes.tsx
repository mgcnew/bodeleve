import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Box } from '@/components/Card'
import type { IconName } from '@/components/Icon'
import { Icon } from '@/components/Icon'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { canAccess } from '@/permissions/modules'
import { sessionStore } from '@/services/gestao/session'
import o from '@/styles/ops.module.css'
import { Bar, ListRow } from '../../../shared/OpsBits'
import s from './Configuracoes.module.css'

type Section = { group: string; id: string; title: string; sub: string; icon: IconName; owner?: boolean }

/** Seções de Configurações. As marcadas `owner` são da casa e só o dono vê; as demais são de cada pessoa. */
export const sections: Section[] = [
  { group: 'Minha conta', id: 'perfil', title: 'Meu perfil', sub: 'Nome, senha e PIN', icon: 'perfil' },
  { group: 'Minha conta', id: 'aparencia', title: 'Aparência e teclado', sub: 'Tema claro, escuro ou automático', icon: 'mais' },
  { group: 'A casa', id: 'casa', title: 'Dados da casa', sub: 'Nome, CNPJ, endereço e WhatsApp', icon: 'local', owner: true },
  { group: 'A casa', id: 'horarios', title: 'Horário de funcionamento', sub: 'Dias e horas em que a loja atende', icon: 'historico', owner: true },
  { group: 'A casa', id: 'loja', title: 'Loja online', sub: 'Pedido por WhatsApp e retirada na loja', icon: 'sacola', owner: true },
  { group: 'A casa', id: 'equipe', title: 'Equipe e permissões', sub: 'Quem acessa e com qual papel', icon: 'perfil', owner: true },
]

function useAllowed() {
  const role = sessionStore.useStore()?.role ?? 'clerk'
  return sections.filter((x) => !x.owner || canAccess(role, 'configuracoes'))
}

const groups = (list: Section[]) => [...new Set(list.map((x) => x.group))].map((g) => ({ title: g, items: list.filter((x) => x.group === g) }))

/** Moldura: no computador, lista de seções à esquerda e a seção aberta à direita */
export function Configuracoes() {
  const allowed = useAllowed()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const current = useLocation().pathname.split('/')[3]

  if (current && !allowed.some((x) => x.id === current)) return <Navigate to="/gestao/configuracoes/perfil" replace />
  if (!current && desktop) return <Navigate to="/gestao/configuracoes/perfil" replace />

  return (
    <div className={s.layout}>
      <nav aria-label="Configurações" className={s.nav}>
        <h2 className={s.navTitle}>Configurações</h2>
        {groups(allowed).map((g) => (
          <div key={g.title} className={s.group}>
            <div className={s.groupTitle}>{g.title}</div>
            {g.items.map((x) => (
              <NavLink key={x.id} to={`/gestao/configuracoes/${x.id}`}>
                <Icon name={x.icon} size={20} />
                <span>{x.title}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className={s.panel}>
        <Outlet />
      </div>
    </div>
  )
}

/** Celular e tablet: a lista de seções vira a tela inicial de Configurações */
export function ConfiguracoesLista() {
  const allowed = useAllowed()
  return (
    <div className={o.screen}>
      <Bar title="Configurações" back="/gestao/mais" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        {groups(allowed).map((g) => (
          <section key={g.title} className={o.section}>
            <h2 className={o.caps}>{g.title}</h2>
            <Box>
              {g.items.map((x) => (
                <ListRow key={x.id} icon={x.icon} title={x.title} sub={x.sub} to={`/gestao/configuracoes/${x.id}`} />
              ))}
            </Box>
          </section>
        ))}
      </main>
    </div>
  )
}
