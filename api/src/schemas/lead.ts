import { Type, type Static } from '@sinclair/typebox'

// Lead (mobile field-app) administration shapes. Mirrors web/src/lib/types.ts
// by hand. Never expose passwordHash.

export const LeadAssignmentSchema = Type.Object({
  locationId: Type.String(),
  role: Type.String(),
  shiftStart: Type.String(),
  shiftEnd: Type.String(),
  distanceMiles: Type.Union([Type.Number(), Type.Null()]),
})

export const LeadSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  role: Type.String(),
  createdAt: Type.String(),
  assignments: Type.Array(LeadAssignmentSchema),
})

export const LeadCreateSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ minLength: 1 }),
  role: Type.Optional(Type.String()),
  password: Type.String({ minLength: 1 }),
})

export const LeadUpdateSchema = Type.Partial(LeadCreateSchema)

export const LeadAssignmentInputSchema = Type.Object({
  locationId: Type.String(),
  role: Type.Optional(Type.String()),
  shiftStart: Type.Optional(Type.String()),
  shiftEnd: Type.Optional(Type.String()),
  distanceMiles: Type.Optional(Type.Number()),
})
export const LeadAssignmentsPutSchema = Type.Object({
  assignments: Type.Array(LeadAssignmentInputSchema),
})

export const LeadSelfAssignSchema = Type.Object({
  locationId: Type.String(),
})

export type LeadCreate = Static<typeof LeadCreateSchema>
export type LeadUpdate = Static<typeof LeadUpdateSchema>
export type LeadAssignmentsPut = Static<typeof LeadAssignmentsPutSchema>
export type LeadSelfAssign = Static<typeof LeadSelfAssignSchema>
