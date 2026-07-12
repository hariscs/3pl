import { Type, type Static } from '@sinclair/typebox'

/** Structured postal address. */
export const AddressSchema = Type.Object({
  line1: Type.String(),
  city: Type.String(),
  state: Type.String(),
  postalCode: Type.String(),
})
export type Address = Static<typeof AddressSchema>

/** Per-location container input configuration. */
export const ContainerFieldsSchema = Type.Object({
  containerNumberRequired: Type.Boolean(),
  casesRequired: Type.Boolean(),
  weightRequired: Type.Boolean(),
  sortsRequired: Type.Boolean(),
  notesEnabled: Type.Boolean(),
  photosEnabled: Type.Boolean(),
})
export type ContainerFields = Static<typeof ContainerFieldsSchema>

/** Per-location Lead permissions. */
export const PermissionsSchema = Type.Object({
  canStartLoad: Type.Boolean(),
  canCloseLoad: Type.Boolean(),
  canEditLoad: Type.Boolean(),
  canClockEmployees: Type.Boolean(),
  canViewPayRates: Type.Boolean(),
  canViewBillingRates: Type.Boolean(),
})
export type Permissions = Static<typeof PermissionsSchema>

/** Per-location feature flags. */
export const FeatureFlagsSchema = Type.Object({
  photoCapture: Type.Boolean(),
  breakTracking: Type.Boolean(),
  offlineMode: Type.Boolean(),
})
export type FeatureFlags = Static<typeof FeatureFlagsSchema>

/** Standard error envelope (matches @fastify/sensible output). */
export const ErrorResponseSchema = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.String(),
})
export type ErrorResponse = Static<typeof ErrorResponseSchema>
