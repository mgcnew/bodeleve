/**
 * Preenche os campos de código de um dígito. Digitar troca o dígito do campo;
 * colar ou preencher automático (várias letras) distribui pelos campos seguintes.
 * Devolve os novos dígitos e o índice do campo que deve receber o foco.
 */
export function applyCodeInput(current: string[], index: number, raw: string): { digits: string[]; focus: number } {
  const typed = raw.replace(/\D/g, '')
  const next = [...current]
  if (typed.length > 2) {
    typed
      .slice(0, next.length - index)
      .split('')
      .forEach((d, k) => {
        next[index + k] = d
      })
    return { digits: next, focus: Math.min(next.length - 1, index + typed.length) }
  }
  next[index] = typed.slice(-1)
  return { digits: next, focus: next[index] ? Math.min(next.length - 1, index + 1) : index }
}
