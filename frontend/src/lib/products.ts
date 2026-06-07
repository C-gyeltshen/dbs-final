import { API_BASE_URL } from './api'

export type ProductCategory = {
  id: string
  name: string
  parentId?: string | null
}

export type Product = {
  id: string
  name: string
  description: string
  price: number
  tags: string[]
  stock: number
  categoryId: string
  category?: ProductCategory | null
}

type ProductsResponse = {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
}

type GetProductsInput = {
  category?: string
  limit?: number
  page?: number
}

export const getProducts = async ({ category, limit = 8, page = 1 }: GetProductsInput = {}) => {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  })

  if (category) {
    params.set('category', category)
  }

  const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`)
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : 'Products could not be loaded.'

    throw new Error(message)
  }

  return body as ProductsResponse
}
