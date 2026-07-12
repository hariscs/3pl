import { Type, type Static } from '@sinclair/typebox'
import { CheckInSchema } from './checkin'

/** Authenticated Lead identity. */
export const LeadSchema = Type.Object({
  id: Type.String(),
  loginId: Type.String(),
  name: Type.String(),
  role: Type.String(),
})
export type Lead = Static<typeof LeadSchema>

/** POST /lead/auth/login request body. */
export const LoginBodySchema = Type.Object({
  loginId: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 1 }),
})
export type LoginBody = Static<typeof LoginBodySchema>

/** POST /lead/auth/login response. */
export const LoginResponseSchema = Type.Object({
  token: Type.String(),
  lead: LeadSchema,
  activeCheckIn: Type.Union([CheckInSchema, Type.Null()]),
})
export type LoginResponse = Static<typeof LoginResponseSchema>

/** GET /lead/session response — used on app launch to restore state. */
export const SessionResponseSchema = Type.Object({
  lead: LeadSchema,
  activeCheckIn: Type.Union([CheckInSchema, Type.Null()]),
})
export type SessionResponse = Static<typeof SessionResponseSchema>
