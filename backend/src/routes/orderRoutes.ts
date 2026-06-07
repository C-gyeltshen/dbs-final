import { Hono } from 'hono'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'
import { OrderError, orderService } from '../services/orderService.js'
import type { AppVariables } from '../types/context.js'

export const orderRoutes = new Hono<{ Variables: AppVariables }>()

const checkoutRateLimiter = createRateLimiter({
  key: (c) => `ratelimit:checkout:${c.get('user').id}`,
  max: 3,
  windowSeconds: 60,
  message: 'Too many checkout attempts. Try again in 60 seconds.',
})

orderRoutes.post('/', authMiddleware, checkoutRateLimiter, async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return c.json({ errors: ['Request body must be a JSON object.'] }, 400)
  }

  try {
    const result = await orderService.placeOrder({
      userId: c.get('user').id,
      items: (body as { items?: Array<{ productId: string; quantity: number }> }).items ?? [],
      deliveryAddress: (body as {
        deliveryAddress?: {
          street: string
          city: string
          country: string
          zip: string
        }
      }).deliveryAddress ?? {
        street: '',
        city: '',
        country: '',
        zip: '',
      },
    })

    return c.json(result, 201)
  } catch (error) {
    if (error instanceof OrderError) {
      const status = error.status === 409 ? 409 : error.status === 500 ? 500 : 400
      return c.json({ error: error.message }, status)
    }

    console.error(error)
    return c.json({ error: 'Internal server error.' }, 500)
  }
})
