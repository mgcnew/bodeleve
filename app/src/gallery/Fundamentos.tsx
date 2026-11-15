import { useState } from 'react'
import { Icon } from '@/components'
import { iconPaths, type IconName } from '@/components/iconPaths'
import { Section, Panel } from './parts'
import s from './gallery.module.css'

const colors: Array<[string, string]> = [
  ['Terracota', '--cor-terracota'], ['Terracota pressionado', '--cor-terracota-pressionado'], ['Terracota suave', '--cor-terracota-suave'],
  ['Verde', '--cor-verde'], ['Mostarda (só preenchimento)', '--cor-mostarda'], ['Creme / fundo da loja', '--fundo-loja'],
  ['Grafite / texto', '--texto'], ['Texto secundário', '--texto-secundario'], ['Fundo da operação', '--fundo-operacao'],
  ['Superfície', '--superficie'], ['Linha', '--linha'],
  ['Sucesso', '--sucesso'], ['Sucesso (fundo)', '--sucesso-fundo'], ['Atenção', '--atencao'], ['Atenção (fundo)', '--atencao-fundo'],
  ['Erro', '--erro'], ['Erro (fundo)', '--erro-fundo'], ['Informação', '--info'], ['Informação (fundo)', '--info-fundo'],
]

const types: Array<[string, string, string]> = [
  ['titulo-xl', '--titulo-xl', 'Bricolage 34/40 · 700'], ['titulo-l', '--titulo-l', 'Bricolage 28/34 · 700'], ['titulo-m', '--titulo-m', 'Bricolage 22/28 · 700'],
  ['titulo-s', '--titulo-s', 'Inter 18/26 · 600'], ['corpo', '--corpo', 'Inter 16/24 · 400'], ['apoio', '--apoio', 'Inter 14/20 · 400'],
]

const spaces = ['--esp-1', '--esp-2', '--esp-3', '--esp-4', '--esp-6', '--esp-8', '--esp-12']
const radii: Array<[string, string]> = [['campo', '--raio-campo'], ['cartão', '--raio-cartao'], ['folha', '--raio-folha'], ['pílula', '--raio-pilula']]

const tokenNames = [...colors.map(([, n]) => n), ...spaces]

/** Lê o valor atual de cada token no CSS em execução (uma vez, ao montar; o CSS já foi carregado). */
function readTokens(names: string[]): Record<string, string> {
  const cs = getComputedStyle(document.documentElement)
  return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]))
}

export function Fundamentos() {
  const [v] = useState(() => readTokens(tokenNames))
  return (
    <Section id="fundamentos" title="Fundamentos" note="Tudo vem de design/tokens.css. Os valores abaixo são lidos do CSS em execução, não digitados aqui.">
      <div className={s.grid}>
        <Panel title="Cor">
          <div className={s.swatches}>
            {colors.map(([name, token]) => (
              <div key={token} className={s.swatch}>
                <div className={s.chipColor} style={{ background: `var(${token})` }} />
                <div className={s.swInfo}><div className={s.swName}>{name}</div>{v[token]} · {token}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Tipografia" note="Bricolage Grotesque nos títulos; Inter na interface. Valores com números tabulares.">
          <div>
            {types.map(([name, token, meta]) => (
              <div key={name} className={s.typeRow}>
                <span style={{ font: `var(${token})` }}>Queijo coalho artesanal</span>
                <span className={s.typeMeta}>{name} · {meta}</span>
              </div>
            ))}
            <div className={s.typeRow}>
              <span style={{ font: 'var(--valor)', fontVariantNumeric: 'tabular-nums' }}>R$ 1.284,50</span>
              <span className={s.typeMeta}>valor · Inter 22/28 · 600 tabular</span>
            </div>
            <div className={s.typeRow}>
              <span style={{ font: 'var(--legenda)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Legenda de seção</span>
              <span className={s.typeMeta}>legenda · Inter 12/16 · 600 caixa alta</span>
            </div>
          </div>
        </Panel>
        <Panel title="Espaço e forma">
          <div className={s.scale}>
            {spaces.map((t) => (
              <div key={t} className={s.scaleItem}>
                <div className={s.spaceBox} style={{ width: `var(${t})`, height: `var(${t})` }} />
                {t.replace('--esp-', '')} · {v[t]}
              </div>
            ))}
          </div>
          <div className={s.scale}>
            {radii.map(([name, t]) => (
              <div key={t} className={s.scaleItem}>
                <div className={s.radiusBox} style={{ borderRadius: `var(${t})` }} />
                {name}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Ícones" note="24 ícones de traço 1,75 px, grade de 24. Sem emoji.">
          <div className={s.icons}>
            {(Object.keys(iconPaths) as IconName[]).map((n) => (
              <div key={n} className={s.iconCell}><Icon name={n} />{n}</div>
            ))}
          </div>
        </Panel>
      </div>
    </Section>
  )
}
