import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import {
  IdParamsSchema,
  ProductTypeCreateSchema,
  ProductTypeSchema,
  ProductTypeUpdateSchema,
} from '../../schemas/domain'
import { ErrorResponseSchema } from '../../schemas/shared'
import { productTypeInclude, toProductType } from '../../lib/domain-serializers'

const productTypeRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['product-types'],
        summary: 'List product types',
        response: { 200: Type.Array(ProductTypeSchema) },
      },
    },
    async () => {
      const productTypes = await fastify.prisma.productType.findMany({
        include: productTypeInclude,
        orderBy: { name: 'asc' },
      })
      return productTypes.map(toProductType)
    }
  )

  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['product-types'],
        summary: 'Get a product type',
        params: IdParamsSchema,
        response: { 200: ProductTypeSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const productType = await fastify.prisma.productType.findUnique({
        where: { id: request.params.id },
        include: productTypeInclude,
      })
      if (!productType) {
        throw fastify.httpErrors.notFound('Product type not found.')
      }
      return toProductType(productType)
    }
  )

  fastify.post(
    '/',
    {
      schema: {
        tags: ['product-types'],
        summary: 'Create a product type',
        body: ProductTypeCreateSchema,
        response: { 201: ProductTypeSchema },
      },
    },
    async (request, reply) => {
      const { rateLines, ...rest } = request.body
      const productType = await fastify.prisma.productType.create({
        data: { ...rest, rateLines: { create: rateLines } },
        include: productTypeInclude,
      })
      reply.code(201)
      return toProductType(productType)
    }
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['product-types'],
        summary: 'Update a product type (replaces the rate card if provided)',
        params: IdParamsSchema,
        body: ProductTypeUpdateSchema,
        response: { 200: ProductTypeSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const { rateLines, ...rest } = request.body
      const exists = await fastify.prisma.productType.findUnique({
        where: { id: request.params.id },
      })
      if (!exists) throw fastify.httpErrors.notFound('Product type not found.')

      const productType = await fastify.prisma.productType.update({
        where: { id: request.params.id },
        data: {
          ...rest,
          ...(rateLines
            ? { rateLines: { deleteMany: {}, create: rateLines } }
            : {}),
        },
        include: productTypeInclude,
      })
      return toProductType(productType)
    }
  )

  fastify.post(
    '/:id/toggle-archive',
    {
      schema: {
        tags: ['product-types'],
        summary: 'Toggle a product type between active and archived',
        params: IdParamsSchema,
        response: { 200: ProductTypeSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const current = await fastify.prisma.productType.findUnique({
        where: { id: request.params.id },
      })
      if (!current) throw fastify.httpErrors.notFound('Product type not found.')
      const productType = await fastify.prisma.productType.update({
        where: { id: request.params.id },
        data: { status: current.status === 'active' ? 'archived' : 'active' },
        include: productTypeInclude,
      })
      return toProductType(productType)
    }
  )
}

export default productTypeRoutes
