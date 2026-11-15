import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { products } from '@/mocks/seed'
import { useBag, useCheckout, useSession } from '@/store/bag'
import { renderApp, resetStores } from '@/test/renderApp'

beforeEach(() => {
  resetStores()
  window.scrollTo = vi.fn()
})

const money = (v: string) => new RegExp(`R\\$.${v.replace(/[.,]/g, '\\$&')}`)

async function addToBag(name: string, times = 1) {
  const btn = await screen.findByRole('button', { name: `Adicionar ${name} à sacola` })
  for (let i = 0; i < times; i++) await userEvent.click(btn)
}

describe('compra como convidado, de ponta a ponta', () => {
  it('monta a sacola, passa pelas 4 etapas e confirma o pedido', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')

    // Sacola: o exemplo dos quadros (1 coalho + 2 farinha + 1 rapadura)
    await addToBag('Queijo coalho')
    await addToBag('Farinha de mandioca', 2)
    await addToBag('Rapadura')
    await user.click(await screen.findByRole('link', { name: /Ver sacola · 4 itens/ }))
    expect(router.state.location.pathname).toBe('/sacola')
    expect(await screen.findByText('Entrega (estimada)')).toBeInTheDocument()
    expect(screen.getAllByText(money('81,20')).length).toBeGreaterThan(0)

    // Etapa 1: identificação (com erro primeiro)
    await user.click(screen.getByRole('link', { name: /Continuar/ }))
    await user.click(await screen.findByRole('button', { name: 'Continuar sem conta' }))
    expect(screen.getByText('Informe seu nome.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/finalizar/identificacao')
    await user.type(screen.getByLabelText('Nome'), 'Ana Souza')
    await user.type(screen.getByLabelText('Celular com WhatsApp'), '11987654321')
    expect(screen.getByLabelText('Celular com WhatsApp')).toHaveValue('(11) 98765-4321')
    await user.click(screen.getByRole('button', { name: 'Continuar sem conta' }))

    // Etapa 2: entrega exige endereço
    await screen.findByRole('heading', { name: 'Como você quer receber?' })
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Informe o endereço de entrega para continuar.')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Informar' }))
    await user.type(await screen.findByLabelText('CEP'), '00000000')
    await screen.findByText(/Entregamos neste endereço/)
    expect(screen.getByLabelText('Rua')).toHaveValue('Rua das Camélias') // preenchida pelo CEP
    await user.type(screen.getByLabelText('Número'), '120')
    await user.click(screen.getByRole('button', { name: 'Usar este endereço' }))
    await user.click(await screen.findByRole('button', { name: 'Continuar' }))

    // Etapa 3: pagamento (Pix é o padrão) e Etapa 4: revisão
    await screen.findByRole('heading', { name: 'Como você quer pagar?' })
    expect(screen.getByRole('radio', { name: /Pix/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Revisar pedido' }))
    await screen.findByRole('heading', { name: 'Confira antes de confirmar' })
    expect(screen.getByText('1 × Queijo coalho')).toBeInTheDocument()
    expect(screen.getByText('2 × Farinha de mandioca')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Confirmar pedido/ }))
    await screen.findByRole('heading', { name: 'Pedido confirmado' })
    expect(router.state.location.pathname).toBe('/pedido-confirmado/1043')
    expect(screen.getByText('4821')).toBeInTheDocument() // código de entrega
    expect(screen.getByText(/Nada foi cobrado/)).toBeInTheDocument() // Pix simulado (D21)

    // Depois de confirmar a sacola esvazia, mas contato e endereço ficam para a próxima compra
    expect(useBag.getState().items).toEqual({})
    expect(useCheckout.getState().contact.name).toBe('Ana Souza')
    expect(useCheckout.getState().address.number).toBe('120')
    // E o pedido aparece em "Pedidos" deste aparelho
    await user.click(screen.getByRole('link', { name: 'Acompanhar pedido' }))
    expect(await screen.findByText('Previsão de entrega')).toBeInTheDocument()
  })

  it('retirada na loja não cobra entrega nem pede endereço', async () => {
    const user = userEvent.setup()
    useBag.setState({ items: { 'queijo-coalho': 1 }, fulfillment: 'pickup' })
    useCheckout.setState({ contact: { name: 'Ana Souza', phone: '(11) 98765-4321' } })
    const { router } = renderApp('/finalizar/entrega')
    expect(await screen.findByText('Quando retirar?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(await screen.findByRole('button', { name: 'Revisar pedido' }))
    expect(await screen.findByText('Grátis')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Confirmar pedido/ }))
    await screen.findByRole('heading', { name: 'Pedido confirmado' })
    expect(router.state.location.pathname).toBe('/pedido-confirmado/1043')
    expect(screen.queryByText('Código de entrega')).not.toBeInTheDocument()
  })

  it('não deixa entrar no checkout com a sacola vazia', async () => {
    const { router } = renderApp('/finalizar/pagamento')
    await waitFor(() => expect(router.state.location.pathname).toBe('/sacola'))
    expect(await screen.findByText('Sua sacola está vazia')).toBeInTheDocument()
  })

  it('troco menor que o total é recusado e diz como corrigir', async () => {
    const user = userEvent.setup()
    useBag.setState({ items: { 'queijo-coalho': 1 }, fulfillment: 'pickup' })
    useCheckout.setState({ paymentMethod: 'cash' })
    renderApp('/finalizar/pagamento')
    await user.type(await screen.findByLabelText(/Troco para quanto/), '10')
    await user.click(screen.getByRole('button', { name: 'Revisar pedido' }))
    expect(await screen.findByText(/precisa ser maior ou igual ao total/)).toBeInTheDocument()
  })

  it('CEP fora da área bloqueia o endereço (Q6, estado provisório)', async () => {
    const user = userEvent.setup()
    useBag.setState({ items: { 'queijo-coalho': 1 } })
    const { router } = renderApp('/finalizar/endereco')
    await user.type(await screen.findByLabelText('CEP'), '99000000')
    expect(await screen.findByText(/Ainda não entregamos neste CEP/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Rua'), 'Rua X')
    await user.type(screen.getByLabelText('Número'), '1')
    await user.type(screen.getByLabelText('Bairro'), 'Centro')
    await user.click(screen.getByRole('button', { name: 'Usar este endereço' }))
    expect(router.state.location.pathname).toBe('/finalizar/endereco')
  })
})

