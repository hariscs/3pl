import type { FastifyInstance } from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'

/**
 * Registers OpenAPI generation + Swagger UI. Called from app.ts before any
 * routes are loaded so the onRoute hook captures every route (including the
 * root-level health checks).
 */
export async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Lead API',
        description:
          'Location check-in and shift bootstrap API for the Lead mobile app.',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${fastify.config.PORT}` }],
      tags: [
        { name: 'auth', description: 'Login and session' },
        { name: 'locations', description: 'Assigned locations and bootstrap data' },
        { name: 'check-ins', description: 'Location check-in / check-out' },
        { name: 'system', description: 'Health' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  })
}
