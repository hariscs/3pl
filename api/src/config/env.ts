// Environment schema validated at boot by @fastify/env.

export const envSchema = {
  type: 'object',
  required: ['DATABASE_URL', 'JWT_SECRET'],
  properties: {
    DATABASE_URL: { type: 'string' },
    PORT: { type: 'number', default: 4000 },
    HOST: { type: 'string', default: '0.0.0.0' },
    JWT_SECRET: { type: 'string' },
    JWT_EXPIRES_IN: { type: 'string', default: '30d' },
    // Lead realm uses short access tokens refreshed via an opaque refresh token.
    JWT_ACCESS_EXPIRES_IN: { type: 'string', default: '1h' },
    JWT_REFRESH_EXPIRES_IN: { type: 'string', default: '30d' },
  },
} as const

export interface AppConfig {
  DATABASE_URL: string
  PORT: number
  HOST: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  JWT_ACCESS_EXPIRES_IN: string
  JWT_REFRESH_EXPIRES_IN: string
}

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig
  }
}
