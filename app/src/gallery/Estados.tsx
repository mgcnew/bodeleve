import { useState } from 'react'
import { EmptyState, ErrorState, ListSkeleton, IndicatorSkeleton, Banner, Button, TextField } from '@/components'
import { Section, Panel, Legend } from './parts'
import s from './gallery.module.css'

export function Estados() {
  const [busy, setBusy] = useState(false)
  return (
    <Section id="estados" title="Estados" note="Toda lista e toda ação têm estado vazio, de carregamento e de erro definidos antes das telas. Tom de voz: frases curtas, sem culpa, sempre com o próximo passo.">
      <div className={s.grid}>
        <Panel title="Vazio" note="Diz o que vai aparecer ali e oferece o próximo passo.">
          <Legend>Loja</Legend>
          <EmptyState icon="sacola" title="Sua sacola está vazia" description="Os produtos que você adicionar aparecem aqui." action={<Button>Ver produtos</Button>} />
          <Legend>Gestão</Legend>
          <EmptyState icon="pedidos" title="Nenhum pedido pendente" description="Quando chegar um pedido novo, ele aparece aqui na hora." action={<Button variant="secondary">Ver pedidos concluídos</Button>} />
          <Legend>Busca sem resultado</Legend>
          <EmptyState icon="buscar" title="Nada encontrado para “cuscuz”" description="Confira a escrita ou procure por categoria." action={<Button variant="secondary">Ver categorias</Button>} />
        </Panel>

        <Panel title="Carregando" note="Mantém o lugar do conteúdo para a tela não pular.">
          <Legend>Lista · esqueleto no formato do conteúdo</Legend>
          <ListSkeleton rows={4} />
          <Legend>Indicadores</Legend>
          <div className={s.cols2}><IndicatorSkeleton /><IndicatorSkeleton /></div>
          <Legend>Ação em andamento</Legend>
          <Button size="lg" fullWidth loading={busy} onClick={() => { setBusy(true); setTimeout(() => setBusy(false), 2000) }}>
            {busy ? 'Confirmando recebimento…' : 'Confirmar recebimento'}
          </Button>
          <p style={{ font: 'var(--apoio)', color: 'var(--texto-secundario)' }}>Esqueleto para carregar telas; indicador no próprio botão para ações. Sem tela inteira bloqueada.</p>
        </Panel>

        <Panel title="Erro e avisos" note="Diz o que houve, o que não mudou e como seguir.">
          <Legend>Falha ao carregar</Legend>
          <ErrorState title="Não foi possível carregar o estoque" description="Verifique a conexão e tente de novo. Nada foi alterado." action={<Button>Tentar de novo</Button>} />
          <Legend>Faixas de aviso</Legend>
          <Banner tone="warning" icon="sem-conexao">Sem conexão. Tentando reconectar…</Banner>
          <Banner tone="error">Estoque insuficiente: há 3 un de Tapioca e a venda pede 5.</Banner>
          <Banner tone="success">Recebimento confirmado. Estoque atualizado.</Banner>
          <Legend>Erro no campo</Legend>
          <TextField label="Quantidade recebida" defaultValue="-2" error="Informe um número igual ou maior que zero." />
        </Panel>
      </div>
    </Section>
  )
}
