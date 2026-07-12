import bcrypt from 'bcryptjs'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { LoginBodySchema, LoginResponseSchema } from '../../../schemas/auth'
import { ErrorResponseSchema } from '../../../schemas/shared'
import { toCheckIn } from '../../../lib/serializers'
import type { LeadTokenPayload } from '../../../plugins/auth'

const authRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Log in as a Lead and receive a JWT',
        body: LoginBodySchema,
        response: {
          200: LoginResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const { loginId, password } = request.body

      const lead = await fastify.prisma.lead.findUnique({ where: { loginId } })
      if (!lead || !(await bcrypt.compare(password, lead.passwordHash))) {
        throw fastify.httpErrors.unauthorized('Invalid credentials.')
      }

      const payload: LeadTokenPayload = {
        sub: lead.id,
        loginId: lead.loginId,
        name: lead.name,
        role: lead.role,
      }
      const token = fastify.jwt.sign(payload)

      const activeCheckIn = await fastify.prisma.checkIn.findFirst({
        where: { leadId: lead.id, status: 'active' },
        orderBy: { checkedInAt: 'desc' },
      })

      return {
        token,
        lead: {
          id: lead.id,
          loginId: lead.loginId,
          name: lead.name,
          role: lead.role,
        },
        activeCheckIn: activeCheckIn ? toCheckIn(activeCheckIn) : null,
      }
    }
  )
}

export default authRoutes
