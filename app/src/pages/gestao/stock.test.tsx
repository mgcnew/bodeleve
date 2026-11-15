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
const rowOf = (name: string) => screen.getByText(name).closest('a')!

describe('estoque · visão geral', () => {
  it('conta baixo e vencendo como no quadro e filtra', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/estoque', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: 'Baixo · 7' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vencendo · 3' })).toBeInTheDocument()

    const coalho = rowOf('Queijo coalho 500 g')
    expect(coalho).toHaveTextContent('Feito na casa')
    expect(coalho).toHaveTextContent('Baixo')
    expect(coalho).toHaveTextContent('Vencendo')
    expect(coalho).toHaveTextContent(/Lote vence \d{2}\/\d{2}/)
    expect(coalho).toHaveTextContent('12 un')
    expect(coalho).toHaveTextContent('mín. 15')
    expect(rowOf('Leite integral 1 L')).toHaveTextContent('140 un chegam hoje')
    expect(rowOf('Leite integral 1 L')).toHaveTextContent('Matéria-prima')
    expect(rowOf('Rapadura 400 g')).toHaveTextContent('Marca Bodeleve')
    expect(rowOf('Tapioca granulada 500 g')).toHaveTextContent('Revenda')

    await user.click(screen.getByRole('button', { name: 'Vencendo · 3' }))
    expect(screen.getByText('Queijo coalho 500 g')).toBeInTheDocument()
    expect(screen.getByText('Nata 200 g')).toBeInTheDocument()
    expect(screen.getByText('Doce de leite 400 g')).toBeInTheDocument()
    expect(screen.queryByText('Farinha de mandioca 1 kg')).not.toBeInTheDocument()
  })

  it('abre já filtrado quando vem do alerta do início (?filtro=baixo)', async () => {
    renderApp('/gestao/estoque?filtro=baixo', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: 'Baixo · 7' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Farinha de mandioca 1 kg')).not.toBeInTheDocument()
  })

  it('o início calcula os alertas de estoque a partir dos dados', async () => {
    renderApp('/gestao', { withSeedOrders: true })
    expect(await screen.findByText('7 itens com estoque baixo')).toBeInTheDocument()
    expect(screen.getByText(/e mais 5$/)).toBeInTheDocument()
    expect(screen.getByText('3 lotes vencem em até 7 dias')).toBeInTheDocument()
  })
})

describe('estoque · item', () => {
  it('saldos do queijo coalho: disponível 12, físico 18, reservado 6, mínimo 15', async () => {
    renderApp('/gestao/estoque/queijo-coalho', { withSeedOrders: true })
    expect(await screen.findByRole('heading', { name: 'Lotes' })).toBeInTheDocument()
    const grid = (label: string) => screen.getByText(label).parentElement!
    expect(grid('Disponível')).toHaveTextContent('12')
    expect(grid('Físico')).toHaveTextContent('18')
    expect(grid('Reservado')).toHaveTextContent('6')
    expect(grid('Reservado')).toHaveTextContent('3 pedidos online e 1 reserva manual')
    expect(screen.getByText(/Mínimo: 15 un/)).toBeInTheDocument()
    expect(screen.getByText('Estoque baixo')).toBeInTheDocument()
  })

  it('lotes: o que vence primeiro é o próximo a sair', async () => {
    renderApp('/gestao/estoque/queijo-coalho', { withSeedOrders: true })
    await screen.findByText('Lote QC-1107')
    const first = screen.getByText('Lote QC-1107').parentElement!.parentElement!
    expect(first).toHaveTextContent('Próximo a sair')
    expect(first).toHaveTextContent('8 un')
    expect(first).toHaveTextContent('Vence em 5 dias')
    const second = screen.getByText('Lote QC-1112').parentElement!.parentElement!
    expect(second).toHaveTextContent('10 un')
    expect(second).toHaveTextContent('No prazo')
    expect(second).not.toHaveTextContent('Próximo a sair')
    expect(screen.getByText('Vendas e pedidos usam primeiro o lote que vence antes.')).toBeInTheDocument()
  })

  it('tipo, custo, preço e publicação na loja', async () => {
    renderApp('/gestao/estoque/queijo-coalho', { withSeedOrders: true })
    await screen.findByText('Tipo')
    expect(screen.getByText('Tipo').parentElement).toHaveTextContent('Produto acabado')
    expect(screen.getByText('Custo de produção').parentElement).toHaveTextContent(money('14,20'))
    expect(screen.getByText('Preço de venda').parentElement).toHaveTextContent(money('32,90'))
    expect(screen.getByText('Na loja online').parentElement).toHaveTextContent('Publicado')
  })

  it('matéria-prima não tem preço nem publicação', async () => {
    renderApp('/gestao/estoque/leite-integral', { withSeedOrders: true })
    await screen.findByText('Tipo')
    expect(screen.queryByText('Preço de venda')).not.toBeInTheDocument()
    expect(screen.queryByText('Na loja online')).not.toBeInTheDocument()
    expect(screen.getByText('Projetado').parentElement).toHaveTextContent('+ 140 a receber')
  })
})

