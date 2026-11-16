import { AppLink } from '@/components'
import { adminUsers, MOCK_ADMIN_PASSWORD, MOCK_COURIER_CODE, MOCK_MANAGER_PINS } from '@/mocks/adminSeed'
import { MOCK_LOGIN_CODE } from '@/mocks/services'
import { delivery } from '@/config/delivery'
import s from '@/ui/loja/loja.module.css'

const card = { display: 'flex', flexDirection: 'column', gap: 4, padding: 16, borderRadius: 12, border: '1px solid var(--linha)', background: 'var(--superficie)', color: 'var(--texto)', textDecoration: 'none' } as const

/** Atalhos da demonstração: cada ambiente com a conta de teste. Só existe em desenvolvimento e na demonstração (config/preview.ts). */
export function Launcher() {
  const link = (href: string, title: string, detail: string) => (
    <AppLink href={href} style={card}>
      <b>{title}</b>
      <span className={s.sub}>{detail}</span>
    </AppLink>
  )
  const staff = (email: string) => adminUsers.find((u) => u.email === email)!
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 className={s.h1}>Bodeleve · demonstração</h1>
      <p className={s.sub}>Tudo aqui é simulado no navegador: nenhum banco, pagamento ou mensagem é real. Os dados ficam só neste navegador.</p>
      {link('/', 'Loja online', 'Sem conta. Para entrar na conta, o código de teste é ' + MOCK_LOGIN_CODE + '.')}
      {link('/gestao/entrar', 'Gestão', `Senha de todos: ${MOCK_ADMIN_PASSWORD}. Dono: ${staff('dono@exemplo.com').email} · gestor: ${staff('ana@exemplo.com').email} · atendente: ${staff('julia@exemplo.com').email} · produção: ${staff('raimundo@exemplo.com').email}`)}
      {link('/pdv', 'PDV (balcão)', `Entre pela Gestão como atendente (${staff('julia@exemplo.com').email}) ou gestor. Senha do gestor para cancelar venda: ${MOCK_MANAGER_PINS['u-ana'].pin}.`)}
      {link('/entregas/entrar', 'Entregas', `Código ${MOCK_COURIER_CODE}. ${delivery.couriers.map((c) => `${c.name} ${c.phone}${c.kind === 'partner' ? ' (parceiro)' : ''}`).join(' · ')}`)}
      {link('/design-system', 'Design system', 'Catálogo de componentes.')}
      <p className={s.sub}>Para ver uma entrega do começo ao fim: na Gestão, abra o pedido #1041 e marque como pronto; entre em Entregas como Bruno, pegue e aceite; informe o código do pedido (2290).</p>
    </main>
  )
}
