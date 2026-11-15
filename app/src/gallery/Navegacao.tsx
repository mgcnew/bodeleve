import { useState } from 'react'
import { BottomNav, BagBar, TopBar, Tabs, Segmented, BottomSheet, Modal, ToastView, useToast, SideMenu, Button, IconButton, WeightField, type NavItem } from '@/components'
import { formatBRL, formatDecimal, parseDecimal } from '@/lib/format'
import { weightLineTotalCents } from '@/domain/money'
import { Section, Panel, Legend } from './parts'
import s from './gallery.module.css'

const loja: NavItem[] = [
  { label: 'Início', icon: 'inicio', href: '#navegacao', active: true },
  { label: 'Buscar', icon: 'buscar', href: '#navegacao' },
  { label: 'Pedidos', icon: 'pedidos', href: '#navegacao' },
  { label: 'Perfil', icon: 'perfil', href: '#navegacao' },
]
const gestao: NavItem[] = [
  { label: 'Início', icon: 'inicio', href: '#navegacao', active: true },
  { label: 'Pedidos', icon: 'pedidos', href: '#navegacao' },
  { label: 'Estoque', icon: 'estoque', href: '#navegacao' },
  { label: 'Financeiro', icon: 'financeiro', href: '#navegacao' },
  { label: 'Mais', icon: 'mais', href: '#navegacao' },
]
const pdv: NavItem[] = [
  { label: 'Vender', icon: 'vender', href: '#navegacao', active: true },
  { label: 'Vendas', icon: 'historico', href: '#navegacao' },
  { label: 'Caixa', icon: 'caixa', href: '#navegacao' },
]
const entregas: NavItem[] = [
  { label: 'Entregas', icon: 'entregas', href: '#navegacao', active: true },
  { label: 'Histórico', icon: 'historico', href: '#navegacao' },
  { label: 'Perfil', icon: 'perfil', href: '#navegacao' },
]
const modulos: NavItem[] = [
  { label: 'Início', icon: 'inicio', href: '#navegacao', active: true },
  { label: 'Vendas e pedidos', icon: 'pedidos', href: '#navegacao' },
  { label: 'Estoque', icon: 'estoque', href: '#navegacao' },
  { label: 'Financeiro', icon: 'financeiro', href: '#navegacao' },
  { label: 'Compras', icon: 'compras', href: '#navegacao' },
  { label: 'Fornecedores', icon: 'entregas', href: '#navegacao' },
  { label: 'Produção', icon: 'producao', href: '#navegacao' },
  { label: 'Produtos', icon: 'vender', href: '#navegacao' },
  { label: 'Clientes', icon: 'perfil', href: '#navegacao' },
  { label: 'Entregas', icon: 'local', href: '#navegacao' },
  { label: 'Relatórios', icon: 'historico', href: '#navegacao' },
  { label: 'Configurações', icon: 'mais', href: '#navegacao' },
]

function Frame({ name, note, tone = 'op', children }: { name: string; note: string; tone?: 'op' | 'loja'; children: React.ReactNode }) {
  return (
    <div className={s.stack} style={{ gap: 8 }}>
      <b style={{ font: 'var(--titulo-s)' }}>{name}</b>
      <p style={{ font: 'var(--apoio)', color: 'var(--texto-secundario)', minHeight: 40 }}>{note}</p>
      <div className={`${s.frame} ${tone === 'loja' ? s.frameLoja : ''}`}>{children}</div>
    </div>
  )
}

