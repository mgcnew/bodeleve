import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useCart } from '../../state/cart'

/** Checkout sem itens volta para a sacola */
export function RequireCart({ children }: { children: ReactNode }) {
  const { count } = useCart()
  return count === 0 ? <Navigate to="/sacola" replace /> : children
}
