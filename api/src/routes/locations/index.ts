import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import type { Load as PrismaLoad } from '@prisma/client'
import { LocationBootstrapSchema } from '../../schemas/bootstrap'
import { ErrorResponseSchema } from '../../schemas/shared'
import { LocationSchema } from '../../schemas/domain'
import {
  asContainerFields,
  asFeatureFlags,
  asPermissions,
} from '../../lib/serializers'
import { toLocation } from '../../lib/domain-serializers'

const BootstrapParamsSchema = Type.Object({
  locationId: Type.String(),
})

// Defaults used when a location has no lead field-app config.
const DEFAULT_CONTAINER_FIELDS = {
  containerNumberRequired: true,
  casesRequired: true,
  weightRequired: true,
  sortsRequired: true,
  notesEnabled: true,
  photosEnabled: true,
}
const DEFAULT_PERMISSIONS = {
  canStartLoad: true,
  canCloseLoad: true,
  canEditLoad: true,
  canClockEmployees: true,
  canViewPayRates: false,
  canViewBillingRates: false,
}
const DEFAULT_FEATURE_FLAGS = {
  photoCapture: true,
  breakTracking: false,
  offlineMode: true,
}

// Projects a rich Load into the thin lead-app load shape.
function toLeadLoad(load: PrismaLoad) {
  const startedAt = new Date(load.date).toISOString()
  return {
    id: load.id,
    customerId: load.customerId,
    status: (load.status === 'complete' ? 'completed' : 'active') as
      | 'active'
      | 'completed',
    containerNumber: load.containerNumber,
    cases: load.cases,
    weight: load.weight,
    sorts: load.sorts,
    notes: null,
    startedAt,
    completedAt: load.status === 'complete' ? startedAt : null,
  }
}

const locationBootstrapRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // GET /locations — list all locations (dashboard location switcher).
  fastify.get(
    '/',
    {
      schema: {
        tags: ['locations'],
        summary: 'List all locations',
        response: { 200: Type.Array(LocationSchema) },
      },
    },
    async () => {
      const locations = await fastify.prisma.location.findMany({
        orderBy: { name: 'asc' },
      })
      return locations.map(toLocation)
    }
  )

  // GET /locations/:locationId — a single location.
  fastify.get(
    '/:locationId',
    {
      schema: {
        tags: ['locations'],
        summary: 'Get a location',
        params: BootstrapParamsSchema,
        response: { 200: LocationSchema, 404: ErrorResponseSchema },
      },
    },
    async (request) => {
      const location = await fastify.prisma.location.findUnique({
        where: { id: request.params.locationId },
      })
      if (!location) {
        throw fastify.httpErrors.notFound('Location not found.')
      }
      return toLocation(location)
    }
  )

  // GET /locations/:locationId/bootstrap — full dataset for the shift,
  // projected from the unified Dockmaster models.
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
          customers: { where: { status: 'active' } },
          employees: { where: { status: 'active' } },
          productTypes: { where: { status: 'active' } },
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
          orderBy: { date: 'desc' },
        }),
        fastify.prisma.load.findMany({
          where: { locationId, status: 'complete' },
          orderBy: { date: 'desc' },
          take: 10,
        }),
      ])

      return {
        location: {
          id: location.id,
          name: location.name,
          code: location.code ?? location.id,
          address: {
            line1: location.addressL1 ?? '',
            city: location.city ?? '',
            state: location.state ?? '',
            postalCode: location.postalCode ?? '',
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
          name: customer.displayName,
          status: customer.status,
          products: location.productTypes
            .filter((pt) => pt.customerId === customer.id)
            .map((pt) => ({
              id: pt.id,
              name: pt.name,
              payRuleId: null,
              billingRuleId: null,
            })),
        })),
        employees: location.employees.map((employee) => ({
          id: employee.id,
          name: employee.name,
          employeeCode: employee.id,
          status: employee.status,
          assignedLocationId: employee.locationId,
        })),
        payRules: [],
        billingRules: [],
        activeLoads: activeLoads.map(toLeadLoad),
        recentLoads: recentLoads.map(toLeadLoad),
        containerFields: asContainerFields(
          location.containerFields ?? DEFAULT_CONTAINER_FIELDS
        ),
        permissions: asPermissions(location.permissions ?? DEFAULT_PERMISSIONS),
        featureFlags: asFeatureFlags(
          location.featureFlags ?? DEFAULT_FEATURE_FLAGS
        ),
        locationContacts: [],
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
