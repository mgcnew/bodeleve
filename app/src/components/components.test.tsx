import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import {
  Button, IconButton, TextField, QuantityStepper, Segmented, Switch, Tabs, BottomSheet, Modal, ConfirmationCode, ProductCard, FavoriteTile,
  BottomNav, BagBar, OrderTimeline, CashClosing, ToastProvider, useToast, WeightField, SearchField,
} from '.'
import { Gallery } from '@/gallery/Gallery'

describe('acessibilidade (axe)', () => {
  it('o catálogo inteiro não tem violações detectáveis em jsdom', async () => {
    const { container } = render(<Gallery />)
    // Contraste de cor não é calculável em jsdom (sem layout/estilo); é coberto por contrast.test.ts.
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })
    expect(results).toHaveNoViolations()
  })
})

describe('Button', () => {
  it('não dispara clique enquanto carrega e expõe aria-busy', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Enviando…</Button>)
    const btn = screen.getByRole('button', { name: 'Enviando…' })
    expect(btn).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })
  it('é type=button por padrão (não envia formulário sem querer)', () => {
    render(<Button>Ok</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})

describe('IconButton', () => {
  it('tem nome acessível', () => {
    render(<IconButton icon="fechar" label="Fechar" />)
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
  })
})

describe('TextField', () => {
  it('liga rótulo, erro e aria-invalid', () => {
    render(<TextField label="Validade do lote" error="Data inválida. Use dia/mês/ano." />)
    const input = screen.getByLabelText('Validade do lote')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Data inválida. Use dia/mês/ano.')
  })
})

describe('SearchField', () => {
  it('tem nome acessível pelo rótulo oculto', () => {
    render(<SearchField label="Buscar produto" />)
    expect(screen.getByRole('searchbox', { name: 'Buscar produto' })).toBeInTheDocument()
  })
})

describe('QuantityStepper', () => {
  it('respeita mínimo e máximo', async () => {
    const Demo = () => {
      const [v, setV] = useState(1)
      return <QuantityStepper value={v} onChange={setV} min={1} max={2} label="Quantidade de Rapadura" />
    }
    render(<Demo />)
    const group = screen.getByRole('group', { name: 'Quantidade de Rapadura' })
    const dec = within(group).getByRole('button', { name: 'Diminuir' })
    const inc = within(group).getByRole('button', { name: 'Aumentar' })
    expect(dec).toBeDisabled()
    await userEvent.click(inc)
    expect(group).toHaveTextContent('2')
    expect(inc).toBeDisabled()
  })
})

describe('Segmented', () => {
  it('marca a opção escolhida com aria-pressed', async () => {
    const onChange = vi.fn()
    render(<Segmented label="Tipo de entrega" value="a" onChange={onChange} options={[{ value: 'a', label: 'Entrega' }, { value: 'b', label: 'Retirada' }]} />)
    expect(screen.getByRole('button', { name: 'Entrega' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Retirada' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

describe('Switch', () => {
  it('alterna e expõe role=switch com nome', async () => {
    const Demo = () => { const [on, setOn] = useState(false); return <Switch label="Publicar na loja" checked={on} onChange={setOn} /> }
    render(<Demo />)
    const sw = screen.getByRole('switch', { name: 'Publicar na loja' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })
})

describe('Tabs', () => {
  it('troca de aba com setas e Home/End', async () => {
    const Demo = () => {
      const [v, setV] = useState<'a' | 'b' | 'c'>('a')
      return <Tabs label="Catálogo" value={v} onChange={setV} tabs={[{ value: 'a', label: 'Favoritos' }, { value: 'b', label: 'Categorias' }, { value: 'c', label: 'Buscar' }]} />
    }
    render(<Demo />)
    const first = screen.getByRole('tab', { name: 'Favoritos' })
    first.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Categorias' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Buscar' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Favoritos' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('BottomSheet e Modal', () => {
  it('a folha abre, mostra o conteúdo e fecha com Esc', async () => {
    const onClose = vi.fn()
    render(<BottomSheet open onClose={onClose} title="Carne de sol"><span>conteúdo</span></BottomSheet>)
    const dlg = screen.getByRole('dialog', { name: 'Carne de sol', hidden: true })
    expect(dlg).toHaveAttribute('open')
    dlg.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(onClose).toHaveBeenCalled()
  })
  it('o modal é alertdialog e Esc chama onCancel (opção segura)', () => {
    const onCancel = vi.fn()
    render(<Modal open title="Cancelar esta venda?" description="Não pode ser desfeita." onCancel={onCancel}><Button>Continuar</Button></Modal>)
    const dlg = screen.getByRole('alertdialog', { name: 'Cancelar esta venda?', hidden: true })
    expect(dlg).toHaveAccessibleDescription('Não pode ser desfeita.')
    dlg.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(onCancel).toHaveBeenCalled()
  })
})

describe('Toast', () => {
  it('mostra o aviso e executa a ação', async () => {
    const onAction = vi.fn()
    const Demo = () => { const t = useToast(); return <button type="button" onClick={() => t.show({ message: 'Adicionado', actionLabel: 'Desfazer', onAction })}>go</button> }
    render(<ToastProvider><Demo /></ToastProvider>)
    await userEvent.click(screen.getByText('go'))
    expect(screen.getByRole('status')).toHaveTextContent('Adicionado')
    await userEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(onAction).toHaveBeenCalled()
  })
})

describe('ConfirmationCode', () => {
  const Demo = ({ onChange }: { onChange?: (v: string) => void }) => {
    const [v, setV] = useState('')
    return <ConfirmationCode value={v} onChange={(x) => { setV(x); onChange?.(x) }} />
  }
  it('avança sozinho entre os dígitos e ignora letras', async () => {
    render(<Demo />)
    await userEvent.click(screen.getByLabelText('Dígito 1'))
    await userEvent.keyboard('4a82')
    expect(screen.getByLabelText('Dígito 1')).toHaveValue('4')
    expect(screen.getByLabelText('Dígito 2')).toHaveValue('8')
    expect(screen.getByLabelText('Dígito 3')).toHaveValue('2')
  })
  it('aceita colar o código inteiro', async () => {
    const onChange = vi.fn()
    render(<Demo onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('Dígito 1'))
    await userEvent.paste('4821')
    expect(onChange).toHaveBeenLastCalledWith('4821')
  })
  it('Backspace apaga e volta', async () => {
    render(<Demo />)
    await userEvent.click(screen.getByLabelText('Dígito 1'))
    await userEvent.keyboard('48')
    await userEvent.keyboard('{Backspace}')
    expect(screen.getByLabelText('Dígito 2')).toHaveValue('')
    expect(screen.getByLabelText('Dígito 1')).toHaveValue('4')
  })
})

describe('WeightField', () => {
  it('marca o atalho que corresponde ao peso atual', () => {
    render(<WeightField value="0,500" onChange={() => undefined} currentKg={0.5} shortcuts={[{ label: '250 g', kg: 0.25 }, { label: '500 g', kg: 0.5 }]} />)
    expect(screen.getByRole('button', { name: '500 g' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '250 g' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('componentes de domínio', () => {
  it('ProductCard usa o marcador de foto e um botão com o nome do produto', () => {
    render(<ProductCard name="Queijo coalho" detail="500 g" priceCents={3290} origin="house" />)
    expect(screen.getByRole('img', { name: 'Espaço para foto do produto' })).toHaveTextContent('[FOTO DO PRODUTO]')
    expect(screen.getByRole('button', { name: 'Adicionar Queijo coalho à sacola' })).toBeInTheDocument()
    expect(screen.getByText('Feito na casa')).toBeInTheDocument()
  })
  it('FavoriteTile em estoque baixo é lido como "estoque baixo"', () => {
    render(<FavoriteTile name="Tapioca" price="9,90" stock="3 un" lowStock />)
    expect(screen.getByRole('button', { name: /Tapioca.*3 un.*estoque baixo/ })).toBeInTheDocument()
  })
  it('BagBar some sem itens e pluraliza', () => {
    const { rerender, container } = render(<BagBar itemCount={0} totalCents={0} href="/sacola" />)
    expect(container).toBeEmptyDOMElement()
    rerender(<BagBar itemCount={1} totalCents={3290} href="/sacola" />)
    expect(screen.getByRole('link')).toHaveTextContent('Ver sacola · 1 item')
    rerender(<BagBar itemCount={3} totalCents={8640} href="/sacola" />)
    expect(screen.getByRole('link')).toHaveTextContent('Ver sacola · 3 itens')
  })
  it('BottomNav marca a página atual com aria-current', () => {
    render(<BottomNav items={[{ label: 'Início', icon: 'inicio', href: '/', active: true }, { label: 'Buscar', icon: 'buscar', href: '/b' }]} />)
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Buscar' })).not.toHaveAttribute('aria-current')
  })
  it('OrderTimeline diz o estado de cada etapa por texto', () => {
    render(<OrderTimeline steps={[{ label: 'Recebido', state: 'done' }, { label: 'Em rota', state: 'current' }, { label: 'Entregue', state: 'future' }]} />)
    const atual = screen.getByText('Em rota').closest('li')
    expect(atual).toHaveAttribute('aria-current', 'step')
    expect(atual).toHaveTextContent('etapa atual')
  })
  it('CashClosing mostra a diferença negativa com sinal de menos', () => {
    render(<CashClosing expectedCents={41200} countedCents={40700} />)
    expect(screen.getByText(/^− R\$.5,00$/)).toBeInTheDocument()
  })
})
