import type { CheckIn as PrismaCheckIn, Lead as PrismaLead } from '@prisma/client'
import type { CheckIn } from '../schemas/checkin'
import type { LeadUser } from '../schemas/auth'
import type {
  ContainerFields,
  FeatureFlags,
  Permissions,
} from '../schemas/shared'

/** Maps a Prisma Lead row to the authenticated-user response shape. */
export function toLeadUser(row: PrismaLead): LeadUser {
  return {
    id: row.id,
    fullName: row.name,
    email: row.email,
    role: row.role,
  }
}

/** Maps a Prisma CheckIn row to the API response shape. */
export function toCheckIn(row: PrismaCheckIn): CheckIn {
  return {
    checkInId: row.id,
    leadId: row.leadId,
    locationId: row.locationId,
    status: row.status,
    deviceId: row.deviceId ?? null,
    checkedInAt: row.checkedInAt.toISOString(),
    checkedOutAt: row.checkedOutAt ? row.checkedOutAt.toISOString() : null,
  }
}

// Prisma stores per-location config as Json. We own the write path (seed), and
// the response serializer re-validates the shape, so these narrow the JsonValue
// to the structured types without using `any`.
export const asContainerFields = (value: unknown): ContainerFields =>
  value as ContainerFields
export const asPermissions = (value: unknown): Permissions =>
  value as Permissions
export const asFeatureFlags = (value: unknown): FeatureFlags =>
  value as FeatureFlags