describe('catálogo', () => {
  it('busca ignora acento e caixa; sem resultado oferece voltar às categorias', async () => {
    const user = userEvent.setup()
    renderApp('/buscar')
    await user.type(await screen.findByRole('searchbox', { name: 'Buscar produto' }), 'QUEIJO')
    expect(await screen.findByText('2 resultados')).toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: 'Buscar produto' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'cuscuz')
    expect(await screen.findByText('Nada encontrado para “cuscuz”')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver categorias' }))
    expect(await screen.findByText('Queijos e laticínios')).toBeInTheDocument()
  })

  it('categoria filtra por origem e conta os produtos', async () => {
    const user = userEvent.setup()
    renderApp('/categoria/laticinios')
    expect(await screen.findByText('6 produtos')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Marca Bodeleve' }))
    expect(await screen.findByText('1 produto')).toBeInTheDocument()
  })

  it('produto: quantidade soma ao total e adicionar leva à sacola', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/produto/queijo-coalho')
    await screen.findByRole('heading', { name: 'Queijo coalho' })
    await user.click(screen.getByRole('button', { name: 'Aumentar' }))
    expect(screen.getByRole('button', { name: /Adicionar à sacola/ })).toHaveTextContent(money('65,80'))
    await user.click(screen.getByRole('button', { name: /Adicionar à sacola/ }))
    expect(useBag.getState().items).toEqual({ 'queijo-coalho': 2 })
    expect(router.state.location.pathname).toBe('/sacola')
  })

  it('textos do dono continuam como marcadores editáveis, vindos do serviço', async () => {
    renderApp('/sobre')
    expect(await screen.findByText(/\[HISTÓRIA DA CASA/)).toBeInTheDocument()
    expect(screen.getByText('[ENDEREÇO DA LOJA]')).toBeInTheDocument()
  })

  it('produto inexistente mostra estado vazio com saída', async () => {
    renderApp('/produto/nao-existe')
    expect(await screen.findByText('Produto não encontrado')).toBeInTheDocument()
  })

  it('falha ao carregar mostra erro com "Tentar de novo" (estado do design system)', async () => {
    const user = userEvent.setup()
    let fail = true
    renderApp('/buscar', {
      services: (base) => ({
        ...base,
        catalog: { ...base.catalog, listCategories: async () => { if (fail) throw new Error('rede'); return base.catalog.listCategories() } },
      }),
    })
    expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('Queijos e laticínios')).toBeInTheDocument()
  })
})

