import type { MiddlewareHandler } from 'hono'

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = performance.now()

  await next()

  const durationMs = Math.round((performance.now() - start) * 100) / 100
  console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${durationMs}ms`)
}
