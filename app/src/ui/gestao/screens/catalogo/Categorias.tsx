import { useState, type FormEvent } from 'react'
import { Tag } from '@/components/Badges'
import { Box } from '@/components/Card'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Field'
import { itemsStore } from '@/services/gestao/backoffice'
import { categoriesStore } from '@/services/gestao/people'
import o from '@/styles/ops.module.css'
import { Bar } from '../../../shared/OpsBits'

const slug = (name: string) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function Categorias() {
  const categories = categoriesStore.useStore()
  const items = itemsStore.useStore()
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()
  const baseIds = new Set(['queijos', 'carnes', 'farinhas', 'doces', 'temperos', 'bebidas'])

  const add = (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setError('Digite o nome da categoria.')
    if (categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) return setError('Já existe uma categoria com esse nome.')
    categoriesStore.set((all) => [...all, { id: slug(n) || `cat-${all.length + 1}`, name: n }])
    setName('')
    setError(undefined)
  }

  return (
    <div className={o.screen}>
      <Bar title="Categorias" back="/gestao/produtos" />
      <main className={`${o.main} ${o.mainTop} ${o.narrow}`}>
        <Box>
          {categories.map((c) => {
            const count = items.filter((i) => i.categoryId === c.id).length
            return (
              <div key={c.id} className={o.row} style={{ minHeight: 56 }}>
                <span className={o.rowText}>
                  <span className={o.rowTitle}>{c.name}</span>
                  <span className={`${o.small} ${o.num}`}>{count} {count === 1 ? 'produto' : 'produtos'}</span>
                </span>
                {baseIds.has(c.id) ? <Tag tone="success">Na loja</Tag> : <Tag tone="info">Nova</Tag>}
              </div>
            )
          })}
        </Box>
        <form onSubmit={add} noValidate style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <TextField label="Nova categoria" placeholder="Ex.: Castanhas" value={name} error={error} onChange={(e) => { setName(e.target.value); setError(undefined) }} />
          </div>
          <Button type="submit" style={{ marginTop: 26 }}>
            Adicionar
          </Button>
        </form>
        <p className={o.muted}>A ordem aqui é a ordem dos atalhos na loja online.</p>
      </main>
    </div>
  )
}
