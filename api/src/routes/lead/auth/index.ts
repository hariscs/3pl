import bcrypt from 'bcryptjs'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import {
  LoginBodySchema,
  LoginResponseSchema,
  LogoutBodySchema,
  RefreshBodySchema,
  RefreshResponseSchema,
} from '../../../schemas/auth'
import { ErrorResponseSchema } from '../../../schemas/shared'
import { toCheckIn, toLeadUser } from '../../../lib/serializers'
import {
  issueTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../../../lib/leadAuth'

const authRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Log in as a Lead and receive an access + refresh token',
        body: LoginBodySchema,
        response: {
          200: LoginResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const { email, password } = request.body

      const lead = await fastify.prisma.lead.findUnique({ where: { email } })
      if (!lead || !(await bcrypt.compare(password, lead.passwordHash))) {
        throw fastify.httpErrors.unauthorized('Invalid credentials.')
      }

      const { accessToken, refreshToken } = await issueTokens(fastify, lead)

      const activeCheckIn = await fastify.prisma.checkIn.findFirst({
        where: { leadId: lead.id, status: 'active' },
        orderBy: { checkedInAt: 'desc' },
      })

      return {
        user: toLeadUser(lead),
        accessToken,
        refreshToken,
        activeCheckIn: activeCheckIn ? toCheckIn(activeCheckIn) : null,
      }
    }
  )

  // Public: the refresh token itself is the credential, so no access-token guard.
  fastify.post(
    '/refresh',
    {
      schema: {
        tags: ['auth'],
        summary: 'Exchange a refresh token for a rotated access + refresh pair',
        body: RefreshBodySchema,
        response: {
          200: RefreshResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request) => rotateRefreshToken(fastify, request.body.refreshToken)
  )

  fastify.post(
    '/logout',
    {
      onRequest: [fastify.requireLead],
      schema: {
        tags: ['auth'],
        summary: 'Revoke a refresh token (log out)',
        security: [{ bearerAuth: [] }],
        body: LogoutBodySchema,
        response: {
          204: Type.Null(),
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await revokeRefreshToken(fastify, request.body.refreshToken)
      reply.code(204)
      return null
    }
  )
}

export default authRoutes
