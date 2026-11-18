import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '@/components/Icon'
import { normalize } from '@/domain/catalog'
import { canAccess, type Module } from '@/permissions/modules'
import type { Role } from '@/permissions/roles'
import s from './CommandPalette.module.css'

export type Command = { id: string; label: string; hint: string; to: string; icon: IconName; module?: Module; keys?: string; words?: string }

/** Atalho "g" + letra para ir a um módulo (como no Linear e no GitHub) */
export const goKeys: Record<string, string> = {
  i: '/gestao',
  p: '/gestao/pedidos',
  e: '/gestao/estoque',
  f: '/gestao/financeiro',
  c: '/gestao/compras',
  o: '/gestao/producao',
  u: '/gestao/produtos',
  l: '/gestao/clientes',
  d: '/gestao/entregas',
  r: '/gestao/relatorios',
}

const commands: Command[] = [
  { id: 'inicio', label: 'Início', hint: 'Ir para', to: '/gestao', icon: 'inicio', module: 'inicio', keys: 'gi' },
  { id: 'pedidos', label: 'Pedidos', hint: 'Ir para', to: '/gestao/pedidos', icon: 'pedidos', module: 'pedidos', keys: 'gp' },
  { id: 'estoque', label: 'Estoque', hint: 'Ir para', to: '/gestao/estoque', icon: 'estoque', module: 'estoque', keys: 'ge' },
  { id: 'financeiro', label: 'Financeiro', hint: 'Ir para', to: '/gestao/financeiro', icon: 'financeiro', module: 'financeiro', keys: 'gf' },
  { id: 'compras', label: 'Compras', hint: 'Ir para', to: '/gestao/compras', icon: 'compras', module: 'compras', keys: 'gc' },
  { id: 'fornecedores', label: 'Fornecedores', hint: 'Ir para', to: '/gestao/fornecedores', icon: 'entregas', module: 'fornecedores' },
  { id: 'producao', label: 'Produção', hint: 'Ir para', to: '/gestao/producao', icon: 'producao', module: 'producao', keys: 'go' },
  { id: 'produtos', label: 'Produtos', hint: 'Ir para', to: '/gestao/produtos', icon: 'vender', module: 'produtos', keys: 'gu' },
  { id: 'clientes', label: 'Clientes', hint: 'Ir para', to: '/gestao/clientes', icon: 'perfil', module: 'clientes', keys: 'gl' },
  { id: 'entregas', label: 'Entregas', hint: 'Ir para', to: '/gestao/entregas', icon: 'local', module: 'entregas', keys: 'gd' },
  { id: 'relatorios', label: 'Relatórios', hint: 'Ir para', to: '/gestao/relatorios', icon: 'historico', module: 'relatorios', keys: 'gr' },
  { id: 'configuracoes', label: 'Configurações', hint: 'Ir para', to: '/gestao/configuracoes', icon: 'mais', module: 'configuracoes' },
  { id: 'novo-produto', label: 'Novo produto', hint: 'Criar', to: '/gestao/produtos/novo', icon: 'adicionar', module: 'produtos', words: 'cadastrar item' },
  { id: 'novo-fornecedor', label: 'Novo fornecedor', hint: 'Criar', to: '/gestao/fornecedores/novo', icon: 'adicionar', module: 'fornecedores', words: 'cadastrar' },
  { id: 'nova-compra', label: 'Nova compra', hint: 'Criar', to: '/gestao/compras/nova', icon: 'adicionar', module: 'compras', words: 'pedido de compra' },
  { id: 'entregadores', label: 'Cadastro de entregadores', hint: 'Ir para', to: '/gestao/entregas/entregadores', icon: 'local', module: 'entregas', words: 'motoboy' },
  { id: 'perfil', label: 'Meu perfil', hint: 'Conta', to: '/gestao/perfil', icon: 'perfil', words: 'senha nome pin' },
  { id: 'pdv', label: 'Abrir o PDV', hint: 'Outro ambiente', to: '/pdv', icon: 'caixa', words: 'balcão caixa vender' },
  { id: 'loja', label: 'Ver a loja online', hint: 'Outro ambiente', to: '/', icon: 'sacola', words: 'vitrine' },
]

/** Ctrl/⌘ + K abre a busca de comandos; "/" também; "g" e uma letra vão direto ao módulo */
export function useGestaoShortcuts(role: Role | undefined, openPalette: () => void) {
  const navigate = useNavigate()
  useEffect(() => {
    let armed = 0
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openPalette()
        return
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return
      if (e.key === '/') {
        e.preventDefault()
        openPalette()
        return
      }
      if (armed && Date.now() - armed < 1200) {
        armed = 0
        const to = goKeys[e.key.toLowerCase()]
        const cmd = commands.find((c) => c.to === to)
        if (to && cmd?.module && role && canAccess(role, cmd.module)) {
          e.preventDefault()
          navigate(to)
        }
        return
      }
      if (e.key.toLowerCase() === 'g') armed = Date.now()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, openPalette, role])
}

export function CommandPalette({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) {
  const ref = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  const list = useMemo(() => {
    const allowed = commands.filter((c) => !c.module || canAccess(role, c.module))
    const term = normalize(q.trim())
    if (!term) return allowed
    return allowed.filter((c) => normalize(`${c.label} ${c.hint} ${c.words ?? ''}`).includes(term))
  }, [q, role])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setQ('')
      setActive(0)
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open])

  const go = (c: Command) => {
    onClose()
    navigate(c.to)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, list.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && list[active]) {
      e.preventDefault()
      go(list[active])
    }
  }

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-label="Buscar ou ir para"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className={s.box} onKeyDown={onKeyDown}>
          <div className={s.field}>
            <Icon name="buscar" size={20} />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="comandos"
              aria-activedescendant={list[active] ? `cmd-${list[active].id}` : undefined}
              aria-label="Buscar ou ir para"
              placeholder="Buscar ou ir para…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setActive(0)
              }}
            />
            <kbd>Esc</kbd>
          </div>
          <ul id="comandos" role="listbox" className={s.list}>
            {list.map((c, i) => (
              <li
                key={c.id}
                id={`cmd-${c.id}`}
                role="option"
                aria-selected={i === active}
                className={s.item}
                onMouseMove={() => setActive(i)}
                onClick={() => go(c)}
              >
                <Icon name={c.icon} size={18} />
                <span className={s.label}>{c.label}</span>
                <span className={s.hint}>{c.hint}</span>
                {c.keys && (
                  <span className={s.keys} aria-hidden="true">
                    {[...c.keys].map((k) => (
                      <kbd key={k}>{k.toUpperCase()}</kbd>
                    ))}
                  </span>
                )}
              </li>
            ))}
            {list.length === 0 && <li className={s.empty}>Nada encontrado para “{q}”.</li>}
          </ul>
          <div className={s.foot} aria-hidden="true">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> navegar
            </span>
            <span>
              <kbd>Enter</kbd> abrir
            </span>
            <span>
              <kbd>G</kbd> + letra vai direto
            </span>
          </div>
        </div>
      )}
    </dialog>
  )
}
