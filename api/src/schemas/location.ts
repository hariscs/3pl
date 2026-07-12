import { Type, type Static } from '@sinclair/typebox'
import { AddressSchema } from './shared'

/** A location card shown on the "Where are you working today?" check-in screen. */
export const LocationCardSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  code: Type.String(),
  group: Type.Union([Type.String(), Type.Null()]),
  address: AddressSchema,
  fullAddress: Type.String(),
  distanceMiles: Type.Union([Type.Number(), Type.Null()]),
  assigned: Type.Boolean(),
  lastVisitedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
  status: Type.String(),
})
export type LocationCard = Static<typeof LocationCardSchema>

export const LocationCardListSchema = Type.Object({
  locations: Type.Array(LocationCardSchema),
})
export type LocationCardList = Static<typeof LocationCardListSchema>
