import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import {
  EmployeeCreateSchema,
  EmployeeSchema,
  EmployeeUpdateSchema,
  IdParamsSchema,
} from '../../schemas/domain'
import { ErrorResponseSchema } from '../../schemas/shared'
import { toEmployee } from '../../lib/domain-serializers'

const employeeRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['employees'],
        summary: 'List employees',
        response: { 200: Type.Array(EmployeeSchema) },
      },
    },
    async () => {
      const employees = await fastify.prisma.employee.findMany({
        orderBy: { name: 'asc' },
      })
      return employees.map(toEmployee)
    }
  )

  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['employees'],
        summary: 'Get an employee',
        params: IdParamsSchema,
        response: { 200: EmployeeSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const employee = await fastify.prisma.employee.findUnique({
        where: { id: request.params.id },
      })
      if (!employee) throw fastify.httpErrors.notFound('Employee not found.')
      return toEmployee(employee)
    }
  )

  fastify.post(
    '/',
    {
      schema: {
        tags: ['employees'],
        summary: 'Create an employee',
        body: EmployeeCreateSchema,
        response: { 201: EmployeeSchema },
      },
    },
    async (request, reply) => {
      const employee = await fastify.prisma.employee.create({
        data: request.body,
      })
      reply.code(201)
      return toEmployee(employee)
    }
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['employees'],
        summary: 'Update an employee',
        params: IdParamsSchema,
        body: EmployeeUpdateSchema,
        response: { 200: EmployeeSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const exists = await fastify.prisma.employee.findUnique({
        where: { id: request.params.id },
      })
      if (!exists) throw fastify.httpErrors.notFound('Employee not found.')
      const employee = await fastify.prisma.employee.update({
        where: { id: request.params.id },
        data: request.body,
      })
      return toEmployee(employee)
    }
  )

  fastify.post(
    '/:id/toggle-archive',
    {
      schema: {
        tags: ['employees'],
        summary: 'Toggle an employee between active and archived',
        params: IdParamsSchema,
        response: { 200: EmployeeSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const current = await fastify.prisma.employee.findUnique({
        where: { id: request.params.id },
      })
      if (!current) throw fastify.httpErrors.notFound('Employee not found.')
      const employee = await fastify.prisma.employee.update({
        where: { id: request.params.id },
        data: { status: current.status === 'active' ? 'archived' : 'active' },
      })
      return toEmployee(employee)
    }
  )
}

export default employeeRoutes
