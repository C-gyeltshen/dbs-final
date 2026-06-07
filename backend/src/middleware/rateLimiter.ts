import type { MiddlewareHandler } from 'hono'
import { redis } from '../lib/redis.js'

const LOGIN_LIMIT = 5
const LOGIN_WINDOW_SECONDS = 60

export const getClientIp = (request: Parameters<MiddlewareHandler>[0]['req']) => {
  const forwardedFor = request.header('x-forwarded-for')?.split(',')[0]?.trim()

  return (
    forwardedFor
    || request.header('cf-connecting-ip')
    || request.header('x-real-ip')
    || 'unknown'
  )
}

type RateLimiterOptions = {
  key: (c: Parameters<MiddlewareHandler>[0]) => string
  max: number
  windowSeconds: number
  message?: string
}

export const createRateLimiter = ({
  key,
  max,
  windowSeconds,
  message,
}: RateLimiterOptions): MiddlewareHandler => async (c, next) => {
  const redisKey = key(c)
  const attempts = await redis.incr(redisKey)

  if (attempts === 1) {
    await redis.expire(redisKey, windowSeconds)
  }

  if (attempts > max) {
    return c.json({ error: message ?? `Too many attempts. Try again in ${windowSeconds} seconds.` }, 429)
  }

  await next()
}

export const loginRateLimiter = createRateLimiter({
  key: (c) => `ratelimit:login:${getClientIp(c.req)}`,
  max: LOGIN_LIMIT,
  windowSeconds: LOGIN_WINDOW_SECONDS,
  message: 'Too many login attempts. Try again in 60 seconds.',
})
