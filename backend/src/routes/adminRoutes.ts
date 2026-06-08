import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import type { AppVariables } from '../types/context.js'

export const adminRoutes = new Hono<{ Variables: AppVariables }>()

adminRoutes.use('*', authMiddleware)

adminRoutes.use('*', async (c, next) => {
  if (c.get('user').role !== 'ADMIN') {
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

adminRoutes.get('/customers', async (c) => {
  const { page, limit, skip } = parsePagination(c.req.query('page'), c.req.query('limit'))

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ])

  return c.json({
    customers: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + users.length < total,
    },
  })
})

adminRoutes.get('/sellers', async (c) => {
  const { page, limit, skip } = parsePagination(c.req.query('page'), c.req.query('limit'))

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'SELLER' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: { role: 'SELLER' } }),
  ])

  return c.json({
    sellers: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + users.length < total,
    },
  })
})

adminRoutes.get('/products', async (c) => {
  const { page, limit, skip } = parsePagination(c.req.query('page'), c.req.query('limit'))

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { category: true },
    }),
    prisma.product.count(),
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
