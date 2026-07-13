import fp from 'fastify-plugin'
import cors from '@fastify/cors'

/**
 * Enables CORS so the web/mobile clients can call this API during development.
 */
export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
})
