import { Type, type Static } from '@sinclair/typebox'

// Shapes mirror web/src/lib/types.ts so the dashboard maps 1:1.

export const RecordStatusSchema = Type.Union([
  Type.Literal('active'),
  Type.Literal('archived'),
])
export const RoleSchema = Type.Union([
  Type.Literal('admin'),
  Type.Literal('lead'),
])
export const LoadStatusSchema = Type.Union([
  Type.Literal('active'),
  Type.Literal('complete'),
  Type.Literal('void'),
  Type.Literal('archived'),
])

export const IdParamsSchema = Type.Object({ id: Type.String() })

// --- Location ---
export const LocationSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  region: Type.String(),
  code: Type.Union([Type.String(), Type.Null()]),
  group: Type.Union([Type.String(), Type.Null()]),
  addressL1: Type.Union([Type.String(), Type.Null()]),
  city: Type.Union([Type.String(), Type.Null()]),
  state: Type.Union([Type.String(), Type.Null()]),
  postalCode: Type.Union([Type.String(), Type.Null()]),
  timezone: Type.String(),
  status: Type.String(),
  shiftStart: Type.String(),
  shiftEnd: Type.String(),
})
export const LocationCreateSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  region: Type.String(),
  code: Type.Optional(Type.String()),
  group: Type.Optional(Type.String()),
  addressL1: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  state: Type.Optional(Type.String()),
  postalCode: Type.Optional(Type.String()),
  timezone: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  shiftStart: Type.Optional(Type.String()),
  shiftEnd: Type.Optional(Type.String()),
})
export const LocationUpdateSchema = Type.Partial(LocationCreateSchema)
export type LocationCreate = Static<typeof LocationCreateSchema>
export type LocationUpdate = Static<typeof LocationUpdateSchema>

// --- Customer ---
export const CustomerSchema = Type.Object({
  id: Type.String(),
  contactName: Type.String(),
  email: Type.String(),
  phone: Type.String(),
  displayName: Type.String(),
  legalCompanyName: Type.String(),
  locationIds: Type.Array(Type.String()),
  status: RecordStatusSchema,
})
export const CustomerCreateSchema = Type.Object({
  contactName: Type.String(),
  email: Type.String(),
  phone: Type.String(),
  displayName: Type.String({ minLength: 1 }),
  legalCompanyName: Type.String(),
  locationIds: Type.Array(Type.String()),
})
export const CustomerUpdateSchema = Type.Partial(CustomerCreateSchema)
export type CustomerCreate = Static<typeof CustomerCreateSchema>
export type CustomerUpdate = Static<typeof CustomerUpdateSchema>

// --- Crew (Employee) ---
// Fixed category set. Stored as the key; the web UI supplies the display label.
export const CREW_CATEGORY_KEYS = [
  "labour",
  "operator",
  "forklift",
  "lead",
  "sorter",
  "loader",
  "checker",
  "clerk",
] as const
export type CrewCategory = (typeof CREW_CATEGORY_KEYS)[number]
// Explicit literals (not a mapped array) so TypeBox infers the union statically.
export const CrewCategorySchema = Type.Union([
  Type.Literal("labour"),
  Type.Literal("operator"),
  Type.Literal("forklift"),
  Type.Literal("lead"),
  Type.Literal("sorter"),
  Type.Literal("loader"),
  Type.Literal("checker"),
  Type.Literal("clerk"),
])

export const EmployeeSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String(),
  phone: Type.String(),
  address: Type.String(),
  hourlyRate: Type.Number(),
  // Loose on read — Prisma stores the key as a plain string. Create/update
  // validate the value against CrewCategorySchema.
  category: Type.Union([Type.String(), Type.Null()]),
  locationId: Type.String(),
  status: RecordStatusSchema,
})
export const EmployeeCreateSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String(),
  phone: Type.String(),
  address: Type.String(),
  hourlyRate: Type.Number(),
  category: Type.Optional(CrewCategorySchema),
  locationId: Type.String(),
})
export const EmployeeUpdateSchema = Type.Partial(EmployeeCreateSchema)
export type EmployeeCreate = Static<typeof EmployeeCreateSchema>
export type EmployeeUpdate = Static<typeof EmployeeUpdateSchema>

// --- Product type + rate card ---
export const RateLineSchema = Type.Object({
  id: Type.String(),
  unit: Type.String(),
  billBase: Type.Number(),
  billThreshold: Type.Number(),
  billOverRate: Type.Number(),
  payThreshold: Type.Number(),
  payOverRate: Type.Number(),
  payBonus: Type.Number(),
})
export const RateLineInputSchema = Type.Object({
  unit: Type.String(),
  billBase: Type.Number(),
  billThreshold: Type.Number(),
  billOverRate: Type.Number(),
  payThreshold: Type.Number(),
  payOverRate: Type.Number(),
  payBonus: Type.Number(),
})
export const ProductTypeSchema = Type.Object({
  id: Type.String(),
  customerId: Type.String(),
  locationId: Type.String(),
  name: Type.String(),
  rateLines: Type.Array(RateLineSchema),
  status: RecordStatusSchema,
})
export const ProductTypeCreateSchema = Type.Object({
  customerId: Type.String(),
  locationId: Type.String(),
  name: Type.String({ minLength: 1 }),
  rateLines: Type.Array(RateLineInputSchema),
})
export const ProductTypeUpdateSchema = Type.Partial(ProductTypeCreateSchema)
export type ProductTypeCreate = Static<typeof ProductTypeCreateSchema>
export type ProductTypeUpdate = Static<typeof ProductTypeUpdateSchema>

// --- Load ---
export const LoadAssignmentSchema = Type.Object({
  employeeId: Type.String(),
  clockIn: Type.String(),
  clockOut: Type.Union([Type.String(), Type.Null()]),
})
export const LoadSchema = Type.Object({
  id: Type.String(),
  ticketNumber: Type.Number(),
  date: Type.String(),
  locationId: Type.String(),
  customerId: Type.String(),
  productTypeId: Type.String(),
  doorNumber: Type.String(),
  containerNumber: Type.String(),
  vendor: Type.String(),
  poNumbers: Type.Array(Type.String()),
  sorts: Type.Number(),
  cases: Type.Number(),
  weight: Type.Number(),
  assignments: Type.Array(LoadAssignmentSchema),
  status: LoadStatusSchema,
  billedAmount: Type.Number(),
  payoutAmount: Type.Number(),
})
export const LoadCreateSchema = Type.Object({
  date: Type.String(),
  locationId: Type.String(),
  customerId: Type.String(),
  productTypeId: Type.String(),
  doorNumber: Type.String(),
  containerNumber: Type.String(),
  vendor: Type.String(),
  poNumbers: Type.Array(Type.String()),
  sorts: Type.Number(),
  cases: Type.Number(),
  weight: Type.Number(),
  assignments: Type.Array(LoadAssignmentSchema),
  status: Type.Optional(LoadStatusSchema),
})
export const LoadUpdateSchema = Type.Partial(LoadCreateSchema)
export type LoadCreate = Static<typeof LoadCreateSchema>
export type LoadUpdate = Static<typeof LoadUpdateSchema>

// --- System user ---
export const SystemUserSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String(),
  role: RoleSchema,
  locationId: Type.String(),
  status: RecordStatusSchema,
})
export const SystemUserCreateSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String(),
  role: RoleSchema,
  locationId: Type.String(),
  password: Type.Optional(Type.String()),
})
export type SystemUserCreate = Static<typeof SystemUserCreateSchema>
