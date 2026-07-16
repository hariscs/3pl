import { Type, type Static } from '@sinclair/typebox'
import { CheckInSchema } from './checkin'
import { SystemUserSchema } from './domain'

/** Authenticated Lead identity, shaped as the mobile app expects. */
export const LeadUserSchema = Type.Object({
  id: Type.String(),
  fullName: Type.String(),
  email: Type.String(),
  role: Type.String(),
})
export type LeadUser = Static<typeof LeadUserSchema>

/** POST /lead/auth/login request body. */
export const LoginBodySchema = Type.Object({
  email: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 1 }),
})
export type LoginBody = Static<typeof LoginBodySchema>

/** POST /lead/auth/login response. */
export const LoginResponseSchema = Type.Object({
  user: LeadUserSchema,
  accessToken: Type.String(),
  refreshToken: Type.String(),
  activeCheckIn: Type.Union([CheckInSchema, Type.Null()]),
})
export type LoginResponse = Static<typeof LoginResponseSchema>

/** POST /lead/auth/refresh request body. */
export const RefreshBodySchema = Type.Object({
  refreshToken: Type.String({ minLength: 1 }),
})
export type RefreshBody = Static<typeof RefreshBodySchema>

/** POST /lead/auth/refresh response — a rotated access/refresh pair. */
export const RefreshResponseSchema = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
})
export type RefreshResponse = Static<typeof RefreshResponseSchema>

/** POST /lead/auth/logout request body. */
export const LogoutBodySchema = Type.Object({
  refreshToken: Type.String({ minLength: 1 }),
})
export type LogoutBody = Static<typeof LogoutBodySchema>

// ---------------------------------------------------------------------------
// Dockmaster back-office (SystemUser) auth
// ---------------------------------------------------------------------------

/** POST /auth/login request body (dashboard system users log in by email). */
export const SystemUserLoginBodySchema = Type.Object({
  email: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 1 }),
})
export type SystemUserLoginBody = Static<typeof SystemUserLoginBodySchema>

/** POST /auth/login response. */
export const SystemUserLoginResponseSchema = Type.Object({
  token: Type.String(),
  user: SystemUserSchema,
})
export type SystemUserLoginResponse = Static<typeof SystemUserLoginResponseSchema>

/** GET /lead/session response — used on app launch to restore state. */
export const SessionResponseSchema = Type.Object({
  user: LeadUserSchema,
  activeCheckIn: Type.Union([CheckInSchema, Type.Null()]),
})
export type SessionResponse = Static<typeof SessionResponseSchema>
