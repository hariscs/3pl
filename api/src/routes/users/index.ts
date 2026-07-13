import bcrypt from 'bcryptjs'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import {
  SystemUserCreateSchema,
  SystemUserSchema,
} from '../../schemas/domain'
import { ErrorResponseSchema } from '../../schemas/shared'
import { toSystemUser } from '../../lib/domain-serializers'

const userRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // Back-office routes require an authenticated system user.
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.get(
    '/',
    {
      schema: {
        tags: ['users'],
        summary: 'List system users',
        response: { 200: Type.Array(SystemUserSchema) },
      },
    },
    async () => {
      const users = await fastify.prisma.systemUser.findMany({
        orderBy: { name: 'asc' },
      })
      return users.map(toSystemUser)
    }
  )

  fastify.post(
    '/',
    {
      schema: {
        tags: ['users'],
        summary: 'Create a system user',
        body: SystemUserCreateSchema,
        response: { 201: SystemUserSchema, 409: ErrorResponseSchema },
      },
    },
    async (request, reply) => {
      const { password, ...rest } = request.body

      const existing = await fastify.prisma.systemUser.findUnique({
        where: { email: rest.email },
      })
      if (existing) {
        throw fastify.httpErrors.conflict('A user with this email already exists.')
      }

      const user = await fastify.prisma.systemUser.create({
        data: {
          ...rest,
          passwordHash: password ? await bcrypt.hash(password, 10) : null,
        },
      })
      reply.code(201)
      return toSystemUser(user)
    }
  )
}

export default userRoutes
