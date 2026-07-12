import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import type { Load as PrismaLoad } from '@prisma/client'
import { LocationBootstrapSchema } from '../../schemas/bootstrap'
import { ErrorResponseSchema } from '../../schemas/shared'
import {
  asContainerFields,
  asFeatureFlags,
  asPermissions,
} from '../../lib/serializers'

const BootstrapParamsSchema = Type.Object({
  locationId: Type.String(),
})

function toLoad(load: PrismaLoad) {
  return {
    id: load.id,
    customerId: load.customerId ?? null,
    status: load.status,
    containerNumber: load.containerNumber ?? null,
    cases: load.cases ?? null,
    weight: load.weight ?? null,
    sorts: load.sorts ?? null,
    notes: load.notes ?? null,
    startedAt: load.startedAt.toISOString(),
    completedAt: load.completedAt ? load.completedAt.toISOString() : null,
  }
}

const locationBootstrapRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // GET /locations/:locationId/bootstrap — full dataset for the shift.
  fastify.get(
    '/:locationId/bootstrap',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['locations'],
        summary: 'Download the full shift dataset for a location',
        security: [{ bearerAuth: [] }],
        params: BootstrapParamsSchema,
        response: {
          200: LocationBootstrapSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const leadId = request.user.sub
      const { locationId } = request.params

      const location = await fastify.prisma.location.findUnique({
        where: { id: locationId },
        include: {
          customers: { include: { products: true } },
          employees: true,
          payRules: true,
          billingRules: true,
          contacts: true,
        },
      })
      if (!location) {
        throw fastify.httpErrors.notFound('Location not found.')
      }

      const assignment = await fastify.prisma.leadAssignment.findUnique({
        where: { leadId_locationId: { leadId, locationId } },
        include: { lead: true },
      })
      if (!assignment) {
        throw fastify.httpErrors.forbidden(
          'You are not assigned to this location.'
        )
      }

      const [activeLoads, recentLoads] = await Promise.all([
        fastify.prisma.load.findMany({
          where: { locationId, status: 'active' },
          orderBy: { startedAt: 'desc' },
        }),
        fastify.prisma.load.findMany({
          where: { locationId, status: 'completed' },
          orderBy: { completedAt: 'desc' },
          take: 10,
        }),
      ])

      return {
        location: {
          id: location.id,
          name: location.name,
          code: location.code,
          address: {
            line1: location.addressL1,
            city: location.city,
            state: location.state,
            postalCode: location.postalCode,
          },
          timezone: location.timezone,
          status: location.status,
        },
        leadAssignment: {
          leadId: assignment.leadId,
          leadName: assignment.lead.name,
          role: assignment.role,
          shiftStart: assignment.shiftStart,
          shiftEnd: assignment.shiftEnd,
        },
        customers: location.customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          status: customer.status,
          products: customer.products.map((product) => ({
            id: product.id,
            name: product.name,
            payRuleId: product.payRuleId ?? null,
            billingRuleId: product.billingRuleId ?? null,
          })),
        })),
        employees: location.employees.map((employee) => ({
          id: employee.id,
          name: employee.name,
          employeeCode: employee.employeeCode,
          status: employee.status,
          assignedLocationId: employee.locationId,
        })),
        payRules: location.payRules.map((rule) => ({
          id: rule.id,
          type: rule.type,
          rate: rule.rate,
          currency: rule.currency,
        })),
        billingRules: location.billingRules.map((rule) => ({
          id: rule.id,
          type: rule.type,
          rate: rule.rate,
          currency: rule.currency,
        })),
        activeLoads: activeLoads.map(toLoad),
        recentLoads: recentLoads.map(toLoad),
        containerFields: asContainerFields(location.containerFields),
        permissions: asPermissions(location.permissions),
        featureFlags: asFeatureFlags(location.featureFlags),
        locationContacts: location.contacts.map((contact) => ({
          name: contact.name,
          role: contact.role,
          phone: contact.phone,
        })),
        shiftConfig: {
          start: location.shiftStart,
          end: location.shiftEnd,
        },
        lastSyncedAt: new Date().toISOString(),
      }
    }
  )
}

export default locationBootstrapRoutes
