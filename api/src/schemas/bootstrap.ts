import { Type, type Static } from '@sinclair/typebox'
import {
  AddressSchema,
  ContainerFieldsSchema,
  FeatureFlagsSchema,
  PermissionsSchema,
} from './shared'

const BootstrapLocationSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  code: Type.String(),
  address: AddressSchema,
  timezone: Type.String(),
  status: Type.String(),
})

const LeadAssignmentSchema = Type.Object({
  leadId: Type.String(),
  leadName: Type.String(),
  role: Type.String(),
  shiftStart: Type.String(),
  shiftEnd: Type.String(),
})

const BootstrapProductSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  payRuleId: Type.Union([Type.String(), Type.Null()]),
  billingRuleId: Type.Union([Type.String(), Type.Null()]),
})

const BootstrapCustomerSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: Type.String(),
  products: Type.Array(BootstrapProductSchema),
})

const BootstrapEmployeeSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  employeeCode: Type.String(),
  status: Type.String(),
  assignedLocationId: Type.String(),
})

const RateRuleSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  rate: Type.Number(),
  currency: Type.String(),
})

const BootstrapLoadSchema = Type.Object({
  id: Type.String(),
  customerId: Type.Union([Type.String(), Type.Null()]),
  status: Type.Union([Type.Literal('active'), Type.Literal('completed')]),
  containerNumber: Type.Union([Type.String(), Type.Null()]),
  cases: Type.Union([Type.Number(), Type.Null()]),
  weight: Type.Union([Type.Number(), Type.Null()]),
  sorts: Type.Union([Type.Number(), Type.Null()]),
  notes: Type.Union([Type.String(), Type.Null()]),
  startedAt: Type.String({ format: 'date-time' }),
  completedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
})

const LocationContactSchema = Type.Object({
  name: Type.String(),
  role: Type.String(),
  phone: Type.String(),
})

const ShiftConfigSchema = Type.Object({
  start: Type.String(),
  end: Type.String(),
})

/** GET /locations/:locationId/bootstrap — the full shift dataset. */
export const LocationBootstrapSchema = Type.Object({
  location: BootstrapLocationSchema,
  leadAssignment: LeadAssignmentSchema,
  customers: Type.Array(BootstrapCustomerSchema),
  employees: Type.Array(BootstrapEmployeeSchema),
  payRules: Type.Array(RateRuleSchema),
  billingRules: Type.Array(RateRuleSchema),
  activeLoads: Type.Array(BootstrapLoadSchema),
  recentLoads: Type.Array(BootstrapLoadSchema),
  containerFields: ContainerFieldsSchema,
  permissions: PermissionsSchema,
  featureFlags: FeatureFlagsSchema,
  locationContacts: Type.Array(LocationContactSchema),
  shiftConfig: ShiftConfigSchema,
  lastSyncedAt: Type.String({ format: 'date-time' }),
})
export type LocationBootstrap = Static<typeof LocationBootstrapSchema>
