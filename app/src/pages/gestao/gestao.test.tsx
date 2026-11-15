import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { adminUsers, MOCK_ADMIN_PASSWORD } from '@/mocks/adminSeed'
import { createMockServices } from '@/mocks/services'
import { useAdminSession } from '@/store/admin'
import { memoryStorage, renderApp, resetStores } from '@/test/renderApp'

beforeEach(() => {
  resetStores()
  window.scrollTo = vi.fn()
})

const money = (v: string) => new RegExp(`R\\$.${v.replace(/[.,]/g, '\\$&')}`)
const signInAs = (email: string) => {
  const u = adminUsers.find((x) => x.email === email)!
  useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
}

describe('acesso da equipe', () => {
  it('sem login, qualquer tela da gestão manda para a entrada', async () => {
    const { router } = renderApp('/gestao/pedidos')
    await waitFor(() => expect(router.state.location.pathname).toBe('/gestao/entrar'))
  })

  it('senha errada é recusada; senha certa entra no início', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/gestao/entrar', { withSeedOrders: true })
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
    await user.type(screen.getByLabelText('Senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText(/E-mail ou senha incorretos/)).toBeInTheDocument()
    expect(useAdminSession.getState().user).toBeNull()
    await user.clear(screen.getByLabelText('Senha'))
    await user.type(screen.getByLabelText('Senha'), MOCK_ADMIN_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/gestao'))
    expect(useAdminSession.getState().user?.role).toBe('manager')
  })

  it('atendente só vê Pedidos e cai direto neles; estoque é bloqueado', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/gestao/entrar')
    await user.type(screen.getByLabelText('E-mail'), 'julia@exemplo.com')
    await user.type(screen.getByLabelText('Senha'), MOCK_ADMIN_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/gestao/pedidos'))
    const nav = screen.getByRole('navigation', { name: 'Navegação da gestão' })
    expect(within(nav).queryByRole('link', { name: 'Estoque' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Pedidos' })).toBeInTheDocument()
    await router.navigate('/gestao/estoque')
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument()
  })

  it('entregador é encaminhado ao app de Entregas', async () => {
    signInAs('carlos@exemplo.com')
    renderApp('/gestao')
    expect(await screen.findByText('Entregadores usam o app de Entregas')).toBeInTheDocument()
  })

  it('só o dono vê Equipe e configurações no menu', async () => {
    signInAs('ana@exemplo.com')
    const { unmount } = renderApp('/gestao/mais')
    expect(await screen.findByRole('heading', { name: 'Mais' })).toBeInTheDocument()
    expect(screen.queryAllByRole('link', { name: /Configurações/ })).toHaveLength(0)
    unmount()
    signInAs('dono@exemplo.com')
    renderApp('/gestao/mais')
    expect((await screen.findAllByRole('link', { name: /Configurações/ })).length).toBeGreaterThan(0)
  })
})

describe('início', () => {
  it('soma vendas da internet (calculadas dos pedidos) com o balcão e mostra o que pede ação', async () => {
    signInAs('ana@exemplo.com')
    renderApp('/gestao', { withSeedOrders: true })
    expect(await screen.findByText('Vendas de hoje')).toBeInTheDocument()
    // 6 pedidos online do dia = R$ 454,50; balcão de exemplo = R$ 892,00 (26 vendas)
    expect(screen.getByText(money('454,50'))).toBeInTheDocument()
    expect(screen.getByText('Internet · 6')).toBeInTheDocument()
    expect(screen.getByText('Balcão · 26')).toBeInTheDocument()
    expect(screen.getByText(money('1.346,50'))).toBeInTheDocument()
    expect(screen.getByText('2 pedidos novos')).toBeInTheDocument()
    expect(screen.getByText(/Aguardando aceite · o mais antigo há 10 min/)).toBeInTheDocument()
    // "Pedidos em aberto" = novos + em preparo, como no quadro (4: 2 novos · 2 em preparo)
    expect(screen.getByText('2 novos · 2 em preparo')).toBeInTheDocument()
  })

  it('sem pedidos novos, não aparece o alerta de pedidos', async () => {
    signInAs('ana@exemplo.com')
    renderApp('/gestao')
    await screen.findByText('Pede ação hoje')
    expect(screen.queryByText(/pedidos? novos?/)).not.toBeInTheDocument()
  })
})

describe('pedidos', () => {
  it('lista abre em "Novos" e conta cada situação', async () => {
    signInAs('ana@exemplo.com')
    renderApp('/gestao/pedidos', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: 'Novos · 2' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Em preparo · 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Prontos · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Em rota · 1' })).toBeInTheDocument()
    const card = screen.getByText('#1043 · Maria Lima').closest('a')!
    expect(card).toHaveTextContent('Entrega · 3 itens')
    expect(card).toHaveTextContent('Pix · pago')
    expect(card).toHaveTextContent(money('63,70'))
    // pedido de retirada pago na loja
    expect(screen.getByText('#1044 · João Pedro').closest('a')).toHaveTextContent('Pagar na retirada')
  })

  it('trocar de filtro mostra os outros pedidos', async () => {
    const user = userEvent.setup()
    signInAs('ana@exemplo.com')
    renderApp('/gestao/pedidos', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Em rota · 1' }))
    expect(screen.getByText('#1042 · Ana Souza')).toBeInTheDocument()
    expect(screen.queryByText('#1043 · Maria Lima')).not.toBeInTheDocument()
  })

  it('sem pedidos: estado vazio do design system', async () => {
    signInAs('ana@exemplo.com')
    renderApp('/gestao/pedidos')
    expect(await screen.findByText('Nenhum pedido pendente')).toBeInTheDocument()
  })

  it('separação: aceitar, conferir item a item com lote, marcar pronto e desfazer', async () => {
    const user = userEvent.setup()
    signInAs('ana@exemplo.com')
    renderApp('/gestao/pedidos/1043', { withSeedOrders: true })
    expect(await screen.findByText('Cliente e entrega')).toBeInTheDocument()
    expect(screen.getByText(/\(00\) 90000-0001 · cliente desde 03\/2026 · 5 pedidos/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Aceitar e começar a separar' }))

    // Separando: cada item com o lote que vence primeiro
    expect(await screen.findByText('Separando')).toBeInTheDocument()
    expect(screen.getByText(/Lote QC-1107 · vence \d{2}\/\d{2}/)).toBeInTheDocument()
    expect(screen.getByText(/Lote FM-0921$/)).toBeInTheDocument() // sem validade, sem "vence"
    const blocked = screen.getByRole('button', { name: /Confira os itens · 0 de 3 conferidos/ })
    expect(blocked).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: /Queijo coalho/ }))
    await user.click(screen.getByRole('checkbox', { name: /Farinha de mandioca/ }))
    expect(screen.getByRole('button', { name: /2 de 3 conferidos/ })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: /Tapioca granulada/ }))
    await user.click(screen.getByRole('button', { name: 'Marcar como pronto' }))

    expect(await screen.findByText('Pronto. Aguardando entregador.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(await screen.findByText('Separando')).toBeInTheDocument()
  })

  it('pedido de retirada pronto diz "aguardando retirada"', async () => {
    const user = userEvent.setup()
    signInAs('ana@exemplo.com')
    renderApp('/gestao/pedidos/1040', { withSeedOrders: true })
    await screen.findByText('Separando')
    for (const box of screen.getAllByRole('checkbox')) await user.click(box)
    await user.click(screen.getByRole('button', { name: 'Marcar como pronto' }))
    expect(await screen.findByText('Pronto. Aguardando retirada.')).toBeInTheDocument()
  })
})

describe('loja e gestão enxergam o mesmo pedido', () => {
  it('pedido feito na loja entra como novo na gestão e o status volta para o cliente', async () => {
    const svc = createMockServices({ storage: memoryStorage(), code: () => '9999' })
    const order = await svc.orders.placeOrder({
      items: [{ productId: 'queijo-coalho', qty: 1 }],
      fulfillment: 'pickup',
      contact: { name: 'Bia Costa', phone: '(11) 98765-4321' },
      address: null,
      windowId: 'asap',
      payment: { method: 'cash', changeForCents: null },
    })
    expect(order.id).toBe('1045')
    const open = await svc.admin.orders.listOpen()
    expect(open.map((o) => o.id)).toEqual(['1045'])
    expect(open[0].customerOrderCount).toBe(1)
    expect(open[0].payment.paid).toBe(false) // nada é cobrado sem provedor (D21)

    await svc.admin.orders.accept('1045')
    const seenByCustomer = await svc.orders.getOrder('1045')
    expect(seenByCustomer?.status).toBe('preparing')
    // outro cliente não enxerga pedido de quem comprou em outro aparelho
    expect((await svc.orders.listOrders()).map((o) => o.id)).toEqual(['1045'])
  })

  it('não deixa marcar pronto sem conferir todos os itens (regra no serviço, não só na tela)', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    await expect(svc.admin.orders.markReady('1041', ['queijo-manteiga'])).rejects.toThrow('items_not_checked')
    await expect(svc.admin.orders.accept('1041')).rejects.toThrow('invalid_transition')
  })
})

describe('acessibilidade da gestão (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each([
    ['/gestao/entrar', false],
    ['/gestao', true],
    ['/gestao/pedidos', true],
    ['/gestao/pedidos/1043', true],
    ['/gestao/pedidos/1041', true],
    ['/gestao/pedidos/1039', true],
    ['/gestao/mais', true],
    ['/gestao/estoque', true],
  ])('%s não tem violações', async (path, logged) => {
    if (logged) signInAs('dono@exemplo.com')
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 80))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
