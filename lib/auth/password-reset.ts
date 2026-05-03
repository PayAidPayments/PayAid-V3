import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/db/prisma'

const PASSWORD_RESET_TTL_MINUTES = 30
const RESET_DECISION_PREFIX = 'password-reset:'
const ADMIN_ONCE_PREFIX = 'admin-once-reset:'

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function buildDecisionId(userId: string): string {
  return `${RESET_DECISION_PREFIX}${userId}`
}

export function generateRawResetToken(): string {
  return randomBytes(32).toString('hex')
}

export function getPasswordResetExpiryDate(): Date {
  return new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000)
}

export async function createPasswordResetTokenForUser(userId: string): Promise<string> {
  const rawToken = generateRawResetToken()
  const tokenHash = sha256(rawToken)
  const expiresAt = getPasswordResetExpiryDate()
  const decisionId = buildDecisionId(userId)
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.approvalToken.updateMany({
      where: {
        userId,
        decisionId,
        used: false,
      },
      data: {
        used: true,
        usedAt: now,
      },
    })

    await tx.approvalToken.create({
      data: {
        decisionId,
        userId,
        token: tokenHash,
        expiresAt,
      },
    })
  })

  return rawToken
}

export async function consumePasswordResetToken(rawToken: string): Promise<{ userId: string }> {
  const token = rawToken.trim()
  if (!token) {
    throw new Error('Invalid reset token')
  }

  const tokenHash = sha256(token)
  const now = new Date()

  const resetToken = await prisma.$transaction(async (tx) => {
    const found = await tx.approvalToken.findUnique({
      where: { token: tokenHash },
      select: {
        id: true,
        userId: true,
        decisionId: true,
        used: true,
        expiresAt: true,
      },
    })

    if (!found || !found.decisionId.startsWith(RESET_DECISION_PREFIX)) {
      return null
    }
    if (found.used || found.expiresAt <= now) {
      return null
    }

    await tx.approvalToken.update({
      where: { id: found.id },
      data: {
        used: true,
        usedAt: now,
      },
    })

    return found
  })

  if (!resetToken) {
    throw new Error('Reset token is invalid or expired')
  }

  return { userId: resetToken.userId }
}

export async function markAdminOneTimeKeyAsUsed(
  tenantScope: string,
  oneTimeKey: string
): Promise<boolean> {
  const tokenHash = sha256(oneTimeKey.trim())
  const decisionId = `${ADMIN_ONCE_PREFIX}${tenantScope}`
  const now = new Date()

  try {
    await prisma.approvalToken.create({
      data: {
        decisionId,
        userId: tenantScope,
        token: tokenHash,
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        used: true,
        usedAt: now,
      },
    })
    return true
  } catch {
    return false
  }
}

