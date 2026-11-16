import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { adminUsers } from '@/mocks/adminSeed'
import { createMockServices } from '@/mocks/services'
import { useAdminSession } from '@/store/admin'
import { usePosCart } from '@/store/pos'
import { memoryStorage, renderApp, resetStores } from '@/test/renderApp'

const signInAs = (email: string) => {
  const u = adminUsers.find((x) => x.email === email)!
  useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
}
beforeEach(() => {
  resetStores()
  window.scrollTo = vi.fn()
  signInAs('julia@exemplo.com')
})
afterEach(() => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})
const money = (v: string) => new RegExp(`R\\$.${v.replace(/[.,]/g, '\\$&')}`)

/** Sacola do quadro Pagamento: 2 coalho + 0,5 kg de carne de sol + 1 farinha = R$ 108,65. */
const quadroCart = () =>
  usePosCart.setState({
    lines: [
      { key: 'a', itemId: 'queijo-coalho', kind: 'unit', qty: 2 },
      { key: 'b', itemId: 'carne-de-sol', kind: 'weight', qty: 0.5 },
      { key: 'c', itemId: 'farinha-de-mandioca', kind: 'unit', qty: 1 },
    ],
    discount: null,
  })

const svcOf = (storage: ReturnType<typeof memoryStorage>) => createMockServices({ storage, withSeedOrders: true })

