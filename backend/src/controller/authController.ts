import type { Context } from 'hono'
import { authService } from '../services/authService.js'
import { validateLogin, validateSignup } from '../validators/authValidator.js'

const readJsonBody = async (c: Context) => {
  try {
    return await c.req.json()
  } catch {
    return null
  }
}

const handleAuthError = (c: Context, error: unknown) => {
  if (error instanceof authService.AuthError) {
    return c.json({ error: error.message }, error.status)
  }

  console.error(error)
  return c.json({ error: 'Internal server error.' }, 500)
}

export const authController = {
  async signup(c: Context) {
    const validation = validateSignup(await readJsonBody(c))

    if (!validation.ok) {
      return c.json({ errors: validation.errors }, 400)
    }

    try {
      const result = await authService.signup(validation.data)
      return c.json(result, 201)
    } catch (error) {
      return handleAuthError(c, error)
    }
  },

  async login(c: Context) {
    const validation = validateLogin(await readJsonBody(c))

    if (!validation.ok) {
      return c.json({ errors: validation.errors }, 400)
    }

    try {
      const result = await authService.login(validation.data)
      return c.json(result)
    } catch (error) {
      return handleAuthError(c, error)
    }
  },

  async me(c: Context) {
    const authorization = c.req.header('Authorization') ?? ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : ''

    if (!token) {
      return c.json({ error: 'Bearer token is required.' }, 401)
    }

    try {
      const user = await authService.getUserFromToken(token)
      return c.json({ user })
    } catch (error) {
      return handleAuthError(c, error)
    }
  },

  async refresh(c: Context) {
    const body = await readJsonBody(c)
    const refreshToken = body && typeof body === 'object' && 'refreshToken' in body
      ? (body as { refreshToken?: unknown }).refreshToken
      : null

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      return c.json({ errors: ['Refresh token is required.'] }, 400)
    }

    try {
      const result = await authService.refresh(refreshToken)
      return c.json(result)
    } catch (error) {
      return handleAuthError(c, error)
    }
  },

  async logout(c: Context) {
    const authorization = c.req.header('Authorization') ?? ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : ''

    if (!token) {
      return c.json({ error: 'Bearer token is required.' }, 401)
    }

    try {
      await authService.logout(token)
      return c.json({ ok: true })
    } catch (error) {
      return handleAuthError(c, error)
    }
  },
}