export function Navegacao() {
  const [tab, setTab] = useState<'fav' | 'cat' | 'busca'>('fav')
  const [seg, setSeg] = useState<'disp' | 'minhas'>('disp')
  const [sheet, setSheet] = useState(false)
  const [modal, setModal] = useState(false)
  const [weight, setWeight] = useState('0,500')
  const toast = useToast()
  const kg = parseDecimal(weight)
  const total = kg == null ? 0 : weightLineTotalCents(5990, kg)

  return (
    <Section id="navegacao" title="Navegação e sobreposições" note="Barras inferiores dos quatro ambientes, barra superior, abas, folha, modal e menu lateral. A barra inferior some em checkout, pagamento e entrega em rota.">
      <Panel title="Barra inferior por ambiente" note="3 a 5 destinos de mesmo peso, com ícone e rótulo. Destino ativo em terracota e negrito: cor e peso juntos.">
        <div className={s.grid}>
          <Frame name="C · Loja online" note="Sacola aparece como barra fixa quando há itens." tone="loja">
            <div className={s.frameBody}>conteúdo da tela</div>
            <BagBar itemCount={3} totalCents={8640} href="#navegacao" />
            <BottomNav items={loja} label="Navegação da loja" />
          </Frame>
          <Frame name="A · Gestão" note="“Mais” abre o hub com os outros módulos.">
            <div className={s.frameBody}>conteúdo da tela</div>
            <BottomNav items={gestao} label="Navegação da gestão" />
          </Frame>
          <Frame name="B · PDV" note="Some durante o pagamento.">
            <div className={s.frameBody}>conteúdo da tela</div>
            <BottomNav items={pdv} label="Navegação do PDV" />
          </Frame>
          <Frame name="D · Entregas" note="Some durante a entrega em rota.">
            <div className={s.frameBody}>conteúdo da tela</div>
            <BottomNav items={entregas} label="Navegação das entregas" />
          </Frame>
        </div>
      </Panel>

      <div className={s.grid}>
        <Panel title="Barra superior, abas e segmentos">
          <Legend>Barra superior</Legend>
          <div className={s.frame}>
            <TopBar titleAs="h4" title="Recebimento" onBack={() => undefined} actions={<IconButton icon="buscar" label="Buscar" variant="plain" />} />
          </div>
          <Legend>Abas · PDV</Legend>
          <div className={s.frame}>
            <Tabs label="Catálogo do PDV" idPrefix="pdv" value={tab} onChange={setTab} tabs={[{ value: 'fav', label: 'Favoritos' }, { value: 'cat', label: 'Categorias' }, { value: 'busca', label: 'Buscar' }]} />
          </div>
          <Legend>Segmentos · Entregas</Legend>
          <div className={s.frame} style={{ padding: 12 }}>
            <Segmented label="Lista de entregas" value={seg} onChange={setSeg} options={[{ value: 'disp', label: 'Disponíveis · 4' }, { value: 'minhas', label: 'Minhas · 1' }]} />
          </div>
        </Panel>

        <Panel title="Folha, modal e aviso" note="Folha para escolhas curtas; modal para o que é crítico. Toque nos botões para abrir de verdade.">
          <div className={s.row}>
            <Button variant="secondary" onClick={() => setSheet(true)}>Abrir folha de peso</Button>
            <Button variant="destructive" onClick={() => setModal(true)}>Cancelar venda</Button>
            <Button variant="ghost" onClick={() => toast.show({ message: 'Produto adicionado à sacola', actionLabel: 'Desfazer' })}>Mostrar aviso</Button>
          </div>
          <Legend>Folha · escolha curta (estática)</Legend>
          <div className={s.overlay} style={{ padding: '56px 0 0' }}>
            <div className={s.sheetMock}>
              <div className={s.sheetHandle} aria-hidden="true" />
              <div><div style={{ font: '700 20px/26px var(--fonte-titulo)' }}>Carne de sol</div><div style={{ font: 'var(--apoio)', color: 'var(--texto-secundario)' }}>{formatBRL(5990)} / kg</div></div>
              <p style={{ font: 'var(--apoio)', color: 'var(--texto-secundario)' }}>Fecha ao arrastar para baixo, ao tocar fora e com Esc. Nunca para confirmação crítica nem para vários passos.</p>
            </div>
          </div>
          <Legend>Modal · confirmação crítica (estático)</Legend>
          <div className={s.overlay}>
            <div className={s.modalMock}>
              <div style={{ font: '700 20px/26px var(--fonte-titulo)' }}>Cancelar esta venda?</div>
              <div style={{ font: 'var(--apoio)', color: 'var(--texto-secundario)' }}>Os 3 itens da sacola serão removidos. Esta ação não pode ser desfeita.</div>
            </div>
          </div>
          <Legend>Aviso temporário</Legend>
          <ToastView toast={{ message: 'Produto adicionado à sacola', actionLabel: 'Desfazer' }} />
        </Panel>

        <Panel title="Menu lateral" note="A partir de 768 px a barra inferior vira menu lateral com os 12 módulos (Resp-Gestao-Desktop).">
          <SideMenu items={modulos} />
        </Panel>
      </div>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Carne de sol" description={`${formatBRL(5990)} / kg`}>
        <WeightField
          value={weight} onChange={setWeight} currentKg={kg} onShortcut={(k) => setWeight(formatDecimal(k, 3))}
          shortcuts={[{ label: '250 g', kg: 0.25 }, { label: '500 g', kg: 0.5 }, { label: '1 kg', kg: 1 }]}
        />
        <Button size="lg" fullWidth onClick={() => setSheet(false)} style={{ fontVariantNumeric: 'tabular-nums' }}>Adicionar · {formatBRL(total)}</Button>
      </BottomSheet>
      <Modal open={modal} onCancel={() => setModal(false)} title="Cancelar esta venda?" description="Os 3 itens da sacola serão removidos. Esta ação não pode ser desfeita.">
        <Button variant="destructive" fullWidth onClick={() => setModal(false)}>Cancelar venda</Button>
        <Button variant="secondary" fullWidth onClick={() => setModal(false)}>Continuar vendendo</Button>
      </Modal>
    </Section>
  )
}
