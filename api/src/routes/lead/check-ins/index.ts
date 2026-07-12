import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import {
  CheckInSchema,
  CreateCheckInBodySchema,
} from '../../../schemas/checkin'
import { ErrorResponseSchema } from '../../../schemas/shared'
import { toCheckIn } from '../../../lib/serializers'

const CheckoutParamsSchema = Type.Object({
  checkInId: Type.String(),
})

const checkInRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // POST /lead/check-ins — start a shift at a location.
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['check-ins'],
        summary: 'Start a shift by checking in to a location',
        security: [{ bearerAuth: [] }],
        body: CreateCheckInBodySchema,
        response: {
          201: CheckInSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const leadId = request.user.sub
      const { locationId, deviceId, checkedInAt } = request.body

      const assignment = await fastify.prisma.leadAssignment.findUnique({
        where: { leadId_locationId: { leadId, locationId } },
      })
      if (!assignment) {
        throw fastify.httpErrors.forbidden(
          'You are not assigned to this location.'
        )
      }

      // Only one active check-in at a time — the current shift must be ended first.
      const existing = await fastify.prisma.checkIn.findFirst({
        where: { leadId, status: 'active' },
      })
      if (existing) {
        throw fastify.httpErrors.conflict(
          'An active check-in already exists. End your current shift first.'
        )
      }

      const checkIn = await fastify.prisma.checkIn.create({
        data: {
          leadId,
          locationId,
          deviceId: deviceId ?? null,
          status: 'active',
          checkedInAt: checkedInAt ? new Date(checkedInAt) : new Date(),
        },
      })

      reply.code(201)
      return toCheckIn(checkIn)
    }
  )

  // POST /lead/check-ins/:checkInId/checkout — end the current shift.
  fastify.post(
    '/:checkInId/checkout',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['check-ins'],
        summary: 'End the current shift (check out)',
        security: [{ bearerAuth: [] }],
        params: CheckoutParamsSchema,
        response: {
          200: CheckInSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const leadId = request.user.sub
      const { checkInId } = request.params

      const checkIn = await fastify.prisma.checkIn.findFirst({
        where: { id: checkInId, leadId },
      })
      if (!checkIn) {
        throw fastify.httpErrors.notFound('Check-in not found.')
      }
      if (checkIn.status !== 'active') {
        throw fastify.httpErrors.conflict('Check-in is already closed.')
      }

      const updated = await fastify.prisma.checkIn.update({
        where: { id: checkIn.id },
        data: { status: 'completed', checkedOutAt: new Date() },
      })

      return toCheckIn(updated)
    }
  )
}

export default checkInRoutes
