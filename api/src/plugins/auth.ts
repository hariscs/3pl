import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Registers JWT support and an `authenticate` preHandler used to protect
 * Lead-only routes. Tokens are long-lived to support persistent login
 * (the Lead should not need to log in every day).
 */
export default fp(
  async (fastify) => {
    await fastify.register(jwt, {
      secret: fastify.config.JWT_SECRET,
      sign: { expiresIn: fastify.config.JWT_EXPIRES_IN },
    })

    fastify.decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
          await request.jwtVerify()
        } catch {
          reply.unauthorized('Authentication required.')
        }
      }
    )
  },
  { name: 'auth' }
)

/** Claims stored inside the Lead's JWT (mobile field app). */
export interface LeadTokenPayload {
  sub: string // leadId
  loginId: string
  name: string
  role: string
}

/** Claims stored inside a SystemUser's JWT (back-office dashboard). */
export interface SystemUserTokenPayload {
  sub: string // systemUserId
  email: string
  name: string
  role: string
  locationId: string
}

/**
 * Either identity may present a JWT to `authenticate`. Both payloads carry
 * `sub`/`name`/`role`; consumers that need identity-specific claims should
 * narrow before reading them.
 */
export type TokenPayload = LeadTokenPayload | SystemUserTokenPayload

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload
    user: TokenPayload
  }
}
