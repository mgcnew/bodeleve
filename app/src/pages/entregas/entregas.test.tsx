import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { createMockServices } from '@/mocks/services'
import { useCourierSession } from '@/store/courier'
import { memoryStorage, renderApp, resetStores } from '@/test/renderApp'

beforeEach(() => {
  resetStores()
  window.scrollTo = vi.fn()
})
const money = (v: string) => new RegExp(`R\\$.${v.replace(/[.,]/g, '\\$&')}`)
const as = (id: string) => useCourierSession.setState({ courierId: id })

/** Deixa o pedido 1041 pronto, como no quadro (a gestão marca "pronto" em Pedidos). */
async function readyStorage(partners = false) {
  const storage = memoryStorage()
  const svc = createMockServices({ storage, withSeedOrders: true })
  const o = (await svc.admin.orders.get('1041'))!
  await svc.admin.orders.markReady('1041', o.items.map((i) => i.productId))
  if (partners) await svc.admin.deliveries.assign('1041', 'partners')
  return storage
}
const svcOf = (storage: ReturnType<typeof memoryStorage>) => createMockServices({ storage, withSeedOrders: true })

describe('entrar', () => {
  it('sem sessão volta para o login do entregador', async () => {
    const { router } = renderApp('/entregas', { withSeedOrders: true })
    await waitFor(() => expect(router.state.location.pathname).toBe('/entregas/entrar'))
  })

  it('número não cadastrado, código errado e código certo', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/entregas/entrar', { withSeedOrders: true })
    expect(await screen.findByText('Só entra quem a casa cadastrou: entregadores próprios e parceiros.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Celular'), '98')
    await user.click(screen.getByRole('button', { name: 'Receber código no WhatsApp' }))
    expect(await screen.findByText('Use o DDD e o número, por exemplo (00) 90000-0000.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Celular'))
    await user.type(screen.getByLabelText('Celular'), '00988880000')
    await user.click(screen.getByRole('button', { name: 'Receber código no WhatsApp' }))
    expect(await screen.findByText('Esse número não está cadastrado. Fale com a casa para entrar.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Celular'))
    await user.type(screen.getByLabelText('Celular'), '00900000300')
    await user.click(screen.getByRole('button', { name: 'Receber código no WhatsApp' }))
    expect(await screen.findByText('Código enviado para (00) 90000-0300.')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Dígito 1'))
    await user.keyboard('0000')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Código incorreto. Confira os números e tente de novo.')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Dígito 1'))
    await user.keyboard('1234')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/entregas'))
    expect(useCourierSession.getState().courierId).toBe('bruno')
  })
})

