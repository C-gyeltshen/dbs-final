import { Hono } from 'hono'
import type { Context } from 'hono'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { cartService } from '../services/cartService.js'
import type { AppVariables } from '../types/context.js'

export const cartRoutes = new Hono<{ Variables: AppVariables }>()

cartRoutes.use('*', authMiddleware)

const readBody = async (c: Context) => {
  return c.req.json().catch(() => null)
}

const productIdFromBody = (body: unknown) => {
  if (!body || typeof body !== 'object' || typeof (body as { productId?: unknown }).productId !== 'string') {
    throw new Error('productId is required.')
  }

  return (body as { productId: string }).productId
}

cartRoutes.get('/', async (c) => {
  return c.json(await cartService.getCart(c.get('user').id))
})

cartRoutes.post('/add', async (c) => {
  const body = await readBody(c)

  try {
    const result = await cartService.addItem(
      c.get('user').id,
      productIdFromBody(body),
      (body as { quantity?: number }).quantity,
    )
    return c.json(result)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Invalid cart request.' }, 400)
  }
})

cartRoutes.patch('/update', async (c) => {
  const body = await readBody(c)

  try {
    const result = await cartService.updateItem(
      c.get('user').id,
      productIdFromBody(body),
      (body as { newQuantity?: number }).newQuantity,
    )
    return c.json(result)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Invalid cart request.' }, 400)
  }
})

cartRoutes.delete('/remove', async (c) => {
  const body = await readBody(c)

  try {
    const result = await cartService.removeItem(c.get('user').id, productIdFromBody(body))
    return c.json(result)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Invalid cart request.' }, 400)
  }
})
