import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import {
  CustomerCreateSchema,
  CustomerSchema,
  CustomerUpdateSchema,
  IdParamsSchema,
} from '../../schemas/domain'
import { ErrorResponseSchema } from '../../schemas/shared'
import { customerInclude, toCustomer } from '../../lib/domain-serializers'

const customerRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Back-office routes require an authenticated system user.
  fastify.addHook('onRequest', fastify.requireSystemUser)

  fastify.get(
    '/',
    {
      schema: {
        tags: ['customers'],
        summary: 'List customers',
        response: { 200: Type.Array(CustomerSchema) },
      },
    },
    async () => {
      const customers = await fastify.prisma.customer.findMany({
        include: customerInclude,
        orderBy: { displayName: 'asc' },
      })
      return customers.map(toCustomer)
    }
  )

  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['customers'],
        summary: 'Get a customer',
        params: IdParamsSchema,
        response: { 200: CustomerSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const customer = await fastify.prisma.customer.findUnique({
        where: { id: request.params.id },
        include: customerInclude,
      })
      if (!customer) throw fastify.httpErrors.notFound('Customer not found.')
      return toCustomer(customer)
    }
  )

  fastify.post(
    '/',
    {
      schema: {
        tags: ['customers'],
        summary: 'Create a customer',
        body: CustomerCreateSchema,
        response: { 201: CustomerSchema },
      },
    },
    async (request, reply) => {
      const { locationIds, ...rest } = request.body
      const customer = await fastify.prisma.customer.create({
        data: {
          ...rest,
          locations: { connect: locationIds.map((id) => ({ id })) },
        },
        include: customerInclude,
      })
      reply.code(201)
      return toCustomer(customer)
    }
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['customers'],
        summary: 'Update a customer',
        params: IdParamsSchema,
        body: CustomerUpdateSchema,
        response: { 200: CustomerSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const { locationIds, ...rest } = request.body
      const exists = await fastify.prisma.customer.findUnique({
        where: { id: request.params.id },
      })
      if (!exists) throw fastify.httpErrors.notFound('Customer not found.')

      const customer = await fastify.prisma.customer.update({
        where: { id: request.params.id },
        data: {
          ...rest,
          ...(locationIds
            ? { locations: { set: locationIds.map((id) => ({ id })) } }
            : {}),
        },
        include: customerInclude,
      })
      return toCustomer(customer)
    }
  )

  fastify.post(
    '/:id/toggle-archive',
    {
      schema: {
        tags: ['customers'],
        summary: 'Toggle a customer between active and archived',
        params: IdParamsSchema,
        response: { 200: CustomerSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const current = await fastify.prisma.customer.findUnique({
        where: { id: request.params.id },
      })
      if (!current) throw fastify.httpErrors.notFound('Customer not found.')
      const customer = await fastify.prisma.customer.update({
        where: { id: request.params.id },
        data: { status: current.status === 'active' ? 'archived' : 'active' },
        include: customerInclude,
      })
      return toCustomer(customer)
    }
  )
}

export default customerRoutes
