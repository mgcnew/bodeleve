import { useCallback, useEffect, useRef, useState } from 'react'

type State<T> = { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready'; data: T }

/**
 * Carrega dados de um serviço com estados de carregando e erro.
 * `retry` recarrega mostrando o esqueleto; `reload` atualiza em silêncio (sem piscar a tela).
 */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [tick, setTick] = useState(0)
  const lastKey = useRef('')
  const key = `${attempt}:${JSON.stringify(deps)}`

  useEffect(() => {
    let alive = true
    // só mostra o esqueleto na primeira carga e em "tentar de novo"; atualização em silêncio não
    if (lastKey.current !== key) setState({ status: 'loading' })
    lastKey.current = key
    load().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error: unknown) => alive && setState((s) => (s.status === 'ready' ? s : { status: 'error', error })),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt, tick])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { ...state, retry, reload }
}
