import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import type { Lead } from '@prisma/client'
import type { LeadTokenPayload } from '../plugins/auth'

const REFRESH_TOKEN_BYTES = 32

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex')

// Parses the compact duration strings used in config (e.g. "1h", "30d").
function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim())
  if (!match) throw new Error(`Invalid duration: ${value}`)
  const amount = Number(match[1])
  const factor =
    match[2] === 's'
      ? 1_000
      : match[2] === 'm'
        ? 60_000
        : match[2] === 'h'
          ? 3_600_000
          : 86_400_000
  return amount * factor
}

/**
 * Signs a short-lived access JWT and persists a long-lived opaque refresh
 * token (stored only as a SHA-256 hash). Returns both to hand to the client.
 */
export async function issueTokens(fastify: FastifyInstance, lead: Lead) {
  const payload: LeadTokenPayload = {
    sub: lead.id,
    email: lead.email,
    name: lead.name,
    role: lead.role,
    realm: 'lead',
  }
  const accessToken = fastify.jwt.sign(payload, {
    expiresIn: fastify.config.JWT_ACCESS_EXPIRES_IN,
  })

  const refreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex')
  const expiresAt = new Date(
    Date.now() + parseDurationMs(fastify.config.JWT_REFRESH_EXPIRES_IN)
  )
  await fastify.prisma.refreshToken.create({
    data: { tokenHash: hashToken(refreshToken), leadId: lead.id, expiresAt },
  })

  return { accessToken, refreshToken }
}

/**
 * Validates a presented refresh token and rotates it: the old token is revoked
 * (single-use) and a fresh access/refresh pair is issued. Throws 401 if the
 * token is unknown, revoked, or expired.
 */
export async function rotateRefreshToken(
  fastify: FastifyInstance,
  presented: string
) {
  const existing = await fastify.prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presented) },
    include: { lead: true },
  })
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw fastify.httpErrors.unauthorized('Invalid or expired refresh token.')
  }

  await fastify.prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  })
  return issueTokens(fastify, existing.lead)
}

/** Revokes the presented refresh token (logout). No-op if already gone. */
export async function revokeRefreshToken(
  fastify: FastifyInstance,
  presented: string
) {
  await fastify.prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(presented), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
