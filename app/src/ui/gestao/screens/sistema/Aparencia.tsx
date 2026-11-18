import { useState } from 'react'
import { Box } from '@/components/Card'
import { RadioGroup, Toggle } from '@/components/Field'
import { getThemeChoice, setThemeChoice, type ThemeChoice } from '@/lib/theme'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'
import { singleKeyShortcuts } from '../../components/CommandPalette'

// Preferências de cada pessoa neste aparelho (não mudam o que os outros veem)
export function Aparencia() {
  const [theme, setTheme] = useState<ThemeChoice>(getThemeChoice())
  const [keys, setKeys] = useState(singleKeyShortcuts.enabled())
  return (
    <div className={o.screen}>
      <Bar title="Aparência e teclado" back="/gestao/configuracoes" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <RadioGroup<ThemeChoice>
          legend="Tema"
          name="tema"
          value={theme}
          onChange={(v) => {
            setThemeChoice(v)
            setTheme(v)
          }}
          options={[
            { value: 'light', title: 'Claro', sub: 'Fundo claro, como a loja' },
            { value: 'dark', title: 'Escuro', sub: 'Descansa a vista à noite e em ambiente escuro' },
            { value: 'auto', title: 'Automático', sub: 'Acompanha o tema do celular ou do computador' },
          ]}
        />
        <p className={o.muted}>A escolha vale só neste aparelho e muda na hora.</p>
        <section className={o.section}>
          <h2 className={o.caps}>Teclado</h2>
          <Box>
            <Toggle
              label="Atalhos de uma tecla"
              sub="“/” abre a busca e “G” mais uma letra vai ao módulo. Ctrl+K (⌘ K no Mac) sempre funciona."
              checked={keys}
              onChange={(v) => {
                singleKeyShortcuts.set(v)
                setKeys(v)
              }}
            />
          </Box>
        </section>
      </main>
    </div>
  )
}
