import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Lê as cores direto de design/tokens.css: se o design mudar um token, estes testes dizem se o contraste ainda passa. */
const css = readFileSync(resolve(process.cwd(), '../design/tokens.css'), 'utf8')
const tok = (name: string): string => {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`))
  if (!m) throw new Error(`token ${name} não encontrado em tokens.css`)
  return m[1]
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Pares texto × fundo usados nos componentes (AUDIT.md §3). WCAG AA: 4,5 : 1 para texto.
const pairs: Array<[string, string, string]> = [
  ['--texto', '--fundo-loja', 'grafite sobre creme'],
  ['--texto-secundario', '--fundo-loja', 'secundário sobre creme'],
  ['--texto-secundario', '--superficie', 'secundário sobre branco'],
  ['--texto-secundario', '--fundo-operacao', 'secundário sobre fundo da operação'],
  ['--cor-terracota', '--fundo-loja', 'terracota sobre creme'],
  ['--cor-terracota', '--superficie', 'terracota sobre branco'],
  ['--superficie', '--cor-terracota', 'branco sobre terracota (botão principal)'],
  ['--superficie', '--cor-verde', 'branco sobre verde (selo Feito na casa)'],
  ['--cor-terracota-pressionado', '--cor-terracota-suave', 'terracota escuro sobre terracota suave (menu ativo)'],
  ['--sucesso', '--sucesso-fundo', 'sucesso'],
  ['--atencao', '--atencao-fundo', 'atenção'],
  ['--erro', '--erro-fundo', 'erro'],
  ['--info', '--info-fundo', 'informação'],
  ['--cor-grafite', '--atencao-fundo', 'grafite sobre faixa de aviso'],
  ['--cor-creme', '--cor-grafite', 'creme sobre grafite (aviso temporário)'],
  ['--cor-mostarda', '--cor-grafite', 'mostarda sobre grafite (ação do aviso)'],
  ['--superficie', '--texto-secundario', 'botão desligado: bolinha branca no trilho'],
]

describe('contraste dos tokens (WCAG AA)', () => {
  it.each(pairs)('%s sobre %s: %s', (fg, bg) => {
    expect(ratio(tok(fg), tok(bg))).toBeGreaterThanOrEqual(4.5)
  })
  it('mostarda NÃO pode ser texto sobre creme (regra do design system)', () => {
    expect(ratio(tok('--cor-mostarda'), tok('--fundo-loja'))).toBeLessThan(3)
  })
})
