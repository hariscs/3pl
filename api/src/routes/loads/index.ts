import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import type { FastifyInstance } from 'fastify'
import type { LoadStatus } from '@prisma/client'
import {
  IdParamsSchema,
  LoadCreateSchema,
  LoadSchema,
  LoadUpdateSchema,
} from '../../schemas/domain'
import { ErrorResponseSchema } from '../../schemas/shared'
import { loadInclude, toLoad } from '../../lib/domain-serializers'
import { calculateLoadAmounts } from '../../lib/billing'

interface Quantities {
  cases: number
  sorts: number
  weight: number
}

// Loads only bill once they are marked complete.
async function computeBilling(
  fastify: FastifyInstance,
  productTypeId: string,
  qty: Quantities,
  status: LoadStatus
): Promise<{ billed: number; payout: number }> {
  if (status !== 'complete') return { billed: 0, payout: 0 }
  const productType = await fastify.prisma.productType.findUnique({
    where: { id: productTypeId },
    include: { rateLines: true },
  })
  if (!productType) return { billed: 0, payout: 0 }
  return calculateLoadAmounts(productType.rateLines, qty)
}

const loadRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Back-office routes require an authenticated system user.
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.get(
    '/',
    {
      schema: {
        tags: ['loads'],
        summary: 'List loads',
        response: { 200: Type.Array(LoadSchema) },
      },
    },
    async () => {
      const loads = await fastify.prisma.load.findMany({
        include: loadInclude,
        orderBy: { ticketNumber: 'desc' },
      })
      return loads.map(toLoad)
    }
  )

  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['loads'],
        summary: 'Get a load',
        params: IdParamsSchema,
        response: { 200: LoadSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const load = await fastify.prisma.load.findUnique({
        where: { id: request.params.id },
        include: loadInclude,
      })
      if (!load) throw fastify.httpErrors.notFound('Load not found.')
      return toLoad(load)
    }
  )

  fastify.post(
    '/',
    {
      schema: {
        tags: ['loads'],
        summary: 'Create a load (assigns ticket number, computes billing)',
        body: LoadCreateSchema,
        response: { 201: LoadSchema },
      },
    },
    async (request, reply) => {
      const { assignments, status = 'active', ...rest } = request.body

      const agg = await fastify.prisma.load.aggregate({
        _max: { ticketNumber: true },
      })
      const ticketNumber = (agg._max.ticketNumber ?? 0) + 1

      const { billed, payout } = await computeBilling(
        fastify,
        rest.productTypeId,
        { cases: rest.cases, sorts: rest.sorts, weight: rest.weight },
        status
      )

      const load = await fastify.prisma.load.create({
        data: {
          ...rest,
          status,
          ticketNumber,
          billedAmount: billed,
          payoutAmount: payout,
          assignments: { create: assignments },
        },
        include: loadInclude,
      })
      reply.code(201)
      return toLoad(load)
    }
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['loads'],
        summary: 'Update a load (recomputes billing)',
        params: IdParamsSchema,
        body: LoadUpdateSchema,
        response: { 200: LoadSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const existing = await fastify.prisma.load.findUnique({
        where: { id: request.params.id },
      })
      if (!existing) throw fastify.httpErrors.notFound('Load not found.')

      const { assignments, ...rest } = request.body
      const productTypeId = rest.productTypeId ?? existing.productTypeId
      const status = rest.status ?? existing.status
      const qty: Quantities = {
        cases: rest.cases ?? existing.cases,
        sorts: rest.sorts ?? existing.sorts,
        weight: rest.weight ?? existing.weight,
      }
      const { billed, payout } = await computeBilling(
        fastify,
        productTypeId,
        qty,
        status
      )

      const load = await fastify.prisma.load.update({
        where: { id: request.params.id },
        data: {
          ...rest,
          billedAmount: billed,
          payoutAmount: payout,
          ...(assignments
            ? { assignments: { deleteMany: {}, create: assignments } }
            : {}),
        },
        include: loadInclude,
      })
      return toLoad(load)
    }
  )

  fastify.post(
    '/:id/void',
    {
      schema: {
        tags: ['loads'],
        summary: 'Void a load (zeros billing)',
        params: IdParamsSchema,
        response: { 200: LoadSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const exists = await fastify.prisma.load.findUnique({
        where: { id: request.params.id },
      })
      if (!exists) throw fastify.httpErrors.notFound('Load not found.')
      const load = await fastify.prisma.load.update({
        where: { id: request.params.id },
        data: { status: 'void', billedAmount: 0, payoutAmount: 0 },
        include: loadInclude,
      })
      return toLoad(load)
    }
  )

  fastify.post(
    '/:id/archive',
    {
      schema: {
        tags: ['loads'],
        summary: 'Archive a load',
        params: IdParamsSchema,
        response: { 200: LoadSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const exists = await fastify.prisma.load.findUnique({
        where: { id: request.params.id },
      })
      if (!exists) throw fastify.httpErrors.notFound('Load not found.')
      const load = await fastify.prisma.load.update({
        where: { id: request.params.id },
        data: { status: 'archived' },
        include: loadInclude,
      })
      return toLoad(load)
    }
  )
}

export default loadRoutes
