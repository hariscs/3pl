import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { SessionResponseSchema } from '../../../schemas/auth'
import { ErrorResponseSchema } from '../../../schemas/shared'
import { toCheckIn, toLeadUser } from '../../../lib/serializers'

const sessionRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Used on app launch to restore the authenticated session and detect whether
  // the Lead already has an active location check-in.
  fastify.get(
    '/',
    {
      onRequest: [fastify.requireLead],
      schema: {
        tags: ['auth'],
        summary: 'Restore the authenticated session on app launch',
        security: [{ bearerAuth: [] }],
        response: {
          200: SessionResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const leadId = request.user.sub

      const lead = await fastify.prisma.lead.findUnique({ where: { id: leadId } })
      if (!lead) {
        throw fastify.httpErrors.unauthorized('Session no longer valid.')
      }

      const activeCheckIn = await fastify.prisma.checkIn.findFirst({
        where: { leadId, status: 'active' },
        orderBy: { checkedInAt: 'desc' },
      })

      return {
        user: toLeadUser(lead),
        activeCheckIn: activeCheckIn ? toCheckIn(activeCheckIn) : null,
      }
    }
  )
}

export default sessionRoutes
