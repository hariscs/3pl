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

    const requireRealm = (realm: TokenRealm, message: string) =>
      async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
          await request.jwtVerify()
        } catch {
          return reply.unauthorized('Authentication required.')
        }
        if (request.user.realm !== realm) {
          reply.forbidden(message)
        }
      }

    fastify.decorate(
      'requireSystemUser',
      requireRealm('system', 'System user access required.')
    )
    fastify.decorate(
      'requireLead',
      requireRealm('lead', 'Lead access required.')
    )
  },
  { name: 'auth' }
)

/** Identity type carried in every JWT, used by the realm guards. */
export type TokenRealm = 'system' | 'lead'

/** Claims stored inside the Lead's JWT (mobile field app). */
export interface LeadTokenPayload {
  sub: string // leadId
  email: string
  name: string
  role: string
  realm: 'lead'
}

/** Claims stored inside a SystemUser's JWT (back-office dashboard). */
export interface SystemUserTokenPayload {
  sub: string // systemUserId
  email: string
  name: string
  role: string
  locationId: string
  realm: 'system'
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
    requireSystemUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireLead: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload
    user: TokenPayload
  }
}
