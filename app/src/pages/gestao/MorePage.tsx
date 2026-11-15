import { useNavigate } from 'react-router-dom'
import { Button } from '@/components'
import { can } from '@/permissions'
import { useAdminSession } from '@/store/admin'
import { entries, groupsInOrder } from '@/ui/gestao/modules'
import { LinkList } from '@/ui/loja/parts'
import s from '@/ui/gestao/gestao.module.css'
import l from '@/ui/loja/loja.module.css'

export function MorePage() {
  const user = useAdminSession((x) => x.user)
  const signOut = useAdminSession((x) => x.signOut)
  const navigate = useNavigate()
  return (
    <>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Mais</h1>
          <div className={s.date}>Todos os módulos da gestão</div>
        </div>
      </header>
      <main className={s.main}>
        {groupsInOrder.map((g) => {
          const rows = entries.filter((e) => e.group === g && can(user?.role, e.module))
          if (rows.length === 0) return null
          return (
            <section key={g} className={l.section} aria-label={g}>
              <div className={l.small} style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{g}</div>
              <LinkList rows={rows.map((e) => ({ href: e.to, icon: e.icon, title: e.label, detail: e.detail }))} />
            </section>
          )
        })}
        <div>
          <Button variant="ghost" onClick={() => { signOut(); navigate('/gestao/entrar') }}>Sair</Button>
        </div>
      </main>
    </>
  )
}
