import { createHash, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import type { AuthResult, LoginInput, PublicUser, SignupInput } from '../types/auth.js'
import { redis } from '../lib/redis.js'
import { tokenRepository } from '../repository/tokenRepository.js'
import { userRepository } from '../repository/userRepository.js'

const tokenSecret = process.env.AUTH_TOKEN_SECRET ?? 'development-auth-secret-change-me'
const accessTokenTtlSeconds = 60 * 15
const refreshTokenTtlSeconds = 60 * 60 * 24 * 7
const sessionTtlSeconds = 60 * 60 * 24
type AuthErrorStatus = 401 | 409
type TokenType = 'access' | 'refresh'
type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN'

class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: AuthErrorStatus,
  ) {
    super(message)
  }
}

const toPublicUser = (user: {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
})

const sessionKey = (userId: string) => `session:${userId}`

const saveSession = async (user: PublicUser) => {
  const key = sessionKey(user.id)
  await redis.hset(key, {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    createdAt: user.createdAt,
  })
  await redis.expire(key, sessionTtlSeconds)
}

const getCachedSession = async (userId: string): Promise<PublicUser | null> => {
  const session = await redis.hgetall<Record<string, string>>(sessionKey(userId))

  if (!session?.userId || !session.email || !session.role || !session.name || !session.createdAt) {
    return null
  }

  if (!['CUSTOMER', 'SELLER', 'ADMIN'].includes(session.role)) {
    return null
  }

  return {
    id: session.userId,
    email: session.email,
    role: session.role as UserRole,
    name: session.name,
    createdAt: session.createdAt,
  }
}

const hashPassword = (password: string, salt = randomBytes(16).toString('hex')) => {
  const passwordHash = pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex')
  return { passwordHash, passwordSalt: salt }
}

const verifyPassword = (password: string, salt: string, expectedHash: string) => {
  const { passwordHash } = hashPassword(password, salt)
  const actual = Buffer.from(passwordHash, 'hex')
  const expected = Buffer.from(expectedHash, 'hex')

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

const base64UrlEncode = (value: string) => Buffer.from(value).toString('base64url')
const base64UrlDecode = (value: string) => Buffer.from(value, 'base64url').toString('utf8')

const sign = (value: string) => {
  return createHmac('sha256', tokenSecret).update(value).digest('base64url')
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

const secondsFromNow = (seconds: number) => {
  return new Date(Date.now() + seconds * 1000)
}

const createJwt = (userId: string, role: UserRole, type: TokenType, ttlSeconds: number) => {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }
  const payload = {
    sub: userId,
    role,
    type,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signedValue = `${encodedHeader}.${encodedPayload}`

  return `${signedValue}.${sign(signedValue)}`
}

const createTokenPair = (userId: string, role: UserRole) => {
  return {
    accessToken: createJwt(userId, role, 'access', accessTokenTtlSeconds),
    refreshToken: createJwt(userId, role, 'refresh', refreshTokenTtlSeconds),
  }
}

const issueTokenPair = async (user: { id: string; role: UserRole }) => {
  const tokens = createTokenPair(user.id, user.role)

  await Promise.all([
    tokenRepository.createAccessToken({
      tokenHash: hashToken(tokens.accessToken),
      userId: user.id,
      expiresAt: secondsFromNow(accessTokenTtlSeconds),
    }),
    tokenRepository.createRefreshToken({
      tokenHash: hashToken(tokens.refreshToken),
      userId: user.id,
      expiresAt: secondsFromNow(refreshTokenTtlSeconds),
    }),
  ])

  return tokens
}

const parseJwt = (token: string, expectedType: TokenType) => {
  const [encodedHeader, encodedPayload, signature] = token.split('.')
  const signedValue = `${encodedHeader}.${encodedPayload}`

  if (!encodedHeader || !encodedPayload || !signature || sign(signedValue) !== signature) {
    throw new AuthError('Invalid auth token.', 401)
  }

  let payload: { sub?: unknown; exp?: unknown; type?: unknown; role?: unknown }

  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as {
      sub?: unknown
      exp?: unknown
      type?: unknown
      role?: unknown
    }
  } catch {
    throw new AuthError('Invalid auth token.', 401)
  }

  if (
    typeof payload.sub !== 'string'
    || typeof payload.exp !== 'number'
    || payload.type !== expectedType
    || !['CUSTOMER', 'SELLER', 'ADMIN'].includes(String(payload.role))
  ) {
    throw new AuthError('Invalid auth token.', 401)
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AuthError('Auth token has expired.', 401)
  }

  return payload.sub
}

export const authService = {
  AuthError,

  async signup(input: SignupInput): Promise<AuthResult> {
    const existingUser = await userRepository.findByEmail(input.email)

    if (existingUser) {
      throw new AuthError('Email is already registered.', 409)
    }

    const password = hashPassword(input.password)
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      ...password,
    })

    const publicUser = toPublicUser(user)
    await saveSession(publicUser)

    return {
      user: publicUser,
      ...await issueTokenPair(user),
    }
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email)

    if (!user || !verifyPassword(input.password, user.passwordSalt, user.passwordHash)) {
      throw new AuthError('Invalid email or password.', 401)
    }

    const publicUser = toPublicUser(user)
    await saveSession(publicUser)

    return {
      user: publicUser,
      ...await issueTokenPair(user),
    }
  },

  async getUserFromToken(token: string): Promise<PublicUser> {
    const userId = parseJwt(token, 'access')
    const activeToken = await tokenRepository.findActiveAccessToken(hashToken(token))

    if (!activeToken || activeToken.userId !== userId) {
      throw new AuthError('Invalid auth token.', 401)
    }

    const cachedUser = await getCachedSession(userId)

    if (cachedUser) {
      return cachedUser
    }

    const user = await userRepository.findById(userId)

    if (!user) {
      throw new AuthError('User was not found.', 401)
    }

    const publicUser = toPublicUser(user)
    await saveSession(publicUser)

    return publicUser
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    const userId = parseJwt(refreshToken, 'refresh')
    const refreshTokenHash = hashToken(refreshToken)
    const activeToken = await tokenRepository.findActiveRefreshToken(refreshTokenHash)

    if (!activeToken || activeToken.userId !== userId) {
      throw new AuthError('Invalid auth token.', 401)
    }

    const user = await userRepository.findById(userId)

    if (!user) {
      throw new AuthError('User was not found.', 401)
    }

    await tokenRepository.revokeRefreshToken(refreshTokenHash)

    const publicUser = toPublicUser(user)
    await saveSession(publicUser)

    return {
      user: publicUser,
      ...await issueTokenPair(user),
    }
  },

  async logout(token: string): Promise<void> {
    const userId = parseJwt(token, 'access')
    await Promise.all([
      redis.del(sessionKey(userId)),
      tokenRepository.revokeUserTokens(userId),
    ])
  },
}
