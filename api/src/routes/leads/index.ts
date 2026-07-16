import bcrypt from 'bcryptjs'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { IdParamsSchema } from '../../schemas/domain'
import {
  LeadAssignmentsPutSchema,
  LeadCreateSchema,
  LeadSchema,
  LeadUpdateSchema,
} from '../../schemas/lead'
import { ErrorResponseSchema } from '../../schemas/shared'
import { leadInclude, toLead } from '../../lib/domain-serializers'

const leadRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Lead administration is a back-office (dashboard) concern.
  fastify.addHook('onRequest', fastify.requireSystemUser)

  fastify.get(
    '/',
    {
      schema: {
        tags: ['leads'],
        summary: 'List leads',
        response: { 200: Type.Array(LeadSchema) },
      },
    },
    async () => {
      const leads = await fastify.prisma.lead.findMany({
        orderBy: { name: 'asc' },
        include: leadInclude,
      })
      return leads.map(toLead)
    }
  )

  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['leads'],
        summary: 'Get a lead',
        params: IdParamsSchema,
        response: { 200: LeadSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const lead = await fastify.prisma.lead.findUnique({
        where: { id: request.params.id },
        include: leadInclude,
      })
      if (!lead) throw fastify.httpErrors.notFound('Lead not found.')
      return toLead(lead)
    }
  )

  fastify.post(
    '/',
    {
      schema: {
        tags: ['leads'],
        summary: 'Create a lead',
        body: LeadCreateSchema,
        response: { 201: LeadSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { password, ...rest } = request.body

      const existing = await fastify.prisma.lead.findUnique({
        where: { email: rest.email },
      })
      if (existing) {
        throw fastify.httpErrors.conflict('A lead with this email already exists.')
      }

      const lead = await fastify.prisma.lead.create({
        data: { ...rest, passwordHash: await bcrypt.hash(password, 10) },
        include: leadInclude,
      })
      reply.code(201)
      return toLead(lead)
    }
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['leads'],
        summary: 'Update a lead',
        params: IdParamsSchema,
        body: LeadUpdateSchema,
        response: {
          200: LeadSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const { password, email, ...rest } = request.body

      const current = await fastify.prisma.lead.findUnique({
        where: { id: request.params.id },
      })
      if (!current) throw fastify.httpErrors.notFound('Lead not found.')

      if (email && email !== current.email) {
        const clash = await fastify.prisma.lead.findUnique({ where: { email } })
        if (clash) {
          throw fastify.httpErrors.conflict('A lead with this email already exists.')
        }
      }

      const lead = await fastify.prisma.lead.update({
        where: { id: request.params.id },
        data: {
          ...rest,
          ...(email ? { email } : {}),
          ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
        },
        include: leadInclude,
      })
      return toLead(lead)
    }
  )

  fastify.put(
    '/:id/assignments',
    {
      schema: {
        tags: ['leads'],
        summary: "Replace a lead's location assignments",
        params: IdParamsSchema,
        body: LeadAssignmentsPutSchema,
        response: {
          200: LeadSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const leadId = request.params.id
      const { assignments } = request.body

      const lead = await fastify.prisma.lead.findUnique({ where: { id: leadId } })
      if (!lead) throw fastify.httpErrors.notFound('Lead not found.')

      const locationIds = assignments.map((a) => a.locationId)
      if (new Set(locationIds).size !== locationIds.length) {
        throw fastify.httpErrors.badRequest('Duplicate locationId in assignments.')
      }
      const found = await fastify.prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true },
      })
      if (found.length !== locationIds.length) {
        throw fastify.httpErrors.badRequest('One or more locations do not exist.')
      }

      await fastify.prisma.$transaction([
        fastify.prisma.leadAssignment.deleteMany({ where: { leadId } }),
        fastify.prisma.leadAssignment.createMany({
          data: assignments.map((a) => ({
            leadId,
            locationId: a.locationId,
            role: a.role,
            shiftStart: a.shiftStart,
            shiftEnd: a.shiftEnd,
            distanceMiles: a.distanceMiles,
          })),
        }),
      ])

      const updated = await fastify.prisma.lead.findUniqueOrThrow({
        where: { id: leadId },
        include: leadInclude,
      })
      return toLead(updated)
    }
  )
}

export default leadRoutes
