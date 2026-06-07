import { Hono } from 'hono'
import type { Context } from 'hono'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import { authService } from '../services/authService.js'

const TRENDING_TTL_SECONDS = 60 * 60 * 24
const PRODUCT_CACHE_BASE_TTL_SECONDS = 60 * 60
const PRODUCT_CACHE_JITTER_SECONDS = 300

const todayKey = () => new Date().toISOString().slice(0, 10)
const trendingKey = () => `trending:products:${todayKey()}`
const productCacheKey = (productId: string) => `product:${productId}`
const productCacheTtl = () => PRODUCT_CACHE_BASE_TTL_SECONDS + Math.floor(Math.random() * PRODUCT_CACHE_JITTER_SECONDS)

const getClientIp = (c: Context) => {
  const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()

  return (
    forwardedFor
    || c.req.header('cf-connecting-ip')
    || c.req.header('x-real-ip')
    || 'unknown'
  )
}

const getOptionalVisitorId = async (c: Context) => {
  const authorization = c.req.header('Authorization') ?? ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : ''

  if (!token) {
    return getClientIp(c)
  }

  try {
    const user = await authService.getUserFromToken(token)
    return user.id
  } catch {
    return getClientIp(c)
  }
}

const orderedProducts = async (ids: string[]) => {
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  })
  const productsById = new Map(products.map((product) => [product.id, product]))

  return ids.map((id) => productsById.get(id)).filter((product) => !!product)
}

export const productRoutes = new Hono()

productRoutes.get('/', async (c) => {
  const category = c.req.query('category')?.trim()
  const page = Math.max(Number(c.req.query('page') ?? 1) || 1, 1)
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 12) || 12, 1), 50)
  const skip = (page - 1) * limit
  let categoryIds: string[] | undefined

  if (category) {
    const parentCategories = await prisma.category.findMany({
      where: {
        name: {
          equals: category,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    })

    const matchingCategories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { equals: category, mode: 'insensitive' } },
          {
            parentId: {
              in: parentCategories.map((parent) => parent.id),
            },
          },
        ],
      },
      select: {
        id: true,
      },
    })

    categoryIds = matchingCategories.map((item) => item.id)
  }

  const where = categoryIds
    ? {
        categoryId: {
          in: categoryIds,
        },
      }
    : undefined

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        category: true,
      },
    }),
    prisma.product.count({
      where,
    }),
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

productRoutes.get('/trending', async (c) => {
  const entries = await redis.zrange<string[]>(trendingKey(), 0, 9, {
    rev: true,
    withScores: true,
  })
  const pairs: Array<{ productId: string; score: number }> = []

  for (let index = 0; index < entries.length; index += 2) {
    pairs.push({
      productId: entries[index],
      score: Number(entries[index + 1]),
    })
  }

  const products = await orderedProducts(pairs.map((pair) => pair.productId))
  const scoresByProductId = new Map(pairs.map((pair) => [pair.productId, pair.score]))

  return c.json({
    products: products.map((product) => ({
      ...product,
      trendingScore: scoresByProductId.get(product.id) ?? 0,
    })),
  })
})

productRoutes.get('/:id/stats', async (c) => {
  const productId = c.req.param('id')
  const uniqueVisitors = await redis.pfcount(`visits:${productId}`)

  return c.json({ uniqueVisitors })
})

productRoutes.get('/:id', async (c) => {
  const productId = c.req.param('id')
  const cachedProduct = await redis.get(productCacheKey(productId))
  let product: Awaited<ReturnType<typeof prisma.product.findUnique>>
  let cacheStatus: 'HIT' | 'MISS' = 'HIT'

  if (cachedProduct) {
    product = typeof cachedProduct === 'string' ? JSON.parse(cachedProduct) : cachedProduct
  } else {
    cacheStatus = 'MISS'
    product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    })

    if (product) {
      await redis.set(productCacheKey(productId), JSON.stringify(product), {
        ex: productCacheTtl(),
      })
    }
  }

  if (!product) {
    return c.json({ error: 'Product was not found.' }, 404)
  }

  const key = trendingKey()
  const visitorId = await getOptionalVisitorId(c)

  await Promise.all([
    redis.zincrby(key, 1, productId),
    redis.expire(key, TRENDING_TTL_SECONDS),
    redis.pfadd(`visits:${productId}`, visitorId),
  ])

  c.header('X-Cache', cacheStatus)
  return c.json({ product })
})

productRoutes.patch('/:id', async (c) => {
  const productId = c.req.param('id')
  const body = await c.req.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return c.json({ errors: ['Request body must be a JSON object.'] }, 400)
  }

  try {
    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: body,
    })

    await redis.del(productCacheKey(productId))

    return c.json({ product })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Product could not be updated.' }, 400)
  }
})

productRoutes.post('/:id/view', async (c) => {
  const authorization = c.req.header('Authorization') ?? ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : ''

  if (!token) {
    return c.json({ error: 'Bearer token is required.' }, 401)
  }

  try {
    const user = await authService.getUserFromToken(token)
    const key = `recentlyViewed:${user.id}`
    const productId = c.req.param('id')

    await redis.lpush(key, productId)
    await redis.ltrim(key, 0, 9)

    return c.json({ ok: true })
  } catch (error) {
    if (error instanceof authService.AuthError) {
      return c.json({ error: error.message }, error.status)
    }

    console.error(error)
    return c.json({ error: 'Internal server error.' }, 500)
  }
})