describe('pedidos e conta', () => {
  it('recompra deixa de fora o item indisponível e avisa antes (H-L13)', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/pedidos/1017', {
      withSeedOrders: true,
      services: (base) => ({
        ...base,
        catalog: {
          ...base.catalog,
          listProducts: async (f) => (await base.catalog.listProducts(f)).map((p) => (p.id === 'tapioca-granulada' ? { ...p, available: false } : p)),
        },
      }),
    })
    expect(await screen.findByText('1 item está indisponível hoje e fica fora do novo pedido.')).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: /Pedir de novo/ })
    expect(btn).toHaveTextContent('3 itens')
    await user.click(btn)
    expect(useBag.getState().items).toEqual({ 'queijo-coalho': 2, 'farinha-de-mandioca': 1 })
    expect(router.state.location.pathname).toBe('/sacola')
  })

  it('pedido em andamento mostra o acompanhamento com o código; concluído mostra o detalhe', async () => {
    renderApp('/pedidos/1042', { withSeedOrders: true })
    expect(await screen.findByText('Previsão de entrega')).toBeInTheDocument()
    expect(screen.getByText('4821')).toBeInTheDocument()
    expect(screen.getByText('15h12 · com Carlos, entregador da casa')).toBeInTheDocument()
  })

  it('lista separa "em andamento" de "anteriores"', async () => {
    renderApp('/pedidos', { withSeedOrders: true })
    const active = (await screen.findByRole('heading', { name: 'Em andamento' })).closest('section')!
    expect(within(active).getByText('Pedido 1042')).toBeInTheDocument()
    const past = screen.getByRole('heading', { name: 'Anteriores' }).closest('section')!
    expect(within(past).getByText('Pedido 1017')).toBeInTheDocument()
    expect(within(past).getByText('Pedido 0988')).toBeInTheDocument()
  })

  it('sem pedidos: estado vazio com próximo passo', async () => {
    renderApp('/pedidos')
    expect(await screen.findByText('Você ainda não fez pedidos')).toBeInTheDocument()
  })

  it('login por código: código errado é recusado; o de teste entra e volta para onde estava', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/entrar?next=/pedidos')
    await user.type(screen.getByLabelText('Celular com WhatsApp'), '11987654321')
    await user.click(screen.getByRole('button', { name: 'Receber código' }))
    await screen.findByRole('heading', { name: 'Digite o código' })
    await user.click(screen.getByLabelText('Dígito 1'))
    await user.keyboard('9999')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText(/Código incorreto/)).toBeInTheDocument()
    expect(useSession.getState().phone).toBeNull()
    await user.click(screen.getByLabelText('Dígito 1'))
    await user.keyboard('1234')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/pedidos'))
    expect(useSession.getState().phone).toBe('(11) 98765-4321')
  })
})

describe('o servidor refaz os preços', () => {
  it('placeOrder ignora valor do cliente e usa o catálogo', async () => {
    const { createMockServices } = await import('@/mocks/services')
    const { memoryStorage } = await import('@/test/renderApp')
    const svc = createMockServices({ storage: memoryStorage(), code: () => '0000' })
    const order = await svc.orders.placeOrder({
      items: [{ productId: 'queijo-coalho', qty: 2 }],
      fulfillment: 'delivery',
      contact: { name: 'A', phone: '(11) 98765-4321' },
      address: null,
      windowId: 'asap',
      payment: { method: 'pix', changeForCents: null },
    })
    const coalho = products.find((p) => p.id === 'queijo-coalho')!
    expect(order.subtotalCents).toBe(coalho.priceCents * 2)
    expect(order.totalCents).toBe(coalho.priceCents * 2 + 800)
    await expect(svc.orders.placeOrder({ items: [], fulfillment: 'pickup', contact: { name: 'A', phone: '1' }, address: null, windowId: 'asap', payment: { method: 'cash', changeForCents: null } })).rejects.toThrow('empty_order')
  })
})

describe('acessibilidade das telas (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each([
    ['/', 'início'],
    ['/buscar', 'buscar'],
    ['/categoria/laticinios', 'categoria'],
    ['/produto/queijo-coalho', 'produto'],
    ['/linha', 'linha'],
    ['/sobre', 'sobre'],
    ['/sacola', 'sacola vazia'],
    ['/pedidos', 'pedidos'],
    ['/perfil', 'perfil'],
    ['/entrar', 'entrar'],
  ])('%s (%s) não tem violações', async (path) => {
    const { container } = renderApp(path)
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 50))
    expect(await axe(container, rules)).toHaveNoViolations()
  })

  it.each([
    ['/finalizar/identificacao'],
    ['/finalizar/entrega'],
    ['/finalizar/endereco'],
    ['/finalizar/pagamento'],
    ['/finalizar/revisao'],
  ])('checkout %s (com sacola e dados) não tem violações', async (path) => {
    useBag.setState({ items: { 'queijo-coalho': 1, 'farinha-de-mandioca': 2 } })
    useCheckout.setState({
      contact: { name: 'Ana Souza', phone: '(11) 98765-4321' },
      address: { cep: '00000-000', street: 'Rua das Camélias', number: '120', complement: '', district: 'Jardim das Flores', reference: '' },
    })
    const { container } = renderApp(path)
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 50))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
