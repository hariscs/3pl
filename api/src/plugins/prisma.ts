import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Instantiates a single PrismaClient (via the pg driver adapter, required in
 * Prisma 7) and exposes it as `fastify.prisma`. Disconnects on server close.
 */
export default fp(
  async (fastify) => {
    const adapter = new PrismaPg(fastify.config.DATABASE_URL)
    const prisma = new PrismaClient({ adapter })

    await prisma.$connect()

    fastify.decorate('prisma', prisma)

    fastify.addHook('onClose', async (instance) => {
      await instance.prisma.$disconnect()
    })
  },
  { name: 'prisma' }
)

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}
