import fp from 'fastify-plugin'

/**
 * Root-level health/info routes. Kept outside the /api/v1 prefix so infra
 * liveness probes hit stable paths.
 */
export default fp(async (fastify) => {
  fastify.get(
    '/health',
    { schema: { tags: ['system'], summary: 'Liveness and DB connectivity check' } },
    async () => {
      await fastify.prisma.$queryRaw`SELECT 1`
      return { status: 'ok', service: 'lead-api' }
    }
  )

  fastify.get(
    '/',
    { schema: { tags: ['system'], summary: 'Service info' } },
    async () => {
      return { service: 'lead-api', status: 'ok', docs: '/docs', api: '/api/v1' }
    }
  )
})
