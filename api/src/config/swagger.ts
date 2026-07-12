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
        { name: 'customers', description: 'Customer records' },
        { name: 'employees', description: 'Employee records' },
        { name: 'product-types', description: 'Product types and rate cards' },
        { name: 'loads', description: 'Loads (billing computed server-side)' },
        { name: 'users', description: 'System users' },
        { name: 'locations', description: 'Locations and lead bootstrap data' },
        { name: 'auth', description: 'Lead login and session' },
        { name: 'check-ins', description: 'Lead location check-in / check-out' },
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
