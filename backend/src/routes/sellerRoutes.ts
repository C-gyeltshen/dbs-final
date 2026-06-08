import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import type { AppVariables } from '../types/context.js'

export const sellerRoutes = new Hono<{ Variables: AppVariables }>()

sellerRoutes.use('*', authMiddleware)

sellerRoutes.use('*', async (c, next) => {
  if (c.get('user').role !== 'SELLER') {
    return c.json({ error: 'Forbidden.' }, 403)
  }
  await next()
})

const parsePagination = (pageStr: string | undefined, limitStr: string | undefined) => {
  const page = Math.max(Number(pageStr ?? 1) || 1, 1)
  const limit = Math.min(Math.max(Number(limitStr ?? 10) || 10, 1), 100)
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

sellerRoutes.get('/stats', async (c) => {
  const sellerId = c.get('user').id

  const sellerProducts = await prisma.product.findMany({
    where: { sellerId },
    select: { id: true, stock: true },
  })

  const sellerProductIds = sellerProducts.map((p) => p.id)
  const totalProducts = sellerProducts.length
  const totalStock = sellerProducts.reduce((sum, p) => sum + p.stock, 0)

  const [openOrders, revenueItems] = await Promise.all([
    prisma.order.count({
      where: {
        status: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED'] },
        items: { some: { productId: { in: sellerProductIds } } },
      },
    }),
    prisma.orderItem.findMany({
      where: {
        productId: { in: sellerProductIds },
        order: { status: 'DELIVERED' },
      },
      select: { price: true, quantity: true },
    }),
  ])

  const revenue = revenueItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return c.json({ totalProducts, totalStock, openOrders, revenue: Math.round(revenue * 100) / 100 })
})

sellerRoutes.get('/products', async (c) => {
  const sellerId = c.get('user').id
  const { page, limit, skip } = parsePagination(c.req.query('page'), c.req.query('limit'))

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { category: true },
    }),
    prisma.product.count({ where: { sellerId } }),
  ])

  return c.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + products.length < total,
    },
  })
})

sellerRoutes.get('/orders', async (c) => {
  const sellerId = c.get('user').id
  const { page, limit, skip } = parsePagination(c.req.query('page'), c.req.query('limit'))

  const sellerProductIds = (
    await prisma.product.findMany({
      where: { sellerId },
      select: { id: true },
    })
  ).map((p) => p.id)

  const orderWhere = {
    items: { some: { productId: { in: sellerProductIds } } },
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
        items: {
          where: { productId: { in: sellerProductIds } },
          include: { product: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.order.count({ where: orderWhere }),
  ])

  return c.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + orders.length < total,
    },
  })
})
