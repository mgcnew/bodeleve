import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { adminUsers } from '@/mocks/adminSeed'
import { createMockServices } from '@/mocks/services'
import { useAdminSession } from '@/store/admin'
import { memoryStorage, renderApp, resetStores } from '@/test/renderApp'

const signInAs = (email: string) => {
  const u = adminUsers.find((x) => x.email === email)!
  useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
}
beforeEach(() => {
  resetStores()
  window.scrollTo = vi.fn()
  signInAs('ana@exemplo.com')
})
const money = (v: string) => new RegExp(`R\\$.${v.replace(/[.,]/g, '\\$&')}`)
const brl = (c: number) => `R$ ${(c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

describe('relatórios', () => {
  it('resumo do mês com as cinco linhas do quadro; só Vendas abre', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    const hub = await svc.admin.reports.hub()
    renderApp('/gestao/relatorios', { withSeedOrders: true })
    const vendas = (await screen.findByText('Vendas', { selector: 'span' })).closest('a')!
    expect(vendas).toHaveAttribute('href', '/gestao/relatorios/vendas')
    expect(vendas).toHaveTextContent('Balcão e loja online, por dia e forma de pagamento')
    expect(vendas.textContent?.replace(/\s/g, ' ')).toContain(brl(hub.salesCents).replace(/\s/g, ' '))
    expect(within(vendas.parentElement!).getByText('Produtos', { selector: 'span' }).closest('div')).toHaveTextContent(/Mais vendido: Queijo coalho 500 g · \d+ un/)
    expect(within(vendas.parentElement!).getByText('Produtos', { selector: 'span' }).closest('a')).toBeNull()
    expect(within(vendas.parentElement!).getByText('Estoque e perdas').closest('div')).toHaveTextContent(/Perdas no mês: 1 item\s*−\s*R\$.14,20/)
    expect(within(vendas.parentElement!).getByText('Produção').closest('div')).toHaveTextContent(/ordens? · rendimento médio \d+%/)
    expect(within(vendas.parentElement!).getByText('Resultado do mês').closest('div')).toHaveTextContent('Vendas menos custos e despesas pagas')
    expect(screen.getByText(/Números de .+ até hoje/)).toBeInTheDocument()
    expect(hub.bestSeller?.name).toBe('Queijo coalho 500 g')
  })

  it('vendas: abre em 7 dias com sete barras; tocar numa barra mostra o dia', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/relatorios/vendas', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true')
    const chart = await screen.findByRole('region', { name: 'Vendas por dia' })
    const bars = within(chart).getAllByRole('button')
    expect(bars).toHaveLength(7)
    expect(bars[6]).toHaveAttribute('aria-pressed', 'true')
    expect(bars[0]).toHaveAccessibleName(/^\d\d\/\d\d: R\$/)
    const label = bars[0].getAttribute('aria-label')!
    await user.click(bars[0])
    expect(bars[0]).toHaveAttribute('aria-pressed', 'true')
    expect(within(chart).getByRole('status')).toHaveTextContent(label.replace(': ', ' · ').replace(/\s/g, ' '))
    expect(screen.getByRole('region', { name: 'Por canal' })).toHaveTextContent('Balcão')
    expect(screen.getByRole('region', { name: 'Por forma de pagamento' })).toHaveTextContent('Dinheiro')
    expect(within(screen.getByRole('region', { name: 'Mais vendidos' })).getAllByText(/ un$/)).toHaveLength(3)
  })

  it('hoje: total do balcão e da loja, vendas, ticket médio e sem gráfico', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/relatorios/vendas', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Hoje' }))
    expect(await screen.findByText(money('1.346,50'))).toBeInTheDocument()
    expect(screen.getByText(/32 vendas · ticket médio R\$.42,08/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Vendas por dia' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Por canal' })).toHaveTextContent(/Balcão\s*R\$.892,00/)
    expect(screen.getByRole('region', { name: 'Por canal' })).toHaveTextContent(/Loja online\s*R\$.454,50/)
    expect(screen.getByRole('region', { name: 'Por forma de pagamento' })).toHaveTextContent(/Dinheiro\s*R\$.359,80/)
    const top = within(screen.getByRole('region', { name: 'Mais vendidos' }))
    expect(top.getByText('Farinha de mandioca 1 kg')).toBeInTheDocument()
    expect(top.getByText('Queijo coalho 500 g')).toBeInTheDocument()
  })

  it('mês: total do mês até hoje bate com o resumo', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    const hub = await svc.admin.reports.hub()
    const user = userEvent.setup()
    renderApp('/gestao/relatorios/vendas', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Mês' }))
    expect(await screen.findByText(/^01\/\d\d a \d\d\/\d\d$/)).toBeInTheDocument()
    expect((await screen.findAllByText(brl(hub.salesCents)))[0]).toBeInTheDocument()
  })

  it('um pedido novo da loja entra nas vendas de hoje', async () => {
    const storage = memoryStorage()
    const svc = createMockServices({ storage, withSeedOrders: true, code: () => '1234' })
    const before = (await svc.admin.reports.sales('today')).totalCents
    const o = await svc.orders.placeOrder({ items: [{ productId: 'queijo-coalho', qty: 2 }], fulfillment: 'pickup', contact: { name: 'Lúcia Prado', phone: '(00) 90000-0099' }, address: null, windowId: 'asap', payment: { method: 'cash', changeForCents: null } })
    const after = await svc.admin.reports.sales('today')
    expect(after.totalCents - before).toBe(o.totalCents)
    expect(after.cashCents).toBeGreaterThanOrEqual(o.totalCents)
  })

  it('atendente não vê relatórios; gestor vê', async () => {
    signInAs('julia@exemplo.com')
    const a = renderApp('/gestao/relatorios', { withSeedOrders: true })
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument()
    a.unmount()
    signInAs('ana@exemplo.com')
    renderApp('/gestao/relatorios', { withSeedOrders: true })
    expect(await screen.findByText('Resultado do mês')).toBeInTheDocument()
  })
})

describe('acessibilidade dos relatórios (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each(['/gestao/relatorios', '/gestao/relatorios/vendas'])('%s não tem violações', async (path) => {
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 250))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
