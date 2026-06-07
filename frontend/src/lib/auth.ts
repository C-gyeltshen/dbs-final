export type PublicUser = {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN'
  createdAt: string
}

export type AuthResult = {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

export type LoginInput = {
  email: string
  password: string
}

export type SignupInput = LoginInput & {
  name: string
}

const AUTH_STORAGE_KEY = 'one-minute-shop-auth'

type ApiErrorResponse = {
  error?: string
  errors?: string[]
}

const parseErrorMessage = (body: unknown, fallback: string) => {
  if (!body || typeof body !== 'object') {
    return fallback
  }

  const response = body as ApiErrorResponse

  if (Array.isArray(response.errors) && response.errors.length > 0) {
    return response.errors.join(' ')
  }

  return response.error ?? fallback
}

const requestJson = async <T>(path: string, input?: unknown, accessToken?: string) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: input ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: input ? JSON.stringify(input) : undefined,
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(parseErrorMessage(body, 'Authentication failed. Please try again.'))
  }

  return body as T
}

const requestAuth = (path: '/auth/login' | '/auth/signup', input: LoginInput | SignupInput) => {
  return requestJson<AuthResult>(path, input)
}

export const login = (input: LoginInput) => requestAuth('/auth/login', input)

export const signup = (input: SignupInput) => requestAuth('/auth/signup', input)

export const refreshAuth = (refreshToken: string) => {
  return requestJson<AuthResult>('/auth/refresh', { refreshToken })
}

export const getCurrentUser = (accessToken: string) => {
  return requestJson<{ user: PublicUser }>('/auth/me', undefined, accessToken)
}

export const saveAuthSession = (session: AuthResult) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

const isAuthResult = (value: unknown): value is AuthResult => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const session = value as Partial<AuthResult>

  return (
    typeof session.accessToken === 'string' &&
    typeof session.refreshToken === 'string' &&
    !!session.user &&
    typeof session.user === 'object' &&
    typeof session.user.id === 'string' &&
    typeof session.user.name === 'string' &&
    typeof session.user.email === 'string' &&
    ['CUSTOMER', 'SELLER', 'ADMIN'].includes(session.user.role ?? '') &&
    typeof session.user.createdAt === 'string'
  )
}

export const getStoredAuthSession = () => {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedSession) {
    return null
  }

  try {
    const parsedSession = JSON.parse(storedSession) as unknown
    return isAuthResult(parsedSession) ? parsedSession : null
  } catch {
    return null
  }
}

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
import { API_BASE_URL } from './api'
