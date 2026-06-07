export type PublicUser = {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN'
  createdAt: string
}

export type StoredUser = PublicUser & {
  passwordHash: string
  passwordSalt: string
}

export type SignupInput = {
  name: string
  email: string
  password: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RefreshTokenInput = {
  refreshToken: string
}

export type AuthResult = {
  user: PublicUser
  accessToken: string
  refreshToken: string
}
