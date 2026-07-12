import { Type, type Static } from '@sinclair/typebox'

export const CheckInStatusSchema = Type.Union([
  Type.Literal('active'),
  Type.Literal('completed'),
])

/** A location check-in record. */
export const CheckInSchema = Type.Object({
  checkInId: Type.String(),
  leadId: Type.String(),
  locationId: Type.String(),
  status: CheckInStatusSchema,
  deviceId: Type.Union([Type.String(), Type.Null()]),
  checkedInAt: Type.String({ format: 'date-time' }),
  checkedOutAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
})
export type CheckIn = Static<typeof CheckInSchema>

/** POST /lead/check-ins request body. */
export const CreateCheckInBodySchema = Type.Object({
  locationId: Type.String(),
  deviceId: Type.Optional(Type.String()),
  checkedInAt: Type.Optional(Type.String({ format: 'date-time' })),
})
export type CreateCheckInBody = Static<typeof CreateCheckInBodySchema>
