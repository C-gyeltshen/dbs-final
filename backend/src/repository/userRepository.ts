import { prisma } from '../lib/prisma.js'
import type { StoredUser } from '../types/auth.js'

type CreateUserData = Pick<StoredUser, 'email' | 'name' | 'passwordHash' | 'passwordSalt'>

const toStoredUser = (user: {
  id: string
  email: string
  name: string
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN'
  createdAt: Date
  passwordHash: string
  passwordSalt: string
}): StoredUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
  passwordHash: user.passwordHash,
  passwordSalt: user.passwordSalt,
})

export const userRepository = {
  async create(user: CreateUserData) {
    const createdUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        role: 'CUSTOMER',
        addresses: [],
        wishlist: [],
      },
    })

    return toStoredUser(createdUser)
  },

  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    return user ? toStoredUser(user) : null
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    })

    return user ? toStoredUser(user) : null
  },
}