describe('estoque · movimentações', () => {
  it('reproduz a lista do quadro, mais recentes primeiro, com o saldo depois de cada uma', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/estoque/queijo-coalho/movimentacoes', { withSeedOrders: true })
    expect(await screen.findByText('Saldo físico atual: 18 un')).toBeInTheDocument()
    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '')
    expect(items).toHaveLength(6)
    const saldos = items.map((t) => Number(t.match(/saldo (\d+)/)![1]))
    expect(saldos).toEqual([18, 20, 21, 11, 12, 15])
    expect(items[0]).toContain('Venda no balcão')
    expect(items[0]).toContain('−2 un')
    expect(items[1]).toContain('Venda online · pedido #1037')
    expect(items[2]).toContain('Produção · OP-0031')
    expect(items[2]).toContain('+10 un')
    expect(items[3]).toContain('Perda · embalagem danificada')
    expect(items[3]).toContain('por Ana')
    expect(items[3]).toContain('Lote QC-1107')

    await user.click(screen.getByRole('button', { name: 'Entradas' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Saídas' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })
})

describe('estoque · ajuste e perda', () => {
  it('registra a perda, mostra o custo, atualiza saldos e permite desfazer sem apagar o histórico', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/estoque/queijo-coalho/ajuste', { withSeedOrders: true })
    expect(await screen.findByText('Físico 18 un · disponível 12 un')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Perda/ })).toBeChecked()
    expect(screen.getByLabelText('Lote')).toHaveDisplayValue(/QC-1107 · vence \d{2}\/\d{2} · 8 un/)
    expect(screen.getByText('Saldo físico').parentElement).toHaveTextContent('18 → 17 un')
    expect(screen.getByText('Custo da perda').parentElement).toHaveTextContent(money('14,20'))

    await user.click(screen.getByRole('button', { name: 'Aumentar' }))
    expect(screen.getByText('Saldo físico').parentElement).toHaveTextContent('18 → 16 un')
    expect(screen.getByText('Custo da perda').parentElement).toHaveTextContent(money('28,40'))
    await user.click(screen.getByRole('button', { name: 'Registrar saída' }))

    expect(await screen.findByRole('heading', { name: 'Saída registrada' })).toBeInTheDocument()
    expect(screen.getByText(/2 un de Queijo coalho 500 g · R\$.28,40 de custo · lote QC-1107/)).toBeInTheDocument()

    // depois de registrar, "Desfazer" volta ao formulário (o histórico guarda o lançamento e o contrário)
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(await screen.findByText('Físico 18 un · disponível 12 un')).toBeInTheDocument()
  })

  it('quantidade não passa do que o lote tem', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/estoque/queijo-coalho/ajuste', { withSeedOrders: true })
    await screen.findByText('Físico 18 un · disponível 12 un')
    const inc = screen.getByRole('button', { name: 'Aumentar' })
    for (let i = 0; i < 10; i++) if (!(inc as HTMLButtonElement).disabled) await user.click(inc)
    expect(inc).toBeDisabled()
    expect(screen.getByRole('group', { name: 'Quantidade' })).toHaveTextContent('8')
  })

  it('correção pode somar ao estoque', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/estoque/queijo-coalho/ajuste', { withSeedOrders: true })
    await screen.findByText('Físico 18 un · disponível 12 un')
    await user.click(screen.getByRole('radio', { name: /Correção de contagem/ }))
    await user.click(screen.getByRole('button', { name: 'Somar ao estoque' }))
    expect(screen.getByText('Quantidade que entrou')).toBeInTheDocument()
    expect(screen.getByText('Saldo físico').parentElement).toHaveTextContent('18 → 19 un')
    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }))
    expect(await screen.findByRole('heading', { name: 'Entrada registrada' })).toBeInTheDocument()
  })

  it('sem item na rota, pede para escolher o item', async () => {
    renderApp('/gestao/estoque/ajuste', { withSeedOrders: true })
    expect(await screen.findByLabelText('Qual item?')).toBeInTheDocument()
  })

  it('serviço: perda aparece no histórico com o motivo e quem lançou; desfazer lança o contrário', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    const r = await svc.admin.stock.adjust({ itemId: 'queijo-coalho', lotId: 'lot-queijo-coalho-1', qty: 2, kind: 'loss', reason: 'Vencido', by: 'Ana' })
    expect(r).toMatchObject({ costCents: 2840, physicalBefore: 18, physicalAfter: 16, lotCode: 'QC-1107' })
    let mv = await svc.admin.stock.movements('queijo-coalho')
    expect(mv?.rows[0]).toMatchObject({ description: 'Perda · vencido', by: 'Ana', qty: -2 })
    await svc.admin.stock.undoMovement(r.movementId, 'Ana')
    mv = await svc.admin.stock.movements('queijo-coalho')
    expect(mv?.physical).toBe(18)
    expect(mv?.rows).toHaveLength(8)
    expect(mv?.rows.find((m) => m.id === r.movementId)?.reversed).toBe(true)
    await expect(svc.admin.stock.adjust({ itemId: 'queijo-coalho', lotId: 'lot-queijo-coalho-1', qty: 99, kind: 'loss', reason: '', by: 'Ana' })).rejects.toThrow('insufficient')
  })
})

