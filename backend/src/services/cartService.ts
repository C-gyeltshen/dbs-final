import { redis } from '../lib/redis.js'
import { prisma } from '../lib/prisma.js'

const CART_TTL_SECONDS = 60 * 60 * 24 * 7

const cartKey = (userId: string) => `cart:${userId}`

const assertQuantity = (quantity: unknown, fieldName = 'quantity') => {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`)
  }

  return quantity
}

export const cartService = {
  async addItem(userId: string, productId: string, quantity: unknown) {
    const key = cartKey(userId)
    await redis.hset(key, { [productId]: String(assertQuantity(quantity)) })
    await redis.expire(key, CART_TTL_SECONDS)
    return this.getCart(userId)
  },

  async updateItem(userId: string, productId: string, quantity: unknown) {
    const key = cartKey(userId)
    await redis.hset(key, { [productId]: String(assertQuantity(quantity, 'newQuantity')) })
    await redis.expire(key, CART_TTL_SECONDS)
    return this.getCart(userId)
  },

  async removeItem(userId: string, productId: string) {
    await redis.hdel(cartKey(userId), productId)
    return this.getCart(userId)
  },

  async getCart(userId: string) {
    const cart = await redis.hgetall<Record<string, string>>(cartKey(userId))
    const cartItems = Object.entries(cart ?? {}).map(([productId, quantity]) => ({
      productId,
      quantity: Number(quantity),
    }))
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: cartItems.map((item) => item.productId),
        },
      },
      include: {
        category: true,
      },
    })
    const productsById = new Map(products.map((product) => [product.id, product]))

    return {
      items: cartItems.map((item) => ({
        ...item,
        product: productsById.get(item.productId) ?? null,
      })),
    }
  },
}