describe('abrir caixa', () => {
  it('entrar no PDV com o caixa aberto leva para vender', async () => {
    const { router } = renderApp('/pdv', { withSeedOrders: true })
    await waitFor(() => expect(router.state.location.pathname).toBe('/pdv/vender'))
  })

  it('sem caixa aberto: abertura com quem abre, último fechamento e valores de troco', async () => {
    const storage = memoryStorage()
    await svcOf(storage).admin.pos.closeSession(41200, 'Júlia')
    const user = userEvent.setup()
    const { router } = renderApp('/pdv', { withSeedOrders: true, storage })
    await waitFor(() => expect(router.state.location.pathname).toBe('/pdv/abertura'))
    expect(await screen.findByRole('heading', { name: 'Abrir caixa' })).toBeInTheDocument()
    expect(screen.getByText(/^Balcão · .+ · \d\dh\d\d$/)).toBeInTheDocument()
    expect(screen.getByText('Quem abre').parentElement).toHaveTextContent('Júlia')
    expect(await screen.findByText(/sem diferença/)).toBeInTheDocument()
    expect(screen.getByLabelText('Dinheiro na gaveta para troco')).toHaveDisplayValue(/R\$.150,00/)
    await user.click(screen.getByRole('button', { name: 'R$ 200' }))
    expect(screen.getByLabelText('Dinheiro na gaveta para troco')).toHaveDisplayValue(/R\$.200,00/)
    expect(screen.getByText('Conte o dinheiro antes de abrir. Esse valor é a base para conferir o caixa no fechamento.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Abrir caixa' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/pdv/vender'))
    expect((await svcOf(storage).admin.pos.cash())?.session).toMatchObject({ openingCents: 20000, status: 'open' })
  })

  it('valor inválido diz como corrigir', async () => {
    const storage = memoryStorage()
    await svcOf(storage).admin.pos.closeSession(41200, 'Júlia')
    const user = userEvent.setup()
    renderApp('/pdv/abertura', { withSeedOrders: true, storage })
    const f = await screen.findByLabelText('Dinheiro na gaveta para troco')
    await user.clear(f)
    await user.type(f, 'abc')
    await user.click(screen.getByRole('button', { name: 'Abrir caixa' }))
    expect(await screen.findByText('Informe o valor em dinheiro, por exemplo R$ 150,00.')).toBeInTheDocument()
  })
})

describe('vender', () => {
  it('cabeçalho do caixa, abas e os 8 favoritos do quadro com preço e estoque', async () => {
    renderApp('/pdv/vender', { withSeedOrders: true })
    expect(await screen.findByRole('heading', { name: 'Balcão' })).toBeInTheDocument()
    expect(await screen.findByText(/^Caixa aberto · Júlia · desde \d\dh\d\d$/)).toBeInTheDocument()
    expect(screen.getByText('Aberto')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Favoritos', selected: true })).toBeInTheDocument()
    const tile = async (name: string) => (await screen.findByText(name, { selector: 'span' })).closest('button')!
    expect(await tile('Queijo coalho')).toHaveTextContent(/32,90.*12 un/)
    expect(await tile('Carne de sol')).toHaveTextContent('59,90/kg')
    expect(await tile('Tapioca granulada')).toHaveTextContent('(estoque baixo)')
    expect(await tile('Feijão de corda')).toHaveTextContent(/16,90\/kg.*9 kg/)
    for (const n of ['Queijo coalho', 'Carne de sol', 'Farinha de mandioca', 'Tapioca granulada', 'Rapadura', 'Manteiga de garrafa', 'Feijão de corda', 'Doce de leite']) expect(await tile(n)).toBeInTheDocument()
    expect(screen.queryByText('Queijo manteiga', { selector: 'span' })).not.toBeInTheDocument() // não é favorito
    expect(screen.getByText('Toque para somar 1. Produtos por peso pedem o peso antes.')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegação do caixa' })).toBeInTheDocument()
  })

  it('tocar soma 1; a barra da sacola mostra itens e total', async () => {
    const user = userEvent.setup()
    renderApp('/pdv/vender', { withSeedOrders: true })
    await user.click((await screen.findByText('Queijo coalho', { selector: 'span' })).closest('button')!)
    expect(screen.getByRole('link', { name: /1 item/ })).toHaveTextContent(money('32,90'))
    await user.click(screen.getByText('Queijo coalho', { selector: 'span' }).closest('button')!)
    expect(screen.getByRole('link', { name: /2 itens/ })).toHaveTextContent(money('65,80'))
    expect(screen.getByRole('link', { name: /2 itens/ })).toHaveAttribute('href', '/pdv/sacola')
  })

  it('não passa do estoque disponível: só há 12 coalho', async () => {
    const user = userEvent.setup()
    renderApp('/pdv/vender', { withSeedOrders: true })
    const tile = (await screen.findByText('Queijo coalho', { selector: 'span' })).closest('button')!
    for (let i = 0; i < 13; i++) await user.click(tile)
    expect(screen.getByText('Só há 12 un de Queijo coalho em estoque.')).toBeInTheDocument()
    expect(usePosCart.getState().lines[0].qty).toBe(12)
  })

  it('produto por peso abre a folha: 500 g por padrão, atalhos e botões de 50 g', async () => {
    const user = userEvent.setup()
    renderApp('/pdv/vender', { withSeedOrders: true })
    await user.click((await screen.findByText('Carne de sol', { selector: 'span' })).closest('button')!)
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText('Carne de sol')).toBeInTheDocument()
    expect(within(sheet).getByText(/R\$.59,90 o quilo/)).toBeInTheDocument()
    expect(within(sheet).getByLabelText('Peso')).toHaveValue('0,500')
    expect(within(sheet).getByRole('button', { name: /Adicionar · R\$.29,95/ })).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: '1 kg' }))
    expect(within(sheet).getByRole('button', { name: /Adicionar · R\$.59,90/ })).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Diminuir' }))
    expect(within(sheet).getByLabelText('Peso')).toHaveValue('0,95')
    await user.click(within(sheet).getByRole('button', { name: '250 g' }))
    await user.click(within(sheet).getByRole('button', { name: /Adicionar/ }))
    expect(usePosCart.getState().lines).toEqual([expect.objectContaining({ itemId: 'carne-de-sol', kind: 'weight', qty: 0.25 })])
    expect(screen.getByRole('link', { name: /1 item/ })).toHaveTextContent(money('14,98'))
  })

  it('peso acima do estoque é recusado', async () => {
    const user = userEvent.setup()
    renderApp('/pdv/vender', { withSeedOrders: true })
    await user.click((await screen.findByText('Feijão de corda', { selector: 'span' })).closest('button')!)
    const sheet = await screen.findByRole('dialog')
    const f = within(sheet).getByLabelText('Peso')
    await user.clear(f)
    await user.type(f, '12')
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Só há 9 kg em estoque.')
    expect(within(sheet).getByRole('button', { name: /Adicionar/ })).toBeDisabled()
  })

  it('categorias e busca', async () => {
    const user = userEvent.setup()
    renderApp('/pdv/vender', { withSeedOrders: true })
    await user.click(await screen.findByRole('tab', { name: 'Categorias' }))
    expect(screen.getAllByRole('button', { pressed: true }).map((b) => b.textContent)).toContain('Queijos e laticínios')
    await user.click(screen.getByRole('button', { name: 'Carnes e embutidos' }))
    expect(await screen.findByText('Carne de sol', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByText('Queijo coalho', { selector: 'span' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Buscar' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'tapioca')
    expect(screen.getByText('Tapioca granulada', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByText('Carne de sol', { selector: 'span' })).not.toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: 'Buscar produto' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar produto' }), 'zzz')
    expect(screen.getByText('Nenhum produto com esse nome.')).toBeInTheDocument()
  })
})

describe('sacola', () => {
  it('linhas, subtotal e total do quadro: R$ 108,65', async () => {
    quadroCart()
    renderApp('/pdv/sacola', { withSeedOrders: true })
    expect((await screen.findByText('Queijo coalho')).closest('div')).toHaveTextContent(/32,90 cada.*R\$.65,80/)
    expect(screen.getByText('Carne de sol').closest('div')).toHaveTextContent(/0,500 kg × R\$.59,90.*R\$.29,95/)
    expect(screen.getByText('Farinha de mandioca').closest('div')).toHaveTextContent(/12,90 cada/)
    expect(screen.getByText('Subtotal').parentElement).toHaveTextContent(money('108,65'))
    expect(screen.getByText('Total').parentElement).toHaveTextContent(money('108,65'))
    expect(screen.getByRole('link', { name: /Cobrar R\$.108,65/ })).toHaveAttribute('href', '/pdv/pagamento')
    expect(screen.getByRole('button', { name: 'Remover Carne de sol' })).toBeInTheDocument()
  })

  it('mudar quantidade e remover recalcula o total', async () => {
    quadroCart()
    const user = userEvent.setup()
    renderApp('/pdv/sacola', { withSeedOrders: true })
    await screen.findByText('Queijo coalho')
    await user.click(screen.getAllByRole('button', { name: /Aumentar/ })[0])
    expect(screen.getByText('Total').parentElement).toHaveTextContent(money('141,55'))
    await user.click(screen.getByRole('button', { name: 'Remover Carne de sol' }))
    expect(screen.getByText('Total').parentElement).toHaveTextContent(money('111,60'))
    expect(screen.queryByText('Carne de sol')).not.toBeInTheDocument()
  })

  it('desconto de 10% com motivo: prévia, aplicar e tirar', async () => {
    quadroCart()
    const user = userEvent.setup()
    renderApp('/pdv/sacola', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Dar desconto' }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText(/Desconto de R\$.5,43 · total fica R\$.103,22/)).toBeInTheDocument() // 5% é o padrão
    await user.click(within(sheet).getByRole('button', { name: '10%' }))
    expect(within(sheet).getByText(/Desconto de R\$.10,87 · total fica R\$.97,78/)).toBeInTheDocument()
    await user.selectOptions(within(sheet).getByLabelText('Motivo'), 'Produto perto da validade')
    await user.click(within(sheet).getByRole('button', { name: 'Aplicar desconto' }))
    expect(screen.getByText('Desconto 10%').parentElement).toHaveTextContent(/−\s*R\$.10,87/)
    expect(screen.getByText('Total').parentElement).toHaveTextContent(money('97,78'))
    expect(screen.getByRole('link', { name: /Cobrar R\$.97,78/ })).toBeInTheDocument()
    expect(usePosCart.getState().discount).toEqual({ kind: 'p10', reason: 'Produto perto da validade' })
    await user.click(screen.getByRole('button', { name: 'Tirar desconto' }))
    expect(screen.getByText('Total').parentElement).toHaveTextContent(money('108,65'))
  })

  it('sacola vazia convida a vender', async () => {
    renderApp('/pdv/sacola', { withSeedOrders: true })
    expect(await screen.findByText('Sacola vazia')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vender' })).toHaveAttribute('href', '/pdv/vender')
  })
})

describe('pagamento', () => {
  it('dinheiro: atalhos Exato / R$ 110 / R$ 120 / R$ 150, troco e o botão com o valor', async () => {
    quadroCart()
    const user = userEvent.setup()
    renderApp('/pdv/pagamento', { withSeedOrders: true })
    expect(await screen.findByText('Total a cobrar')).toBeInTheDocument()
    expect(screen.getByText('Total a cobrar').parentElement).toHaveTextContent(money('108,65'))
    expect(screen.getByRole('button', { name: 'Dinheiro', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exato' })).toBeInTheDocument()
    for (const v of ['110,00', '120,00', '150,00']) expect(screen.getByRole('button', { name: money(v) })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: money('120,00') }))
    expect(screen.getByText('Troco').parentElement).toHaveTextContent(money('11,35'))
    expect(screen.getByRole('button', { name: /Recebi R\$.120,00 · concluir/ })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Dividir em duas formas' })).toHaveAttribute('href', '/pdv/pagamento/dividir')
  })

  it('valor entregue menor que o total bloqueia o botão', async () => {
    quadroCart()
    const user = userEvent.setup()
    renderApp('/pdv/pagamento', { withSeedOrders: true })
    await user.type(await screen.findByLabelText('Outro valor'), '100,00')
    expect(screen.getByText('O valor entregue é menor que o total.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Recebi R\$.100,00 · concluir/ })).toBeDisabled()
  })

  it('Pix mostra o marcador de QR e o botão certo; cartão manda passar na maquininha', async () => {
    quadroCart()
    const user = userEvent.setup()
    renderApp('/pdv/pagamento', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Pix' }))
    expect(screen.getByText('[QR CODE PIX]')).toBeInTheDocument()
    expect(screen.getByText('Mostre o QR ao cliente. Confirme quando o Pix aparecer na conta.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pix recebido · concluir' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Débito' }))
    expect(screen.getByText('Passe na maquininha')).toBeInTheDocument()
    expect(screen.getByText(/Digite R\$.108,65 na maquininha e confirme aqui quando aprovar\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cartão aprovado · concluir' })).toBeInTheDocument()
  })

  it('concluir em dinheiro: tela final com troco, estoque baixado e sacola limpa', async () => {
    quadroCart()
    const storage = memoryStorage()
    const user = userEvent.setup()
    const { router } = renderApp('/pdv/pagamento', { withSeedOrders: true, storage })
    await user.click(await screen.findByRole('button', { name: money('120,00') }))
    await user.click(screen.getByRole('button', { name: /Recebi R\$.120,00 · concluir/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/pdv/concluida/V-0213'))
    expect(await screen.findByRole('heading', { name: 'Venda concluída' })).toBeInTheDocument()
    expect(screen.getByText(/^V-0213 · \d\dh\d\d · R\$.108,65$/)).toBeInTheDocument()
    expect(screen.getByText('Troco a devolver').parentElement).toHaveTextContent(money('11,35'))
    expect(screen.getByText('Dinheiro recebido').parentElement).toHaveTextContent(money('120,00'))
    expect(screen.getByText('2 Queijo coalho, 0,5 kg Carne de sol, 1 Farinha de mandioca')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nova venda' })).toHaveAttribute('href', '/pdv/vender')
    expect(usePosCart.getState().lines).toEqual([])
    const caixa = (await svcOf(storage).admin.pos.cash())!
    expect(caixa.count).toBe(27)
    expect(caixa.expectedCents).toBe(41200 + 10865)
  })

  it('comprovante por WhatsApp: valida o número e só registra', async () => {
    const storage = memoryStorage()
    const sale = await svcOf(storage).admin.pos.checkout({ lines: [{ key: 'x', itemId: 'farinha-de-mandioca', kind: 'unit', qty: 1 }], discount: null, payments: [{ method: 'pix', cents: 1290 }] }, 'Júlia')
    const user = userEvent.setup()
    renderApp(`/pdv/concluida/${sale.id}`, { withSeedOrders: true, storage })
    await user.type(await screen.findByLabelText('Comprovante por WhatsApp (opcional)'), '90')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText('Use o DDD e o número, por exemplo (00) 90000-0000.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Comprovante por WhatsApp (opcional)'))
    await user.type(screen.getByLabelText('Comprovante por WhatsApp (opcional)'), '(00) 90000-0000')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText(/Comprovante registrado\. O envio por WhatsApp ainda não está ligado/)).toBeInTheDocument()
    expect(screen.queryByText('Troco a devolver')).not.toBeInTheDocument()
  })

  it('estoque que acabou no meio: avisa e não cobra', async () => {
    usePosCart.setState({ lines: [{ key: 'a', itemId: 'queijo-coalho', kind: 'unit', qty: 13 }], discount: null })
    const user = userEvent.setup()
    renderApp('/pdv/pagamento', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Pix' }))
    await user.click(screen.getByRole('button', { name: 'Pix recebido · concluir' }))
    expect(await screen.findByText('Falta estoque de um item da sacola. Volte à sacola e ajuste a quantidade.')).toBeInTheDocument()
  })

  it('sem conexão a venda é guardada e a tela avisa', async () => {
    quadroCart()
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const storage = memoryStorage()
    const user = userEvent.setup()
    renderApp('/pdv/pagamento', { withSeedOrders: true, storage })
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(await screen.findByText(/Sem conexão\. As vendas ficam neste aparelho/)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Pix' }))
    await user.click(screen.getByRole('button', { name: 'Pix recebido · concluir' }))
    expect(await screen.findByText('Venda guardada neste aparelho. Será enviada quando a conexão voltar.')).toBeInTheDocument()
    expect((await svcOf(storage).admin.pos.overview()).pendingSales).toBe(1)
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    act(() => { window.dispatchEvent(new Event('online')) })
    await waitFor(async () => expect((await svcOf(storage).admin.pos.overview()).pendingSales).toBe(0))
  })
})

describe('pagamento combinado', () => {
  it('R$ 50 em dinheiro e o resto no Pix, até quitar', async () => {
    quadroCart()
    const storage = memoryStorage()
    const user = userEvent.setup()
    const { router } = renderApp('/pdv/pagamento/dividir', { withSeedOrders: true, storage })
    expect(await screen.findByText('Falta receber')).toBeInTheDocument()
    expect(screen.getByText('Falta receber').parentElement).toHaveTextContent(money('108,65'))
    expect(screen.getByText('Nada ainda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Falta R\$.108,65/ })).toBeDisabled()
    const part = screen.getByRole('region', { name: 'Próxima parte' })
    await user.click(within(part).getByRole('button', { name: 'Dinheiro' }))
    await user.type(within(part).getByLabelText('Valor'), '50,00')
    await user.click(within(part).getByRole('button', { name: 'Receber esta parte' }))
    expect(screen.getByRole('region', { name: 'Já recebido' })).toHaveTextContent(/Dinheiro\s*R\$.50,00/)
    expect(screen.getByText('Falta receber').parentElement).toHaveTextContent(money('58,65'))
    await user.click(within(screen.getByRole('region', { name: 'Próxima parte' })).getByRole('button', { name: 'Pix' }))
    await user.click(within(screen.getByRole('region', { name: 'Próxima parte' })).getByRole('button', { name: 'Receber esta parte' }))
    expect(screen.getByText('Falta receber').parentElement).toHaveTextContent(money('0,00'))
    expect(screen.queryByRole('region', { name: 'Próxima parte' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Concluir venda' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/pdv/concluida/V-0213'))
    const sale = (await svcOf(storage).admin.pos.getSale('V-0213'))!
    expect(sale.payments).toEqual([{ method: 'cash', cents: 5000 }, { method: 'pix', cents: 5865 }])
  })

  it('valor passando do que falta fica só o que falta; recomeçar zera', async () => {
    quadroCart()
    const user = userEvent.setup()
    renderApp('/pdv/pagamento/dividir', { withSeedOrders: true })
    const part = await screen.findByRole('region', { name: 'Próxima parte' })
    await user.type(within(part).getByLabelText('Valor'), '999,00')
    await user.click(within(part).getByRole('button', { name: 'Receber esta parte' }))
    expect(screen.getByText('Falta receber').parentElement).toHaveTextContent(money('0,00'))
    await user.click(screen.getByRole('button', { name: 'Recomeçar' }))
    expect(screen.getByText('Falta receber').parentElement).toHaveTextContent(money('108,65'))
    expect(screen.getByText('Nada ainda')).toBeInTheDocument()
  })
})

describe('vendas de hoje', () => {
  it('26 vendas, R$ 892,00, as 6 mais recentes e os filtros', async () => {
    const user = userEvent.setup()
    renderApp('/pdv/vendas', { withSeedOrders: true })
    expect(await screen.findByText(/26 vendas · R\$.892,00 no balcão/)).toBeInTheDocument()
    const rows = (await screen.findAllByRole('link', { name: /V-02/ })).map((a) => a.textContent ?? '')
    expect(rows).toHaveLength(6)
    expect(rows[0]).toMatch(/V-0212 · \d\dh\d\d3 itens · PixR\$.35,48/)
    expect(rows[1]).toMatch(/V-0211.*1 item · CartãoR\$.32,90/)
    expect(rows[2]).toMatch(/V-0210.*3 itens · DinheiroR\$.80,30/)
    expect(rows[5]).toMatch(/V-0207.*4 itens · PixR\$.61,20/)
    await user.click(screen.getByRole('button', { name: 'Dinheiro' }))
    await waitFor(() => expect(screen.getAllByRole('link', { name: /V-02/ })).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: 'Cartão' }))
    await waitFor(() => expect(screen.getAllByRole('link', { name: /V-02/ }).map((a) => a.textContent)).toEqual([expect.stringContaining('V-0211'), expect.stringContaining('V-0209')]))
    expect(screen.getByText('Mostrando as 6 mais recentes. Vendas da loja online ficam em Pedidos, na gestão.')).toBeInTheDocument()
  })
})

describe('detalhe e cancelamento', () => {
  it('V-0212: itens com lote e peso, total, pagamento', async () => {
    renderApp('/pdv/vendas/V-0212', { withSeedOrders: true })
    expect(await screen.findByText('Concluída')).toBeInTheDocument()
    expect(screen.getByText(/Hoje, \d\dh\d\d · Júlia/)).toBeInTheDocument()
    expect(screen.getByText('1 × Farinha de mandioca').closest('div')).toHaveTextContent(/lote FM-0921.*R\$.12,90/)
    expect(screen.getByText('1 × Tapioca granulada').closest('div')).toHaveTextContent(/lote TG-1030.*R\$.9,90/)
    expect(screen.getByText('0,750 kg × Feijão de corda').closest('div')).toHaveTextContent(/R\$.16,90\/kg.*R\$.12,68/)
    expect(screen.getByText('Total').parentElement).toHaveTextContent(money('35,48'))
    expect(screen.getByRole('region', { name: 'Pagamento' })).toHaveTextContent(/Pix · confirmado \d\dh\d\d/)
  })

  it('cancelar pede a senha do gestor; errada não cancela; certa cancela e diz o que devolver', async () => {
    const storage = memoryStorage()
    const user = userEvent.setup()
    renderApp('/pdv/vendas/V-0212', { withSeedOrders: true, storage })
    await user.click(await screen.findByRole('button', { name: 'Cancelar venda' }))
    const modal = await screen.findByRole('alertdialog')
    expect(within(modal).getByText('Cancelar a venda V-0212?')).toBeInTheDocument()
    expect(within(modal).getByText('Os itens voltam ao estoque. Cancelamento precisa da senha de um gestor.')).toBeInTheDocument()
    await user.type(within(modal).getByLabelText('Senha do gestor'), '0000')
    await user.click(within(modal).getByRole('button', { name: 'Cancelar venda' }))
    expect(await within(modal).findByText('Senha incorreta. Confira com o gestor.')).toBeInTheDocument()
    expect((await svcOf(storage).admin.pos.getSale('V-0212'))?.status).toBe('completed')
    await user.clear(within(modal).getByLabelText('Senha do gestor'))
    await user.type(within(modal).getByLabelText('Senha do gestor'), '2468')
    await user.click(within(modal).getByRole('button', { name: 'Cancelar venda' }))
    expect(await screen.findByText('Cancelada')).toBeInTheDocument()
    expect(screen.getByText(/Cancelada às \d\dh\d\d\. Aprovado por Ana \(Gestor\)\. Os itens voltaram ao estoque\. Devolva R\$.35,48 por Pix a quem comprou\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar venda' })).not.toBeInTheDocument()
  })

  it('venda que não existe mostra aviso', async () => {
    renderApp('/pdv/vendas/V-9999', { withSeedOrders: true })
    expect(await screen.findByText('Venda não encontrada')).toBeInTheDocument()
  })
})

describe('caixa', () => {
  it('quadro: vendas por forma, gaveta e esperado R$ 412,00', async () => {
    renderApp('/pdv/caixa', { withSeedOrders: true })
    expect(await screen.findByText('Vendas no balcão · 26')).toBeInTheDocument()
    const sec = screen.getByRole('region', { name: 'Caixa de hoje' })
    expect(sec).toHaveTextContent(/Dinheiro\s*R\$.312,00/)
    expect(sec).toHaveTextContent(/Pix\s*R\$.197,60/)
    expect(sec).toHaveTextContent(/Cartão\s*R\$.382,40/)
    expect(sec).toHaveTextContent(/Total\s*R\$.892,00/)
    const gav = screen.getByRole('region', { name: 'Dinheiro na gaveta' })
    expect(gav).toHaveTextContent(/Abertura \(troco\)\s*R\$.150,00/)
    expect(gav).toHaveTextContent(/Vendas em dinheiro\s*\+\s*R\$.312,00/)
    expect(gav).toHaveTextContent(/Sangria · Troco para entregador\s*−\s*R\$.50,00/)
    expect(gav).toHaveTextContent(/Esperado\s*R\$.412,00/)
  })

  it('sangria pela folha muda o esperado; sangria maior que a gaveta é recusada', async () => {
    const user = userEvent.setup()
    renderApp('/pdv/caixa', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Sangria ou suprimento' }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByRole('button', { name: 'Retirar (sangria)' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(sheet).getByRole('button', { name: 'R$ 100' }))
    await user.click(within(sheet).getByRole('button', { name: 'Registrar' }))
    await waitFor(() => expect(screen.getByRole('region', { name: 'Dinheiro na gaveta' })).toHaveTextContent(/Sangria · Levar ao banco\s*−\s*R\$.100,00/))
    expect(screen.getByRole('region', { name: 'Dinheiro na gaveta' })).toHaveTextContent(/Esperado\s*R\$.312,00/)
  })

  it('fechar: diferença ao vivo, confirmação, resumo do fechamento e reabrir', async () => {
    const user = userEvent.setup()
    renderApp('/pdv/caixa', { withSeedOrders: true })
    const field = await screen.findByLabelText('Contado na gaveta')
    expect(field).toHaveDisplayValue(/R\$.412,00/)
    expect(screen.getByText('Conte as notas e moedas.')).toBeInTheDocument()
    await user.clear(field)
    await user.type(field, '407,00')
    expect(screen.getByText('Diferença').parentElement).toHaveTextContent(/−\s*R\$.5,00/)
    await user.click(screen.getByRole('button', { name: 'Fechar caixa' }))
    const modal = await screen.findByRole('alertdialog')
    expect(within(modal).getByText('Fechar o caixa?')).toBeInTheDocument()
    await user.click(within(modal).getByRole('button', { name: 'Fechar caixa' }))
    expect(await screen.findByRole('heading', { name: 'Caixa fechado' })).toBeInTheDocument()
    expect(screen.getByText(/Esperado R\$.412,00 · contado R\$.407,00 · diferença falta de R\$.5,00\. O gestor vê o fechamento no financeiro\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir novo caixa' })).toHaveAttribute('href', '/pdv/abertura')
    await user.click(screen.getByRole('button', { name: 'Reabrir (corrigir)' }))
    expect(await screen.findByText('Vendas no balcão · 26')).toBeInTheDocument()
  })

  it('valor contado inválido diz como corrigir', async () => {
    const user = userEvent.setup()
    renderApp('/pdv/caixa', { withSeedOrders: true })
    const field = await screen.findByLabelText('Contado na gaveta')
    await user.clear(field)
    await user.type(field, 'x')
    expect(screen.getByText('Informe o valor contado, por exemplo R$ 412,00.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fechar caixa' })).toBeDisabled()
  })
})

describe('acesso ao balcão', () => {
  it('sem entrar, volta para o login da equipe', async () => {
    useAdminSession.setState({ user: null })
    const { router } = renderApp('/pdv/vender', { withSeedOrders: true })
    await waitFor(() => expect(router.state.location.pathname).toBe('/gestao/entrar'))
  })

  it('produção e entregador não têm o balcão; gestor e atendente têm', async () => {
    signInAs('raimundo@exemplo.com')
    const a = renderApp('/pdv/vender', { withSeedOrders: true })
    expect(await screen.findByText('Você não tem acesso ao balcão')).toBeInTheDocument()
    a.unmount()
    signInAs('ana@exemplo.com')
    renderApp('/pdv/vender', { withSeedOrders: true })
    expect(await screen.findByRole('heading', { name: 'Balcão' })).toBeInTheDocument()
  })

  it('a Gestão lista o PDV para quem tem acesso', async () => {
    renderApp('/gestao/mais', { withSeedOrders: true })
    expect((await screen.findAllByRole('link', { name: /PDV \(balcão\)/ }))[0]).toHaveAttribute('href', '/pdv')
  })
})

describe('acessibilidade do PDV (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each(['/pdv/vender', '/pdv/vendas', '/pdv/vendas/V-0212', '/pdv/caixa'])('%s não tem violações', async (path) => {
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 300))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
  it.each(['/pdv/sacola', '/pdv/pagamento', '/pdv/pagamento/dividir'])('%s com sacola não tem violações', async (path) => {
    quadroCart()
    const { container } = renderApp(path, { withSeedOrders: true })
    await new Promise((r) => setTimeout(r, 300))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
