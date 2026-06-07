import type { Product } from './products'
import { API_BASE_URL } from './api'

export type CartItem = {
  productId: string
  quantity: number
  product: Product | null
}

export type CartResponse = {
  items: CartItem[]
}

const cartRequest = async <T>(path: string, accessToken: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : 'Cart request failed.'

    throw new Error(message)
  }

  return body as T
}

export const getCart = (accessToken: string) => {
  return cartRequest<CartResponse>('/cart', accessToken)
}

export const addCartItem = (accessToken: string, productId: string, quantity = 1) => {
  return cartRequest<CartResponse>('/cart/add', accessToken, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  })
}

export const updateCartItem = (accessToken: string, productId: string, newQuantity: number) => {
  return cartRequest<CartResponse>('/cart/update', accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ productId, newQuantity }),
  })
}

export const removeCartItem = (accessToken: string, productId: string) => {
  return cartRequest<CartResponse>('/cart/remove', accessToken, {
    method: 'DELETE',
    body: JSON.stringify({ productId }),
  })
}