describe('estoque · inventário', () => {
  it('por área: tudo confere no começo; uma diferença mostra sobra/falta, unidades e custo; aplicar lança o ajuste e corrigir desfaz', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/estoque/contagem', { withSeedOrders: true })
    expect(await screen.findByLabelText('O que contar')).toHaveDisplayValue(/Queijos e laticínios · 8 itens/)
    expect((await screen.findAllByText('Confere')).length).toBe(8)
    expect(screen.getByText('Itens com diferença').parentElement).toHaveTextContent('0')

    const coalho = screen.getByRole('group', { name: 'Contado de Queijo coalho 500 g' })
    await user.click(within(coalho).getByRole('button', { name: 'Diminuir' }))
    expect(screen.getByText('Falta 1')).toBeInTheDocument()
    expect(screen.getByText('Itens com diferença').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Diferença em unidades').parentElement).toHaveTextContent('−1 un')
    expect(screen.getByText('Diferença em custo').parentElement).toHaveTextContent(/−.*R\$.14,20/)

    await user.click(screen.getByRole('button', { name: 'Aplicar contagem' }))
    expect(await screen.findByRole('heading', { name: 'Contagem aplicada' })).toBeInTheDocument()
    expect(screen.getByText(/1 ajuste lançado · − R\$.14,20 em custo/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Corrigir contagem' }))
    expect((await screen.findAllByText('Confere')).length).toBe(8) // saldo voltou para 18
  })

  it('contagem sem diferença não lança nada', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/estoque/contagem', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Aplicar contagem' }))
    expect(await screen.findByText('Tudo conferiu. Nenhum ajuste foi feito.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Corrigir contagem' })).not.toBeInTheDocument()
  })

  it('trocar a área troca os itens; "Tudo" traz todos', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/estoque/contagem', { withSeedOrders: true })
    await screen.findByLabelText('O que contar')
    await user.selectOptions(screen.getByLabelText('O que contar'), 'farinhas')
    expect(await screen.findByText('Tapioca granulada 500 g')).toBeInTheDocument()
    expect(screen.queryByText('Queijo coalho 500 g')).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('O que contar'), 'all')
    expect(await screen.findByText('Queijo coalho 500 g')).toBeInTheDocument()
  })
})

describe('estoque · acesso e integração', () => {
  it('produção acessa o estoque; atendente não', async () => {
    signInAs('raimundo@exemplo.com')
    const { unmount } = renderApp('/gestao/estoque', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: 'Baixo · 7' })).toBeInTheDocument()
    unmount()
    signInAs('julia@exemplo.com')
    renderApp('/gestao/estoque', { withSeedOrders: true })
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument()
  })

  it('a separação do pedido usa o lote que vence primeiro do estoque', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/pedidos/1043', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Aceitar e começar a separar' }))
    expect(await screen.findByText(/Lote QC-1107 · vence \d{2}\/\d{2}/)).toBeInTheDocument()
  })

  it('perda do lote que vence primeiro muda o lote sugerido na separação (esgotado, passa ao próximo)', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    await svc.admin.stock.adjust({ itemId: 'queijo-coalho', lotId: 'lot-queijo-coalho-1', qty: 8, kind: 'loss', reason: 'Vencido', by: 'Ana' })
    const o = await svc.admin.orders.get('1043')
    expect(o?.items.find((i) => i.productId === 'queijo-coalho')?.lot?.code).toBe('QC-1112')
  })

  it('compra recebida entra no estoque como novo lote e aparece nas movimentações', async () => {
    const svc = createMockServices({ storage: memoryStorage(), withSeedOrders: true })
    const exp = new Date(Date.now() + 9 * 86_400_000).toISOString()
    await svc.admin.purchasing.receive('PC-0057', {
      closeShort: false,
      lines: [
        { itemId: 'leite-integral', qty: 140, lot: 'LT-1120', expiresAt: exp },
        { itemId: 'requeijao', qty: 20, lot: 'RQ-1118', expiresAt: exp },
        { itemId: 'nata', qty: 12, lot: 'NT-1114', expiresAt: exp },
      ],
    })
    const item = await svc.admin.stock.getItem('leite-integral')
    expect(item?.physical).toBe(158)
    expect(item?.incoming).toBe(0)
    expect(item?.level).toBe('ok')
    const mv = await svc.admin.stock.movements('leite-integral')
    expect(mv?.rows[0]).toMatchObject({ description: 'Compra · PC-0057', lotCode: 'LT-1120', qty: 140 })
  })
})

describe('acessibilidade do estoque (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each([
    '/gestao/estoque', '/gestao/estoque/queijo-coalho', '/gestao/estoque/queijo-coalho/movimentacoes', '/gestao/estoque/queijo-coalho/ajuste',
    '/gestao/estoque/ajuste', '/gestao/estoque/contagem',
  ])('%s não tem violações', async (path) => {
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 120))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
