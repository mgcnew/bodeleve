// Tema claro, escuro ou automático (segue o aparelho). A escolha fica neste aparelho.
export type ThemeChoice = 'light' | 'dark' | 'auto'

const KEY = 'bodeleve.tema'
const dark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function getThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'auto' ? v : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(choice: ThemeChoice = getThemeChoice()) {
  const isDark = choice === 'dark' || (choice === 'auto' && dark())
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    /* sem armazenamento: vale só até recarregar */
  }
  applyTheme(choice)
}

/** No modo automático, acompanha a troca do aparelho sem recarregar */
export function watchSystemTheme() {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getThemeChoice() === 'auto') applyTheme()
  })
}