describe('lista', () => {
  it('entregador da casa: o pedido pronto aparece em Disponíveis e some quando alguém pega', async () => {
    as('bruno')
    const user = userEvent.setup()
    renderApp('/entregas', { withSeedOrders: true, storage: await readyStorage() })
    expect(await screen.findByRole('heading', { name: 'Entregas' })).toBeInTheDocument()
    expect(screen.getByText('Bruno · entregador da casa')).toBeInTheDocument()
    expect(screen.getByText('Disponível')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disponíveis · 1', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Minhas · 0' })).toBeInTheDocument()
    const card = screen.getByText('Pedido #1041').closest('div')!.parentElement!
    expect(card).toHaveTextContent('Bairro Alto')
    expect(card).toHaveTextContent('Rua do Sol, 88')
    expect(card).toHaveTextContent(/Distância\s*4,1 km/)
    expect(card).toHaveTextContent(/Itens\s*6/)
    expect(card).toHaveTextContent(/Cobrar\s*Nada/)
    expect(card).toHaveTextContent('Ainda sem entregador. Você pode pegar.')
    expect(screen.getByText('Como entregador da casa, você recebe as entregas que o balcão atribui e pode pegar as que estão livres.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pegar esta entrega' }))
    expect(await screen.findByText(/A entrega #1041 é sua\. Aceite para a loja saber\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Minhas · 1', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pedido #1041/ })).toHaveAttribute('href', '/entregas/pedido/1041')
    expect(screen.getByText('Para você')).toBeInTheDocument()
  })

  it('sem entrega pronta: lista vazia explica quando aparece algo', async () => {
    as('bruno')
    renderApp('/entregas', { withSeedOrders: true })
    expect(await screen.findByText('Nada disponível agora')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Minhas · 0' }))
    expect(screen.getByText('Nenhuma entrega com você')).toBeInTheDocument()
  })

  it('Carlos tem a entrega 1042 em rota em Minhas', async () => {
    as('carlos')
    renderApp('/entregas', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: 'Minhas · 1', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pedido #1042/ })).toHaveTextContent('Em rota')
  })

  it('parceiro: só vê o publicado, com o valor que recebe', async () => {
    as('diego')
    const user = userEvent.setup()
    renderApp('/entregas', { withSeedOrders: true, storage: await readyStorage(true) })
    expect(await screen.findByText('Diego · parceiro')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disponíveis · 1', pressed: true })).toBeInTheDocument()
    expect(screen.getByText(/Publicada para parceiros · você recebe R\$.9,00/)).toBeInTheDocument()
    expect(screen.getByText('Como parceiro, você vê só as entregas que a casa publicou e recebe por entrega.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: money('9,00') }))
    expect(await screen.findByRole('button', { name: 'Minhas · 1', pressed: true })).toBeInTheDocument()
  })

  it('fora do turno: avisa e não mostra o que está livre', async () => {
    as('bruno')
    const storage = await readyStorage()
    await svcOf(storage).admin.courier.setAvailable('bruno', false)
    renderApp('/entregas', { withSeedOrders: true, storage })
    expect(await screen.findByText('Fora do turno', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText(/Você está fora do turno\. Ligue/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disponíveis · 0' })).toBeInTheDocument()
  })
})

describe('as quatro etapas', () => {
  it('aceite → coleta → em rota → entregar com o código, até "Entregue"', async () => {
    as('bruno')
    const storage = await readyStorage()
    const user = userEvent.setup()
    const { router } = renderApp('/entregas/pedido/1041', { withSeedOrders: true, storage })
    // Etapa 1: aceite
    expect(await screen.findByText('Etapa 1 de 4 · Aceite')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Coletar em' })).toHaveTextContent('[ENDEREÇO DA LOJA] · balcão')
    expect(screen.getByRole('region', { name: 'Entregar para' })).toHaveTextContent(/Paula Reis.*Rua do Sol, 88 · Bairro Alto/)
    expect(screen.getByText('Distância').parentElement).toHaveTextContent('4,1 km')
    expect(screen.getByText('Volumes').parentElement).toHaveTextContent('1 sacola')
    expect(screen.getByText('Itens').parentElement).toHaveTextContent('6')
    expect(screen.getByText('Pago no Pix. Nada a cobrar.')).toBeInTheDocument()
    expect(screen.queryByText(/Você recebe por esta entrega/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pegar esta entrega' }))
    await user.click(await screen.findByRole('button', { name: 'Aceitar entrega' }))
    expect(await screen.findByText('Entrega aceita. A loja foi avisada.')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Ir para a coleta' }))
    // Etapa 2: coleta
    expect(await screen.findByText('Etapa 2 de 4 · Coleta')).toBeInTheDocument()
    expect(screen.getByText('Confira antes de sair')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confira os itens · 0 de 3' })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: '1 sacola térmica, lacrada' }))
    await user.click(screen.getByRole('checkbox', { name: 'Nota da casa com o pedido #1041' }))
    expect(screen.getByRole('button', { name: 'Confira os itens · 2 de 3' })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'Nada para cobrar (pago no Pix)' }))
    await user.click(screen.getByRole('button', { name: 'Saí da loja' }))
    // Etapa 3: em rota
    await waitFor(() => expect(router.state.location.pathname).toBe('/entregas/pedido/1041/rota'))
    expect(await screen.findByText('Etapa 3 de 4 · Em rota')).toBeInTheDocument()
    expect(screen.getByText('[MAPA DA ROTA]')).toBeInTheDocument()
    expect(screen.getByText('4,1 km · cerca de 12 min')).toBeInTheDocument()
    expect(screen.getByText(/Pedido a caminho desde \d\dh\d\d no acompanhamento da loja\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir no mapa/ })).toHaveAttribute('href', expect.stringContaining('https://www.google.com/maps/search/?api=1&query=Rua%20do%20Sol'))
    expect(screen.getByRole('link', { name: /Ligar/ })).toHaveAttribute('href', 'tel:00900000003')
    expect(screen.getByText('“Abrir no mapa” usa o app de mapas do celular; nesta versão, sem rastreio em tempo real.')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Cheguei' }))
    // Etapa 4: entregar
    expect(await screen.findByText('Etapa 4 de 4 · Entrega')).toBeInTheDocument()
    expect(screen.getByText('Peça o código a quem comprou')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeDisabled()
    await user.click(screen.getByLabelText('Dígito 1'))
    await user.keyboard('0000')
    await user.click(screen.getByRole('button', { name: 'Confirmar entrega' }))
    expect(await screen.findByText('Código não confere. Confira com quem comprou.')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Dígito 1'))
    await user.keyboard('2290')
    await user.click(screen.getByRole('button', { name: 'Confirmar entrega' }))
    expect(await screen.findByRole('heading', { name: 'Entregue' })).toBeInTheDocument()
    expect(screen.getByText(/Pedido #1041 · \d\dh\d\d · a loja e quem comprou veem o pedido como entregue\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Próxima entrega' })).toHaveAttribute('href', '/entregas')
    expect(screen.getByRole('link', { name: 'Ver histórico' })).toHaveAttribute('href', '/entregas/historico')
    // a loja e quem comprou veem
    const svc = svcOf(storage)
    expect((await svc.admin.orders.get('1041'))?.status).toBe('delivered')
  })

  it('devolução: motivo, aviso, desfazer volta à rota', async () => {
    as('bruno')
    const storage = await readyStorage()
    const s = svcOf(storage)
    await s.admin.courier.take('bruno', '1041')
    await s.admin.courier.accept('bruno', '1041')
    await s.admin.courier.depart('bruno', '1041')
    const user = userEvent.setup()
    renderApp('/entregas/pedido/1041/problema', { withSeedOrders: true, storage })
    expect(await screen.findByText('O que aconteceu?')).toBeInTheDocument()
    expect(screen.getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual(['Cliente não atende', 'Endereço não encontrado', 'Cliente recusou o pedido', 'Cliente sem o código', 'Outro'])
    expect(screen.getByRole('radio', { name: 'Cliente não atende' })).toBeChecked()
    expect(screen.getByLabelText('Foto do local (opcional)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tentar de novo' })).toHaveAttribute('href', '/entregas/pedido/1041/rota')
    await user.click(screen.getByRole('radio', { name: 'Endereço não encontrado' }))
    await user.type(screen.getByLabelText('Detalhe (opcional)'), 'Rua sem número')
    await user.click(screen.getByRole('button', { name: 'Devolver à loja' }))
    expect(await screen.findByRole('heading', { name: 'Devolução registrada' })).toBeInTheDocument()
    expect(screen.getByText('Leve o pedido #1041 de volta à loja e entregue no balcão. A loja foi avisada e decide se reenvia.')).toBeInTheDocument()
    expect((await s.admin.courier.history('bruno')).returned).toBe(1)
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(await screen.findByText('O que aconteceu?')).toBeInTheDocument()
    expect((await s.admin.courier.history('bruno')).returned).toBe(0)
  })

  it('"quem comprou não tem o código" abre o problema com esse motivo', async () => {
    as('bruno')
    const storage = await readyStorage()
    const s = svcOf(storage)
    await s.admin.courier.take('bruno', '1041')
    await s.admin.courier.accept('bruno', '1041')
    await s.admin.courier.depart('bruno', '1041')
    const user = userEvent.setup()
    renderApp('/entregas/pedido/1041/entregar', { withSeedOrders: true, storage })
    await user.click(await screen.findByRole('link', { name: 'Quem comprou não tem o código' }))
    expect(await screen.findByRole('radio', { name: 'Cliente sem o código' })).toBeChecked()
  })

  it('parceiro: aceita por R$ 9,00 e vê quanto recebe na entrega', async () => {
    as('diego')
    const storage = await readyStorage(true)
    const user = userEvent.setup()
    renderApp('/entregas/pedido/1041', { withSeedOrders: true, storage })
    expect(await screen.findByText('Você recebe por esta entrega')).toBeInTheDocument()
    expect(screen.getByText('Você recebe por esta entrega').parentElement).toHaveTextContent(money('9,00'))
    await user.click(screen.getByRole('button', { name: money('9,00') }))
    await user.click(await screen.findByRole('button', { name: /Aceitar por R\$.9,00/ }))
    expect(await screen.findByText('Entrega aceita. A loja foi avisada.')).toBeInTheDocument()
  })

  it('entrega de outra pessoa ou inexistente não abre', async () => {
    as('bruno')
    renderApp('/entregas/pedido/1042', { withSeedOrders: true })
    expect(await screen.findByText('Entrega não encontrada')).toBeInTheDocument()
  })

  it('coleta antes do aceite pede para aceitar primeiro', async () => {
    as('bruno')
    renderApp('/entregas/pedido/1041/coleta', { withSeedOrders: true, storage: await readyStorage() })
    expect(await screen.findByText('Aceite a entrega primeiro')).toBeInTheDocument()
  })
})

describe('histórico e perfil', () => {
  it('entregador da casa: entregas, devolução e km, sem valores; nota de pagamento mensal', async () => {
    as('bruno')
    renderApp('/entregas/historico', { withSeedOrders: true })
    expect(await screen.findByRole('heading', { name: 'Histórico' })).toBeInTheDocument()
    await screen.findByText('Rodados')
    expect(screen.getByText('Entregas', { selector: 'div' })).toHaveTextContent('1')
    expect(screen.getByText('Devoluções', { selector: 'div' })).toHaveTextContent('0')
    expect(screen.getByText('Rodados', { selector: 'div' })).toHaveTextContent('1,8 km')
    expect(screen.getByText('#1038 · Centro').closest('div')).toHaveTextContent(/\d\dh\d\d · 1,8 km/)
    expect(screen.queryByText('A receber hoje')).not.toBeInTheDocument()
    expect(screen.getByText('Entregador da casa: o pagamento é mensal, combinado com a loja. O histórico serve para conferência.')).toBeInTheDocument()
  })

  it('parceiro: valor por entrega e o que recebe hoje', async () => {
    as('diego')
    renderApp('/entregas/historico', { withSeedOrders: true })
    expect(await screen.findByText('#1036 · Bairro Alto')).toBeInTheDocument()
    expect(screen.getByText('#1036 · Bairro Alto').closest('div')!.parentElement).toHaveTextContent(money('9,00'))
    expect(screen.getByText('A receber hoje').parentElement).toHaveTextContent(money('9,00'))
    expect(screen.getByText('1 entrega × R$ 9,00 + 0 devoluções × R$ 4,50. Pago por Pix toda segunda.')).toBeInTheDocument()
  })

  it('perfil: disponibilidade liga e desliga; parceiro guarda a chave Pix; sair volta ao login', async () => {
    as('diego')
    const storage = memoryStorage()
    const user = userEvent.setup()
    const { router } = renderApp('/entregas/perfil', { withSeedOrders: true, storage })
    expect(await screen.findByText('Diego')).toBeInTheDocument()
    expect(screen.getByText('Parceiro', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Veículo').parentElement).toHaveTextContent('Moto · [PLACA]')
    expect(screen.getByText('Celular').parentElement).toHaveTextContent('(00) 90000-0302')
    expect(screen.getByText('Pagamento').parentElement).toHaveTextContent('Por entrega, Pix às segundas')
    const sw = screen.getByRole('switch', { name: 'Disponível para entregas' })
    expect(sw).toBeChecked()
    await user.click(sw)
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Disponível para entregas' })).not.toBeChecked())
    await user.type(screen.getByLabelText('Chave Pix para receber'), 'diego@exemplo.com')
    await user.tab()
    expect(await screen.findByText(/Chave Pix salva/)).toBeInTheDocument()
    expect((await svcOf(storage).admin.courier.profile('diego'))).toMatchObject({ available: false, pixKey: 'diego@exemplo.com' })
    await user.click(screen.getByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/entregas/entrar'))
    expect(useCourierSession.getState().courierId).toBeNull()
  })

  it('o entregador da casa não vê o campo de Pix', async () => {
    as('bruno')
    renderApp('/entregas/perfil', { withSeedOrders: true })
    expect(await screen.findByText('Entregador da casa', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Chave Pix para receber')).not.toBeInTheDocument()
    expect(screen.getByText('Pagamento').parentElement).toHaveTextContent('Mensal, pela casa')
  })
})

describe('integração com a gestão', () => {
  it('o painel de entregas da gestão acompanha o que o entregador faz', async () => {
    const storage = await readyStorage()
    const s = svcOf(storage)
    await s.admin.courier.take('bruno', '1041')
    let row = (await s.admin.deliveries.overview()).rows.find((r) => r.orderId === '1041')
    expect(row).toMatchObject({ label: 'Atribuída' })
    await s.admin.courier.accept('bruno', '1041')
    await s.admin.courier.depart('bruno', '1041')
    row = (await s.admin.deliveries.overview()).rows.find((r) => r.orderId === '1041')
    expect(row).toMatchObject({ tab: 'route', label: 'Em rota' })
    const tracking = await s.admin.orders.get('1041')
    expect(tracking).toMatchObject({ status: 'out_for_delivery', courierName: 'Bruno' })
  })
})

describe('acessibilidade do app de Entregas (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it('login', async () => {
    const { container } = renderApp('/entregas/entrar', { withSeedOrders: true })
    expect(await axe(container, rules)).toHaveNoViolations()
  })
  it.each(['/entregas', '/entregas/historico', '/entregas/perfil'])('%s não tem violações', async (path) => {
    as('bruno')
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 250))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
  it.each(['', '/rota', '/coleta', '/entregar', '/problema'])('entrega %s não tem violações', async (suffix) => {
    as('bruno')
    const storage = await readyStorage()
    const s = svcOf(storage)
    await s.admin.courier.take('bruno', '1041')
    if (suffix !== '') await s.admin.courier.accept('bruno', '1041')
    if (suffix === '/rota' || suffix === '/entregar' || suffix === '/problema') await s.admin.courier.depart('bruno', '1041')
    const { container } = renderApp(`/entregas/pedido/1041${suffix}`, { withSeedOrders: true, storage })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 250))
    expect(await axe(container, rules)).toHaveNoViolations()
    expect(within(container).queryByText('Entrega não encontrada')).toBeNull()
  })
})
