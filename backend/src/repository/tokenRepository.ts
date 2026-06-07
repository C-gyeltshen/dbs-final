import { prisma } from '../lib/prisma.js'

type CreateTokenData = {
  tokenHash: string
  userId: string
  expiresAt: Date
}

export const tokenRepository = {
  async createAccessToken(token: CreateTokenData) {
    return prisma.accessToken.create({
      data: {
        ...token,
        revokedAt: null,
      },
    })
  },

  async createRefreshToken(token: CreateTokenData) {
    return prisma.refreshToken.create({
      data: {
        ...token,
        revokedAt: null,
      },
    })
  },

  async findActiveAccessToken(tokenHash: string) {
    return prisma.accessToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    })
  },

  async findActiveRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    })
  },

  async revokeRefreshToken(tokenHash: string) {
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  },

  async revokeUserTokens(userId: string) {
    const revokedAt = new Date()

    await Promise.all([
      prisma.accessToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt,
        },
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt,
        },
      }),
    ])
  },
}
