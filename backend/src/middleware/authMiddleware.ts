import type { MiddlewareHandler } from 'hono'
import { authService } from '../services/authService.js'
import type { AppVariables } from '../types/context.js'

export const authMiddleware: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  const authorization = c.req.header('Authorization') ?? ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : ''

  if (!token) {
    return c.json({ error: 'Bearer token is required.' }, 401)
  }

  try {
    const user = await authService.getUserFromToken(token)
    c.set('user', user)
    await next()
  } catch (error) {
    if (error instanceof authService.AuthError) {
      return c.json({ error: error.message }, error.status)
    }

    console.error(error)
    return c.json({ error: 'Internal server error.' }, 500)
  }
}
