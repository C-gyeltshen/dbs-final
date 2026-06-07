import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import type { AppVariables } from '../types/context.js'

export const userRoutes = new Hono<{ Variables: AppVariables }>()

userRoutes.use('*', authMiddleware)

userRoutes.get('/me/recently-viewed', async (c) => {
  const user = c.get('user')
  const productIds = await redis.lrange<string>(`recentlyViewed:${user.id}`, 0, 9)
  const uniqueProductIds = Array.from(new Set(productIds))
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: uniqueProductIds,
      },
    },
  })
  const productsById = new Map(products.map((product) => [product.id, product]))

  return c.json({
    products: productIds
      .map((productId) => productsById.get(productId))
      .filter((product) => !!product),
  })
})
