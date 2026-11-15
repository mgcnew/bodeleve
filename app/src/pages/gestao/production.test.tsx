import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { adminUsers } from '@/mocks/adminSeed'
import { createMockServices } from '@/mocks/services'
import { useAdminSession } from '@/store/admin'
import { memoryStorage, renderApp, resetStores } from '@/test/renderApp'

beforeEach(() => {
  resetStores()
  window.scrollTo = vi.fn()
  const u = adminUsers.find((x) => x.email === 'raimundo@exemplo.com')!
  useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
})

const money = (v: string) => new RegExp(`R\\$.${v.replace(/[.,]/g, '\\$&')}`)
const dm = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Recebe o leite do PC-0057 antes da tela abrir: sem ele a ordem não tem insumo para ser concluída. */
async function withMilk() {
  const storage = memoryStorage()
  const svc = createMockServices({ storage, withSeedOrders: true })
  const exp = new Date(Date.now() + 15 * 86_400_000).toISOString()
  await svc.admin.purchasing.receive('PC-0057', {
    closeShort: false,
    lines: [
      { itemId: 'leite-integral', qty: 140, lot: 'LT-1120', expiresAt: exp },
      { itemId: 'requeijao', qty: 20, lot: 'RQ-1118', expiresAt: exp },
      { itemId: 'nata', qty: 12, lot: 'NT-1114', expiresAt: exp },
    ],
  })
  return storage
}

describe('produção · ordens', () => {
  it('conta por situação e mostra as linhas dos quadros', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/producao', { withSeedOrders: true })
    expect(await screen.findByRole('button', { name: 'Em produção · 2' })).toHaveAttribute('aria-pressed', 'true')
    const coalho = screen.getByText('OP-0032 · 20 un · iniciada 09h · termina 18h').closest('a')!
    expect(coalho).toHaveTextContent('Queijo coalho 500 g')
    expect(coalho).toHaveTextContent('Para estoque')
    expect(screen.getByText('OP-0033 · 12 un · iniciada 13h · termina amanhã 10h')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Planejadas · 2' }))
    const manteiga = screen.getByText('OP-0034 · 6 un · começa amanhã 08h').closest('a')!
    expect(manteiga).toHaveTextContent('Para pedido #1041')
    expect(screen.getByText(`OP-0035 · 24 un · começa ${dm(4)}`)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Concluídas · 2' }))
    expect(screen.getByText(new RegExp(`OP-0031 · 10 de 10 un · lote QC-1112 · ${dm(-1)}`))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`OP-0030 · 11 de 12 un · lote DL-1110 · ${dm(-4)}`))).toBeInTheDocument()
  })

  it('o início mostra quantas ordens estão em produção e o que é', async () => {
    renderApp('/gestao', { withSeedOrders: true })
    const u = adminUsers.find((x) => x.email === 'ana@exemplo.com')!
    useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
    expect(await screen.findByText('2 ordens')).toBeInTheDocument()
    expect(screen.getByText('Queijo coalho · Doce de leite')).toBeInTheDocument()
  })

  it('o em produção entra no projetado do estoque: coalho 12 + 20 = 32', async () => {
    renderApp('/gestao/estoque/queijo-coalho', { withSeedOrders: true })
    await screen.findByText('Projetado')
    expect(screen.getByText('Projetado').parentElement).toHaveTextContent('32')
    expect(screen.getByText('Projetado').parentElement).toHaveTextContent('+ 20 em produção')
    expect(screen.getByText(/Com a produção em andamento \(OP-0032, termina 18h\), o saldo volta acima do mínimo/)).toBeInTheDocument()
  })
})

