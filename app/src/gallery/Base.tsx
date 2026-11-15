import { useState } from 'react'
import {
  Button, IconButton, TextField, SearchField, QuantityStepper, WeightField, Segmented, ChoiceOption, Switch, StatusTag, OriginBadge, Chip,
} from '@/components'
import { formatBRL, formatDecimal, parseDecimal } from '@/lib/format'
import { weightLineTotalCents } from '@/domain/money'
import { Section, Panel, Legend } from './parts'
import s from './gallery.module.css'

const PRICE_PER_KG = 5990

export function Base() {
  const [qty, setQty] = useState(2)
  const [weight, setWeight] = useState('0,500')
  const [mode, setMode] = useState<'entrega' | 'retirada'>('entrega')
  const [pay, setPay] = useState('pix')
  const [lot, setLot] = useState(true)
  const [published, setPublished] = useState(true)
  const [sending, setSending] = useState(false)
  const kg = parseDecimal(weight)

  return (
    <Section id="base" title="Componentes base" note="Botões, campos, seletores e etiquetas usados nos quatro ambientes. Estados: padrão, pressionado, foco, erro, desabilitado e carregando.">
      <div className={s.grid}>
        <Panel title="Botões" note="Uma ação principal por tela. Terracota é reservada a ela.">
          <Legend>Variantes · 48 px</Legend>
          <div className={s.row}>
            <Button>Adicionar à sacola</Button>
            <Button variant="secondary">Ver detalhes</Button>
            <Button variant="ghost">Agora não</Button>
            <Button variant="destructive">Cancelar venda</Button>
          </div>
          <Legend>Estados da ação principal</Legend>
          <div className={s.row}>
            <Button>Padrão</Button>
            <Button style={{ background: 'var(--cor-terracota-pressionado)' }}>Pressionado</Button>
            <Button disabled>Desabilitado</Button>
            <Button loading={sending} onClick={() => { setSending(true); setTimeout(() => setSending(false), 1800) }}>{sending ? 'Enviando…' : 'Tocar para enviar'}</Button>
          </div>
          <Legend>PDV · 56 px, largura total</Legend>
          <Button size="lg" fullWidth style={{ fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>Cobrar {formatBRL(8640)}</Button>
          <Legend>Só ícone · sempre com nome acessível</Legend>
          <div className={s.row}>
            <IconButton icon="adicionar" label="Adicionar" variant="primary" />
            <IconButton icon="fechar" label="Fechar" variant="outline" />
          </div>
        </Panel>

        <Panel title="Campos" note="Rótulo sempre visível acima do campo; mensagem de erro diz como corrigir.">
          <div className={s.cols2}>
            <TextField label="Nome do produto" defaultValue="Farinha de mandioca" hint="Padrão" />
            <TextField label="Preço de venda" defaultValue="R$ 12,90" hint="Em foco: borda grafite de 2 px (toque no campo)" />
            <TextField label="Validade do lote" defaultValue="31/02/2027" error="Data inválida. Use dia/mês/ano." />
            <TextField label="Código interno" defaultValue="Gerado ao salvar" disabled hint="Desabilitado" />
          </div>
          <SearchField label="Buscar produto" />
        </Panel>

        <Panel title="Quantidade e peso" note="Unidade entra direto; peso abre em folha com atalhos.">
          <Legend>Por unidade</Legend>
          <div className={s.row}>
            <QuantityStepper value={qty} onChange={setQty} label="Quantidade de Queijo coalho" />
            <QuantityStepper value={qty} onChange={setQty} label="Quantidade de Queijo coalho (compacto)" variant="compact" />
          </div>
          <Legend>Por peso</Legend>
          <WeightField
            value={weight}
            onChange={setWeight}
            currentKg={kg}
            onShortcut={(k) => setWeight(formatDecimal(k, 3))}
            shortcuts={[{ label: '250 g', kg: 0.25 }, { label: '500 g', kg: 0.5 }, { label: '1 kg', kg: 1 }]}
            summary={`${formatBRL(PRICE_PER_KG)} / kg · total ${kg == null ? '—' : formatBRL(weightLineTotalCents(PRICE_PER_KG, kg))}`}
          />
          <Legend>Atalho / filtro</Legend>
          <div className={s.row}><Chip>Padrão</Chip><Chip selected>Selecionado</Chip></div>
        </Panel>

        <Panel title="Seleção" note="Alvos de 44 a 48 px, com o rótulo inteiro clicável.">
          <Legend>Controle segmentado</Legend>
          <Segmented label="Tipo de entrega" value={mode} onChange={setMode} options={[{ value: 'entrega', label: 'Entrega' }, { value: 'retirada', label: 'Retirada' }]} />
          <Legend>Opção única</Legend>
          <div className={s.stack} style={{ gap: 0 }}>
            <ChoiceOption type="radio" name="pag" checked={pay === 'pix'} onChange={() => setPay('pix')}>Pix</ChoiceOption>
            <ChoiceOption type="radio" name="pag" checked={pay === 'cartao'} onChange={() => setPay('cartao')}>Cartão na entrega</ChoiceOption>
          </div>
          <Legend>Múltipla e liga/desliga</Legend>
          <div className={s.stack} style={{ gap: 0 }}>
            <ChoiceOption type="checkbox" checked={lot} onChange={(e) => setLot(e.target.checked)}>Controlar validade por lote</ChoiceOption>
            <Switch label="Publicar na loja" checked={published} onChange={setPublished} />
          </div>
        </Panel>

        <Panel title="Etiquetas e selos" note="Texto curto, cor de apoio, nunca só cor.">
          <Legend>Status de estoque</Legend>
          <div className={s.row}><StatusTag tone="success">Em estoque</StatusTag><StatusTag tone="warning">Estoque baixo</StatusTag><StatusTag tone="error">Sem estoque</StatusTag></div>
          <Legend>Validade</Legend>
          <div className={s.row}><StatusTag tone="warning">Vence em 5 dias</StatusTag><StatusTag tone="error">Vencido</StatusTag></div>
          <Legend>Pedido</Legend>
          <div className={s.row}>
            <StatusTag tone="info">Novo</StatusTag><StatusTag tone="warning">Em preparo</StatusTag><StatusTag tone="success">Pronto</StatusTag>
            <StatusTag tone="info">Em rota</StatusTag><StatusTag tone="success">Entregue</StatusTag><StatusTag tone="error">Cancelado</StatusTag>
          </div>
          <Legend>Financeiro</Legend>
          <div className={s.row}><StatusTag tone="success">Pago</StatusTag><StatusTag tone="warning">Vence hoje</StatusTag><StatusTag tone="error">Atrasado</StatusTag></div>
          <Legend>Selos de origem</Legend>
          <div className={s.row}><OriginBadge origin="brand" /><OriginBadge origin="house" /><OriginBadge origin="resale" /></div>
          <Legend>Entregador</Legend>
          <div className={s.row}><StatusTag>Próprio</StatusTag><StatusTag>Parceiro</StatusTag></div>
        </Panel>
      </div>
    </Section>
  )
}
