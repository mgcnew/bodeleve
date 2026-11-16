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

describe('produtos', () => {
  it('lista com tipo, canal e preço; filtros e busca', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/produtos', { withSeedOrders: true })
    const row = (await screen.findByText('Queijo coalho 500 g')).closest('a')!
    expect(row).toHaveTextContent('Feito na casa')
    expect(row).toHaveTextContent('Loja e balcão')
    expect(row).toHaveTextContent(money('32,90'))
    const charque = screen.getByText('Charque 500 g').closest('a')!
    expect(charque).toHaveTextContent('Só balcão (por peso)')
    expect(charque).toHaveTextContent(/R\$.79,80 \/ kg/)
    const leite = screen.getByText('Leite integral 1 L').closest('a')!
    expect(leite).toHaveTextContent('Matéria-prima')
    expect(leite).toHaveTextContent('Não vende')
    expect(leite).toHaveTextContent('—')
    expect(screen.getByText(/20 itens cadastrados/)).toBeInTheDocument()
    expect(screen.getByText('Carne de sol 500 g').closest('a')).toHaveTextContent(/Loja e balcão \(por peso\).*R\$.59,90 \/ kg/)

    await user.click(screen.getByRole('button', { name: 'Marca Bodeleve' }))
    expect(screen.getAllByRole('link', { name: /Rapadura|Manteiga de garrafa/ })).toHaveLength(2)
    expect(screen.queryByText('Queijo coalho 500 g')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Todos' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'fubá')
    expect(screen.getAllByRole('link', { name: /Fubá/ })).toHaveLength(1)
    await user.clear(screen.getByRole('searchbox', { name: 'Buscar produto' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'zzz')
    expect(screen.getByText('Nenhum produto encontrado')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Categorias' })).toHaveAttribute('href', '/gestao/produtos/categorias')
    expect(screen.getByRole('link', { name: 'Fichas técnicas' })).toHaveAttribute('href', '/gestao/producao/fichas')
  })

  it('o produto abre com os valores do quadro e mostra custo e margem ao vivo', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/produtos/queijo-coalho', { withSeedOrders: true })
    expect(await screen.findByLabelText('Nome')).toHaveValue('Queijo coalho 500 g')
    expect(screen.getByLabelText('Categoria')).toHaveDisplayValue('Queijos e laticínios')
    expect(screen.getByRole('radio', { name: /Produto acabado/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Feito na casa' })).toBeChecked()
    expect(screen.getByLabelText('Preço de venda')).toHaveValue('32,90')
    expect(screen.getByLabelText('Estoque mínimo')).toHaveValue('15 un')
    expect(screen.getByText('Custo (da ficha técnica)').parentElement).toHaveTextContent(money('14,20'))
    expect(screen.getByText('Margem').parentElement).toHaveTextContent('57%')
    expect(screen.getByRole('switch', { name: 'Publicar na loja online' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Favorito no PDV' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Vendido por peso' })).not.toBeChecked()
    expect(screen.getByRole('switch', { name: 'Controlar lote e validade' })).toBeChecked()
    expect(screen.getByLabelText('Descrição na loja')).toHaveValue('[DESCRIÇÃO DO PRODUTO: como é feito, sabor, sugestão de uso]')
    await user.clear(screen.getByLabelText('Preço de venda'))
    await user.type(screen.getByLabelText('Preço de venda'), '40,00')
    expect(screen.getByText('Margem').parentElement).toHaveTextContent('65%')
  })

  it('salvar mostra "Produto salvo." e o preço novo chega à loja', async () => {
    const storage = memoryStorage()
    const user = userEvent.setup()
    renderApp('/gestao/produtos/queijo-coalho', { withSeedOrders: true, storage })
    await screen.findByLabelText('Nome')
    await user.clear(screen.getByLabelText('Preço de venda'))
    await user.type(screen.getByLabelText('Preço de venda'), '34,50')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Produto salvo.')).toBeInTheDocument()
    const svc = createMockServices({ storage, withSeedOrders: true })
    expect((await svc.catalog.getProduct('queijo-coalho'))?.priceCents).toBe(3450)
    const list = await svc.admin.catalog.list()
    expect(list.find((r) => r.id === 'queijo-coalho')?.priceCents).toBe(3450)
  })

  it('erros dizem como corrigir e nada é salvo', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/produtos/queijo-coalho', { withSeedOrders: true })
    await screen.findByLabelText('Nome')
    await user.clear(screen.getByLabelText('Nome'))
    await user.clear(screen.getByLabelText('Preço de venda'))
    await user.clear(screen.getByLabelText('Estoque mínimo'))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Informe o nome do produto.')).toBeInTheDocument()
    expect(screen.getByText('Informe o preço de venda, por exemplo 32,90.')).toBeInTheDocument()
    expect(screen.getByText('Informe o estoque mínimo, por exemplo 15.')).toBeInTheDocument()
    expect(screen.queryByText('Produto salvo.')).not.toBeInTheDocument()
  })

  it('matéria-prima não mostra preço, loja, favorito nem origem; trocar o tipo esconde esses campos', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/produtos/leite-integral', { withSeedOrders: true })
    await screen.findByLabelText('Nome')
    expect(screen.queryByLabelText('Preço de venda')).not.toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: 'Publicar na loja online' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Origem na loja' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Revenda/ }))
    expect(screen.getByLabelText('Preço de venda')).toBeInTheDocument()
  })

  it('despublicar um produto o tira da loja, e a categoria some quando fica vazia', async () => {
    const storage = memoryStorage()
    const user = userEvent.setup()
    renderApp('/gestao/produtos/rapadura', { withSeedOrders: true, storage })
    await screen.findByLabelText('Nome')
    await user.click(screen.getByRole('switch', { name: 'Publicar na loja online' }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await screen.findByText('Produto salvo.')
    const svc = createMockServices({ storage, withSeedOrders: true })
    expect((await svc.catalog.listProducts()).map((p) => p.id)).not.toContain('rapadura')
    expect((await svc.catalog.listCategories()).map((c) => c.id)).not.toContain('doces')
    expect((await svc.catalog.getHomeSections()).find((x) => x.id === 'marca')?.productIds).toEqual(['manteiga-de-garrafa'])
    expect((await svc.admin.catalog.list()).find((r) => r.id === 'rapadura')?.channel).toBe('Só balcão')
  })

  it('a loja continua igual aos quadros com os dados de exemplo', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    expect((await svc.catalog.listProducts()).map((p) => p.id)).toEqual(['queijo-coalho', 'queijo-manteiga', 'carne-de-sol', 'farinha-de-mandioca', 'tapioca-granulada', 'doce-de-leite', 'rapadura', 'manteiga-de-garrafa', 'requeijao', 'nata'])
    expect((await svc.catalog.listCategories()).map((c) => c.name)).toEqual(['Queijos e laticínios', 'Carnes e embutidos', 'Farinhas e grãos', 'Doces'])
  })
})

describe('categorias', () => {
  it('lista com a contagem e as etiquetas; adiciona uma nova e recusa repetida ou vazia', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/produtos/categorias', { withSeedOrders: true })
    const first = (await screen.findByText('Queijos e laticínios')).closest('div')!
    expect(first).toHaveTextContent(/\d+ produtos/)
    expect(first).toHaveTextContent('Na loja')
    expect(screen.queryByText('Insumos')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Nova categoria'), 'Castanhas')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    const nova = (await screen.findByText('Castanhas')).closest('div')!
    expect(nova).toHaveTextContent('0 produtos')
    expect(nova).toHaveTextContent('Nova')
    expect(screen.getByLabelText('Nova categoria')).toHaveValue('')
    await user.type(screen.getByLabelText('Nova categoria'), 'doces')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(await screen.findByText('Já existe uma categoria com esse nome.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Nova categoria'))
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(await screen.findByText('Escreva o nome da categoria, por exemplo Castanhas.')).toBeInTheDocument()
    expect(screen.getByText('A ordem aqui é a ordem dos atalhos na loja online.')).toBeInTheDocument()
  })

  it('categoria nova sem produto não aparece na loja; ao receber um produto publicado, aparece', async () => {
    const storage = memoryStorage()
    const svc = createMockServices({ storage, withSeedOrders: true })
    await svc.admin.catalog.addCategory('Castanhas')
    expect((await svc.catalog.listCategories()).map((c) => c.name)).not.toContain('Castanhas')
    const d = (await svc.admin.catalog.get('fuba'))!
    await svc.admin.catalog.save('fuba', { ...d, categoryId: 'castanhas', published: true })
    expect((await svc.catalog.listCategories()).map((c) => c.name)).toContain('Castanhas')
  })
})

describe('clientes', () => {
  it('lista com totais, último pedido e etiquetas como no quadro', async () => {
    renderApp('/gestao/clientes', { withSeedOrders: true })
    const rowOf = async (name: string) => (await screen.findByText(name, { selector: 'span' })).closest('a')!
    const maria = await rowOf('Maria Lima')
    expect(maria).toHaveTextContent('5 pedidos · último hoje')
    expect(maria).toHaveTextContent(money('412,30'))
    const ana = await rowOf('Ana Souza')
    expect(ana).toHaveTextContent('3 pedidos · último hoje')
    expect(ana).toHaveTextContent(money('236,10'))
    const zefa = await rowOf('Dona Zefa')
    expect(zefa).toHaveTextContent('Balcão · compra fiado')
    expect(zefa).toHaveTextContent(money('1.020,00'))
    expect(zefa).toHaveTextContent(/Fiado R\$.160,00/)
    const paula = await rowOf('Paula Reis')
    expect(paula).toHaveTextContent('8 pedidos · último hoje')
    expect(paula).toHaveTextContent(money('904,70'))
    const joao = await rowOf('João Pedro')
    expect(joao).toHaveTextContent('1 pedido · hoje')
    expect(joao).toHaveTextContent(money('47,80'))
    expect(joao).toHaveTextContent('Novo')
    expect(screen.getByText(/Valor ao lado = total comprado/)).toBeInTheDocument()
  })

  it('busca por nome ou por parte do celular', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/clientes', { withSeedOrders: true })
    await screen.findByText('Maria Lima')
    await user.type(screen.getByRole('searchbox', { name: 'Nome ou celular' }), 'paula')
    await waitFor(() => expect(screen.queryByText('Maria Lima')).not.toBeInTheDocument())
    expect(await screen.findByText('Paula Reis')).toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: 'Nome ou celular' }))
    await user.type(screen.getByRole('searchbox', { name: 'Nome ou celular' }), '90000-0001')
    await waitFor(() => expect(screen.queryByText('Paula Reis')).not.toBeInTheDocument())
    expect(await screen.findByText('Maria Lima')).toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: 'Nome ou celular' }))
    await user.type(screen.getByRole('searchbox', { name: 'Nome ou celular' }), 'xyz')
    expect(await screen.findByText(/Nenhum cliente para/)).toBeInTheDocument()
  })

  it('cliente: números, contato, o que mais compra e pedidos', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    const list = await svc.admin.customers.list()
    const id = list.find((c) => c.name === 'Maria Lima')!.id
    renderApp(`/gestao/clientes/${id}`, { withSeedOrders: true })
    expect(await screen.findByRole('heading', { name: 'Maria Lima' })).toBeInTheDocument()
    expect(screen.getByText('Cliente desde 03/2026 · compra pela loja online')).toBeInTheDocument()
    expect(screen.getByText('Pedidos', { selector: 'div' }).parentElement).toHaveTextContent('5')
    expect(screen.getByText('Total').parentElement).toHaveTextContent(money('412,30'))
    expect(screen.getByText('Ticket médio').parentElement).toHaveTextContent(money('82,46'))
    expect(screen.getByText(/\(00\) 90000-0001 · WhatsApp/)).toBeInTheDocument()
    expect(screen.getByText('Av. das Palmeiras, 455 · casa 2 — Centro')).toBeInTheDocument()
    const mais = screen.getByRole('region', { name: 'Mais compra' })
    expect(within(mais).getByText('Queijo coalho · 5×')).toBeInTheDocument()
    expect(within(mais).getByText('Farinha de mandioca · 3×')).toBeInTheDocument()
    expect(within(mais).getByText('Tapioca granulada · 2×')).toBeInTheDocument()
    const pedidos = screen.getByRole('region', { name: 'Pedidos' })
    const rows = within(pedidos).getAllByRole('link')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('#1043 · hoje')
    expect(rows[0]).toHaveTextContent('Entrega · 3 itens')
    expect(rows[0]).toHaveTextContent(money('63,70'))
    expect(rows[0]).toHaveTextContent('Novo')
    expect(rows[1]).toHaveTextContent(/#1021 · 06\/11/)
    expect(rows[1]).toHaveTextContent('Entrega · 4 itens')
    expect(rows[1]).toHaveTextContent(money('98,40'))
    expect(rows[1]).toHaveTextContent('Entregue')
    expect(rows[2]).toHaveTextContent(/#0997 · 24\/10/)
    expect(rows[2]).toHaveTextContent('Retirada · 6 itens')
    expect(rows[2]).toHaveTextContent(money('121,60'))
    expect(rows[2]).toHaveTextContent('Retirado')
    expect(rows[0]).toHaveAttribute('href', '/gestao/pedidos/1043')
    expect(screen.getByLabelText('Observações internas')).toHaveValue('Prefere queijo mais curado.')
  })

  it('a observação interna é salva ao sair do campo', async () => {
    const storage = memoryStorage()
    const user = userEvent.setup()
    const svc = createMockServices({ storage, withSeedOrders: true })
    const id = (await svc.admin.customers.list()).find((c) => c.name === 'Maria Lima')!.id
    renderApp(`/gestao/clientes/${id}`, { withSeedOrders: true, storage })
    const field = await screen.findByLabelText('Observações internas')
    await user.clear(field)
    await user.type(field, 'Prefere retirada à tarde.')
    await user.tab()
    expect(await screen.findByText('Observação salva.')).toBeInTheDocument()
    expect((await svc.admin.customers.get(id))?.notes).toBe('Prefere retirada à tarde.')
  })

  it('quem comprou na loja com um celular novo entra como cliente novo', async () => {
    const storage = memoryStorage()
    const svc = createMockServices({ storage, withSeedOrders: true, code: () => '1234' })
    await svc.orders.placeOrder({
      items: [{ productId: 'queijo-coalho', qty: 2 }], fulfillment: 'pickup', contact: { name: 'Lúcia Prado', phone: '(00) 90000-0099' },
      address: null, windowId: 'asap', payment: { method: 'pix', changeForCents: null },
    })
    const lucia = (await svc.admin.customers.list()).find((c) => c.name === 'Lúcia Prado')!
    expect(lucia.orders).toBe(1)
    expect(lucia.tag?.label).toBe('Novo')
    expect(lucia.detail).toBe('1 pedido · hoje')
    await svc.admin.customers.saveNotes(lucia.id, 'Alergia a lactose?')
    expect((await svc.admin.customers.get(lucia.id))?.notes).toBe('Alergia a lactose?')
  })

  it('cliente que não existe mostra aviso', async () => {
    renderApp('/gestao/clientes/c000', { withSeedOrders: true })
    expect(await screen.findByText('Cliente não encontrado')).toBeInTheDocument()
  })
})

describe('acesso a produtos e clientes', () => {
  it('atendente vê clientes mas não produtos; a atendente não abre estoque nem produtos', async () => {
    signInAs('julia@exemplo.com')
    const a = renderApp('/gestao/produtos', { withSeedOrders: true })
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument()
    a.unmount()
    renderApp('/gestao/clientes', { withSeedOrders: true })
    expect(await screen.findByText('Maria Lima')).toBeInTheDocument()
  })
})

describe('acessibilidade (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each(['/gestao/produtos', '/gestao/produtos/queijo-coalho', '/gestao/produtos/leite-integral', '/gestao/produtos/categorias', '/gestao/clientes'])('%s não tem violações', async (path) => {
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 200))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