describe('produção · fichas técnicas', () => {
  it('lista com custo por unidade e margem, como no quadro', async () => {
    renderApp('/gestao/producao/fichas', { withSeedOrders: true })
    const row = (name: string) => screen.getByText(name).closest('a')!
    expect(await screen.findByText('Queijo coalho 500 g')).toBeInTheDocument()
    expect(row('Queijo coalho 500 g')).toHaveTextContent('10 un por fornada')
    expect(row('Queijo coalho 500 g')).toHaveTextContent(money('14,20'))
    expect(row('Queijo coalho 500 g')).toHaveTextContent('margem 57%')
    expect(row('Queijo manteiga 500 g')).toHaveTextContent('margem 54%')
    expect(row('Doce de leite 400 g')).toHaveTextContent('12 un por tacho')
    expect(row('Manteiga de garrafa 200 ml')).toHaveTextContent('Marca Bodeleve')
    expect(row('Manteiga de garrafa 200 ml')).toHaveTextContent('margem 46%')
  })

  it('ficha do queijo coalho: indicadores, insumos por fornada e total R$ 142,00', async () => {
    renderApp('/gestao/producao/fichas/ficha-queijo-coalho', { withSeedOrders: true })
    expect(await screen.findByRole('heading', { name: 'Queijo coalho 500 g' })).toBeInTheDocument()
    expect(screen.getByText('Rende 10 un por fornada · validade 20 dias')).toBeInTheDocument()
    expect(screen.getByText('Custo / un').parentElement).toHaveTextContent(money('14,20'))
    expect(screen.getByText('Preço').parentElement).toHaveTextContent(money('32,90'))
    expect(screen.getByText('Margem').parentElement).toHaveTextContent('57%')
    const por = screen.getByRole('heading', { name: 'Por fornada' }).closest('section')!
    expect(within(por).getByText('Leite integral').parentElement).toHaveTextContent(`40 L${'R$'}`.slice(0, 4))
    expect(por).toHaveTextContent(money('124,00'))
    expect(por).toHaveTextContent('20 ml')
    expect(por).toHaveTextContent('0,5 kg')
    expect(por).toHaveTextContent('10 un')
    expect(por).toHaveTextContent(money('142,00'))
  })

  it('confere os insumos: falta leite que chega hoje; muda com o número de fornadas', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/producao/fichas/ficha-queijo-coalho', { withSeedOrders: true })
    expect(await screen.findByText('precisa 80 L · tem 18 L')).toBeInTheDocument()
    expect(screen.getByText('Faltam 62 L')).toBeInTheDocument()
    expect(screen.getByText('precisa 40 ml · tem 50 ml')).toBeInTheDocument()
    expect(screen.getByText(/que falta chega hoje na compra em andamento \(140 un\)\. A ordem pode ser criada/)).toBeInTheDocument()
    expect(screen.getByText(/20 un · custo/).textContent).toMatch(/R\$.284,00/)
    await user.click(screen.getByRole('button', { name: 'Aumentar' }))
    expect(await screen.findByText('precisa 120 L · tem 18 L')).toBeInTheDocument()
    expect(screen.getByText('Faltam 102 L')).toBeInTheDocument()
  })

  it('falta insumo sem compra a caminho: a ordem fica planejada', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/producao/fichas/ficha-doce-de-leite', { withSeedOrders: true })
    expect(await screen.findByText(/Faltam insumos|chega hoje/)).toBeInTheDocument()
    // doce de leite: 2 tachos pedem 36 L de leite (tem 18) e o açúcar tem de sobra; o leite chega hoje
    expect(screen.getByText(/A ordem pode ser criada/)).toBeInTheDocument()
    for (let i = 0; i < 5; i++) await user.click(screen.getByRole('button', { name: 'Aumentar' }))
    // 7 tachos exigem muito mais leite do que o que chega hoje
    expect(await screen.findByText(/Faltam insumos: a ordem fica planejada até a compra chegar/)).toBeInTheDocument()
  })

  it('cria a ordem OP-0036, reserva o que há e permite desfazer', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/producao/fichas/ficha-queijo-coalho', { withSeedOrders: true })
    await screen.findByText('Faltam 62 L')
    expect(screen.getByRole('radio', { name: /Para estoque/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Criar ordem de produção' }))
    expect(await screen.findByRole('heading', { name: 'Ordem OP-0036 criada' })).toBeInTheDocument()
    expect(screen.getByText(/20 un de Queijo coalho 500 g · começa amanhã às 08h/)).toBeInTheDocument()
    expect(screen.getByText(/de coalho líquido.*reservados/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(await screen.findByRole('button', { name: 'Criar ordem de produção' })).toBeInTheDocument()
  })

  it('"para um pedido" exige escolher o pedido', async () => {
    const user = userEvent.setup()
    const u = adminUsers.find((x) => x.email === 'ana@exemplo.com')!
    useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
    renderApp('/gestao/producao/fichas/ficha-queijo-manteiga', { withSeedOrders: true })
    await screen.findByText('Faltam', { exact: false })
    await user.click(screen.getByRole('radio', { name: /Para um pedido/ }))
    await user.click(screen.getByRole('button', { name: 'Criar ordem de produção' }))
    expect(await screen.findByText('Escolha o pedido que esta ordem vai atender.')).toBeInTheDocument()
    await user.selectOptions(await screen.findByLabelText('Pedido'), '1041')
    await user.click(screen.getByRole('button', { name: 'Criar ordem de produção' }))
    expect(await screen.findByRole('heading', { name: /Ordem OP-0036 criada/ })).toBeInTheDocument()
  })
})

describe('produção · apontamento (ordem OP-0032)', () => {
  it('mostra o consumo previsto da ficha, o rendimento e os custos do quadro', async () => {
    renderApp('/gestao/producao/ordens/OP-0032', { withSeedOrders: true })
    expect(await screen.findByRole('heading', { name: 'Consumo real' })).toBeInTheDocument()
    expect(screen.getByText('2 fornadas · previsto 20 un · para estoque · iniciada 09h, termina 18h')).toBeInTheDocument()
    expect(screen.getByText('Previsto 80 L')).toBeInTheDocument()
    expect(screen.getByText('Previsto 40 ml')).toBeInTheDocument()
    expect(screen.getByText('Previsto 1,0 kg')).toBeInTheDocument()
    expect(screen.getByText('Previsto 20 un')).toBeInTheDocument()
    expect(screen.getAllByText('Como previsto')).toHaveLength(4)
    expect(screen.getByText('previsto 20 · 95% do previsto')).toBeInTheDocument()
    expect(screen.getByLabelText('Lote')).toHaveValue('QC-1113')
    expect(screen.getByText('Custo previsto / un').parentElement).toHaveTextContent(money('14,20'))
    expect(screen.getByText('Custo real / un').parentElement).toHaveTextContent(money('14,95')) // 19 un boas
  })

  it('consumo diferente do previsto aparece como diferença e muda o custo real', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/producao/ordens/OP-0032', { withSeedOrders: true })
    const leite = await screen.findByRole('group', { name: 'Consumo real de Leite integral' })
    await user.click(within(leite).getByRole('button', { name: 'Aumentar' }))
    expect(screen.getByText('+1 L')).toBeInTheDocument()
    const custo = screen.getByText('Custo real / un').parentElement!.textContent!
    expect(custo).not.toMatch(/14,95/)
  })

  it('sem o leite no estoque a produção não conclui e nada é lançado', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/producao/ordens/OP-0032', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Concluir produção' }))
    expect(await screen.findByText(/Não há leite integral suficiente no estoque/)).toBeInTheDocument()
    expect(screen.queryByText('Produção concluída')).not.toBeInTheDocument()
  })

  it('exige o lote do que foi produzido', async () => {
    const user = userEvent.setup()
    const storage = await withMilk()
    renderApp('/gestao/producao/ordens/OP-0032', { withSeedOrders: true, storage })
    await user.clear(await screen.findByLabelText('Lote'))
    await user.click(screen.getByRole('button', { name: 'Concluir produção' }))
    expect(await screen.findByText('Informe o lote do que foi produzido.')).toBeInTheDocument()
  })

  it('conclui: entra o lote, saem os insumos, custo real R$ 14,95 e perda de 1 un; corrigir volta', async () => {
    const user = userEvent.setup()
    const storage = await withMilk()
    renderApp('/gestao/producao/ordens/OP-0032', { withSeedOrders: true, storage })
    await user.click(await screen.findByRole('button', { name: 'Concluir produção' }))
    expect(await screen.findByRole('heading', { name: 'Produção concluída' })).toBeInTheDocument()
    const entrou = screen.getByText('Entrou no estoque').closest('section')!
    expect(entrou).toHaveTextContent('Queijo coalho 500 g')
    expect(entrou).toHaveTextContent(/Lote QC-1113 · vence \d{2}\/\d{2}\/\d{4}/)
    expect(entrou).toHaveTextContent('+ 19 un')
    const saiu = screen.getByText('Saiu do estoque (insumos)').closest('section')!
    expect(saiu).toHaveTextContent('Leite integral80 L')
    expect(saiu).toHaveTextContent('Coalho líquido40 ml')
    expect(saiu).toHaveTextContent('Sal1 kg')
    expect(saiu).toHaveTextContent('Embalagem a vácuo20 un')
    expect(screen.getByText('Custo real / un').parentElement).toHaveTextContent(money('14,95'))
    expect(screen.getByText('Perda na produção').parentElement).toHaveTextContent('1 un')

    await user.click(screen.getByRole('button', { name: 'Corrigir apontamento' }))
    expect(await screen.findByRole('heading', { name: 'Consumo real' })).toBeInTheDocument()
  })

  it('o estoque reflete a conclusão: coalho 18 → 37 e o leite baixa 80', async () => {
    const storage = await withMilk()
    const svc = createMockServices({ storage, withSeedOrders: true })
    const before = await svc.admin.stock.getItem('leite-integral')
    const r = await svc.admin.production.finish('OP-0032', {
      consumption: [{ itemId: 'leite-integral', qty: 80 }, { itemId: 'coalho-liquido', qty: 0.8 }, { itemId: 'sal', qty: 1 }, { itemId: 'embalagem-vacuo', qty: 20 }],
      goodQty: 19, lotCode: 'QC-1113', expiresAt: null,
    })
    expect(r.costPerUnitCents).toBe(1495)
    expect(r.lossQty).toBe(1)
    expect((await svc.admin.stock.getItem('queijo-coalho'))?.physical).toBe(37)
    expect((await svc.admin.stock.getItem('leite-integral'))?.physical).toBe(before!.physical - 80)
    const mv = await svc.admin.stock.movements('queijo-coalho')
    expect(mv?.rows[0]).toMatchObject({ description: 'Produção · OP-0032 · Entrada do lote QC-1113', qty: 19 })
    // concluída, a ordem deixa de contar como "em produção" no projetado
    expect((await svc.admin.stock.getItem('queijo-coalho'))?.inProduction).toBe(0)
  })

  it('ordem planejada tem "Iniciar produção" e depois abre o apontamento', async () => {
    const user = userEvent.setup()
    renderApp('/gestao/producao/ordens/OP-0034', { withSeedOrders: true })
    await user.click(await screen.findByRole('button', { name: 'Iniciar produção' }))
    expect(await screen.findByRole('heading', { name: 'Consumo real' })).toBeInTheDocument()
  })

  it('ordem concluída de exemplo mostra o resumo sem botão de corrigir', async () => {
    renderApp('/gestao/producao/ordens/OP-0031', { withSeedOrders: true })
    expect(await screen.findByRole('heading', { name: 'Produção concluída' })).toBeInTheDocument()
    expect(screen.getByText(/Lote QC-1112/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Corrigir apontamento' })).not.toBeInTheDocument()
  })
})

describe('produção · acesso', () => {
  it('atendente não acessa a produção', async () => {
    const u = adminUsers.find((x) => x.email === 'julia@exemplo.com')!
    useAdminSession.setState({ user: { id: u.id, name: u.name, email: u.email, role: u.role } })
    renderApp('/gestao/producao', { withSeedOrders: true })
    expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument()
  })
})

describe('acessibilidade da produção (axe)', () => {
  const rules = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } }
  it.each([
    '/gestao/producao', '/gestao/producao/fichas', '/gestao/producao/fichas/ficha-queijo-coalho', '/gestao/producao/ordens/OP-0032',
    '/gestao/producao/ordens/OP-0034', '/gestao/producao/ordens/OP-0031',
  ])('%s não tem violações', async (path) => {
    const { container } = renderApp(path, { withSeedOrders: true })
    await waitFor(() => expect(container.querySelector('main')).not.toBeNull())
    await new Promise((r) => setTimeout(r, 150))
    expect(await axe(container, rules)).toHaveNoViolations()
  })
})
