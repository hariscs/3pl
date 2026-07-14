import bcrypt from 'bcryptjs'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import {
  SystemUserLoginBodySchema,
  SystemUserLoginResponseSchema,
} from '../../schemas/auth'
import { ErrorResponseSchema } from '../../schemas/shared'
import { toSystemUser } from '../../lib/domain-serializers'
import type { SystemUserTokenPayload } from '../../plugins/auth'

/**
 * Dockmaster back-office auth. System users (admin/lead/customer roles) log in
 * by email + password and receive a JWT used to authorize the dashboard API.
 */
const authRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Log in as a system user and receive a JWT',
        body: SystemUserLoginBodySchema,
        response: {
          200: SystemUserLoginResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const { email, password } = request.body

      const user = await fastify.prisma.systemUser.findUnique({
        where: { email },
      })
      // Same generic error whether the email is unknown or the password is
      // wrong, so we don't leak which accounts exist.
      if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        throw fastify.httpErrors.unauthorized('Invalid credentials.')
      }
      if (user.status !== 'active') {
        throw fastify.httpErrors.forbidden('This account has been archived.')
      }

      const payload: SystemUserTokenPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        locationId: user.locationId,
        realm: 'system',
      }
      const token = fastify.jwt.sign(payload)

      return { token, user: toSystemUser(user) }
    }
  )
}

export default authRoutes
