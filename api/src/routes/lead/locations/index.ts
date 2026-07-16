import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { LocationCardListSchema } from '../../../schemas/location'
import {
  LeadAssignmentSchema,
  LeadSelfAssignSchema,
} from '../../../schemas/lead'
import { ErrorResponseSchema } from '../../../schemas/shared'

const locationsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Assigned locations shown on the Location Check-In screen.
  fastify.get(
    '/',
    {
      onRequest: [fastify.requireLead],
      schema: {
        tags: ['locations'],
        summary: 'List the Lead\'s assigned locations (check-in cards)',
        security: [{ bearerAuth: [] }],
        response: {
          200: LocationCardListSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const leadId = request.user.sub

      const assignments = await fastify.prisma.leadAssignment.findMany({
        where: { leadId },
        include: { location: true },
        orderBy: { location: { name: 'asc' } },
      })

      // Last visited = most recent check-in this Lead made at each location.
      const visits = await fastify.prisma.checkIn.groupBy({
        by: ['locationId'],
        where: { leadId },
        _max: { checkedInAt: true },
      })
      const lastVisitedByLocation = new Map(
        visits.map((v) => [v.locationId, v._max.checkedInAt])
      )

      const locations = assignments.map((assignment) => {
        const loc = assignment.location
        const lastVisited = lastVisitedByLocation.get(loc.id) ?? null
        const line1 = loc.addressL1 ?? ''
        const city = loc.city ?? ''
        const state = loc.state ?? ''
        const postalCode = loc.postalCode ?? ''
        return {
          id: loc.id,
          name: loc.name,
          code: loc.code ?? loc.id,
          group: loc.group ?? null,
          address: { line1, city, state, postalCode },
          fullAddress: [line1, [city, state].filter(Boolean).join(', '), postalCode]
            .filter(Boolean)
            .join(', '),
          distanceMiles: assignment.distanceMiles ?? null,
          assigned: true,
          lastVisitedAt: lastVisited ? lastVisited.toISOString() : null,
          status: loc.status,
        }
      })

      return { locations }
    }
  )

  // POST /lead/locations — the Lead self-adds a location assignment.
  // Auto-assign (v1): the assignment is active immediately, no admin approval.
  fastify.post(
    '/',
    {
      onRequest: [fastify.requireLead],
      schema: {
        tags: ['locations'],
        summary: 'Self-assign the Lead to a location',
        security: [{ bearerAuth: [] }],
        body: LeadSelfAssignSchema,
        response: {
          201: LeadAssignmentSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const leadId = request.user.sub
      const { locationId } = request.body

      const location = await fastify.prisma.location.findUnique({
        where: { id: locationId },
      })
      if (!location) throw fastify.httpErrors.notFound('Location not found.')

      const existing = await fastify.prisma.leadAssignment.findUnique({
        where: { leadId_locationId: { leadId, locationId } },
      })
      if (existing) {
        throw fastify.httpErrors.conflict('You are already assigned to this location.')
      }

      const assignment = await fastify.prisma.leadAssignment.create({
        data: { leadId, locationId },
      })
      reply.code(201)
      return {
        locationId: assignment.locationId,
        role: assignment.role,
        shiftStart: assignment.shiftStart,
        shiftEnd: assignment.shiftEnd,
        distanceMiles: assignment.distanceMiles ?? null,
      }
    }
  )
}

export default locationsRoutes
