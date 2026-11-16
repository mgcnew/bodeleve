import { useNavigate } from 'react-router-dom'
import { Box } from '@/components/Card'
import { Button } from '@/components/Button'
import type { IconName } from '@/components/Icon'
import { canAccess, type Module } from '@/permissions/modules'
import { sessionStore, signOut } from '@/services/gestao/session'
import o from '@/styles/ops.module.css'
import { ListRow, PageHeader } from '../../shared/OpsBits'

type Entry = { module: Module; icon: IconName; title: string; sub: string; to: string }

// Hub agrupado (INFORMATION_ARCHITECTURE.md)
const groups: { title: string; entries: Entry[] }[] = [
  {
    title: 'Abastecer',
    entries: [
      { module: 'compras', icon: 'compras', title: 'Compras', sub: 'Pedidos de compra e recebimento', to: '/gestao/compras' },
      { module: 'fornecedores', icon: 'entregas', title: 'Fornecedores', sub: 'Contatos e histórico de compras', to: '/gestao/fornecedores' },
      { module: 'producao', icon: 'producao', title: 'Produção', sub: 'Fichas técnicas e ordens de produção', to: '/gestao/producao' },
    ],
  },
  { title: 'Catálogo', entries: [{ module: 'produtos', icon: 'vender', title: 'Produtos e categorias', sub: 'Preço, origem, publicação na loja', to: '/gestao/produtos' }] },
  {
    title: 'Relacionamento',
    entries: [
      { module: 'clientes', icon: 'perfil', title: 'Clientes', sub: 'Histórico e contato', to: '/gestao/clientes' },
      { module: 'entregas', icon: 'local', title: 'Entregas', sub: 'Atribuir e acompanhar entregadores', to: '/gestao/entregas' },
    ],
  },
  { title: 'Análise', entries: [{ module: 'relatorios', icon: 'historico', title: 'Relatórios', sub: 'Vendas, estoque, financeiro', to: '/gestao/relatorios' }] },
  { title: 'Sistema', entries: [{ module: 'configuracoes', icon: 'mais', title: 'Configurações', sub: 'Casa, equipe e permissões', to: '/gestao/configuracoes' }] },
]

export function Mais() {
  const session = sessionStore.useStore()
  const navigate = useNavigate()
  const role = session?.role ?? 'clerk'

  return (
    <div className={o.screen}>
      <PageHeader title="Mais" sub="Todos os módulos da gestão" />
      <main className={o.main}>
        {groups.map((g) => {
          const entries = g.entries.filter((e) => canAccess(role, e.module))
          if (entries.length === 0) return null
          return (
            <section key={g.title} className={o.section}>
              <h2 className={o.caps}>{g.title}</h2>
              <Box>
                {entries.map((e) => (
                  <ListRow key={e.to} icon={e.icon} title={e.title} sub={e.sub} to={e.to} />
                ))}
              </Box>
            </section>
          )
        })}
        <Button
          variant="quiet"
          style={{ alignSelf: 'flex-start', padding: 0 }}
          onClick={() => {
            signOut()
            navigate('/gestao/entrar')
          }}
        >
          Sair
        </Button>
      </main>
    </div>
  )
}
