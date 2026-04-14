import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'

const updateSmtpSchema = z.object({
  host: z.string().min(1).nullable().optional(),
  port: z.number().int().min(1).max(65535).nullable().optional(),
  username: z.string().min(1).nullable().optional(),
  password: z.string().min(1).nullable().optional(),
  fromName: z.string().min(1).nullable().optional(),
  fromEmail: z.string().email().nullable().optional(),
  useTls: z.boolean().optional(),
})

function deriveDomain(emailOrUser: string | null | undefined) {
  if (!emailOrUser) return null
  const at = emailOrUser.indexOf('@')
  if (at <= 0) return null
  return emailOrUser.slice(at + 1).toLowerCase()
}

function getDiagnostics() {
  const key = process.env.ENCRYPTION_KEY?.trim() || ''
  const encryptionKeyFormatValid = key.length === 64 && /^[0-9a-fA-F]+$/.test(key)
  return {
    encryptionKeyConfigured: encryptionKeyFormatValid,
    encryptionKeyFormatValid,
  }
}

/**
 * GET /api/settings/smtp
 * Get tenant SMTP settings (password is never returned; only masked presence).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'view')

    const settings = await (prisma as any).tenantSmtpSettings.findUnique({
      where: { tenantId: user.tenantId },
      select: {
        host: true,
        port: true,
        username: true,
        passwordEnc: true,
        fromName: true,
        fromEmail: true,
        useTls: true,
        isConfigured: true,
        updatedAt: true,
      },
    })

    if (!settings) {
      return NextResponse.json({
        host: null,
        port: 587,
        username: null,
        password: null,
        fromName: null,
        fromEmail: null,
        useTls: true,
        isConfigured: false,
        diagnostics: getDiagnostics(),
      })
    }

    return NextResponse.json({
      host: settings.host,
      port: settings.port,
      username: settings.username,
      password: settings.passwordEnc ? '••••••••' : null,
      fromName: settings.fromName,
      fromEmail: settings.fromEmail,
      useTls: settings.useTls,
      isConfigured: settings.isConfigured,
      updatedAt: settings.updatedAt?.toISOString?.() ?? settings.updatedAt,
      diagnostics: getDiagnostics(),
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    console.error('Get SMTP settings error:', error)
    return NextResponse.json({ error: 'Failed to get SMTP settings' }, { status: 500 })
  }
}

/**
 * PATCH /api/settings/smtp
 * Update tenant SMTP settings (password is encrypted at rest).
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const body = await request.json()
    const validated = updateSmtpSchema.parse(body)

    const existing = await (prisma as any).tenantSmtpSettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    const updateData: any = {}

    if (validated.host !== undefined) updateData.host = validated.host
    if (validated.port !== undefined) updateData.port = validated.port ?? 587
    if (validated.username !== undefined) updateData.username = validated.username
    if (validated.fromName !== undefined) updateData.fromName = validated.fromName
    if (validated.fromEmail !== undefined) updateData.fromEmail = validated.fromEmail
    if (validated.useTls !== undefined) updateData.useTls = validated.useTls

    if (validated.password !== undefined) {
      updateData.passwordEnc = validated.password ? encrypt(validated.password) : null
    }

    // Basic sender policy: if both are emails, enforce same domain (reduces spoofing/misconfig).
    const effectiveFromEmail = validated.fromEmail !== undefined ? validated.fromEmail : existing?.fromEmail
    const effectiveUsername = validated.username !== undefined ? validated.username : existing?.username
    const fromDomain = deriveDomain(effectiveFromEmail)
    const userDomain = deriveDomain(effectiveUsername)
    if (fromDomain && userDomain && fromDomain !== userDomain) {
      return NextResponse.json(
        { error: 'From email domain must match SMTP username domain.' },
        { status: 400 }
      )
    }

    const effectiveHost = validated.host !== undefined ? validated.host : existing?.host
    const effectiveUser = validated.username !== undefined ? validated.username : existing?.username
    const effectivePass =
      validated.password !== undefined ? (validated.password ? true : false) : Boolean(existing?.passwordEnc)

    updateData.isConfigured = Boolean(effectiveHost && effectiveUser && effectivePass)

    const saved = existing
      ? await (prisma as any).tenantSmtpSettings.update({
          where: { tenantId: user.tenantId },
          data: updateData,
        })
      : await (prisma as any).tenantSmtpSettings.create({
          data: { tenantId: user.tenantId, ...updateData },
        })

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_smtp',
      entityId: user.tenantId,
      action: existing ? 'smtp_config_updated' : 'smtp_config_created',
      after: {
        isConfigured: saved.isConfigured,
        hostConfigured: Boolean(saved.host),
        usernameConfigured: Boolean(saved.username),
        fromEmailConfigured: Boolean(saved.fromEmail),
        useTls: saved.useTls,
      },
    })

    return NextResponse.json({
      host: saved.host,
      port: saved.port,
      username: saved.username,
      password: saved.passwordEnc ? '••••••••' : null,
      fromName: saved.fromName,
      fromEmail: saved.fromEmail,
      useTls: saved.useTls,
      isConfigured: saved.isConfigured,
      updatedAt: saved.updatedAt?.toISOString?.() ?? saved.updatedAt,
      diagnostics: getDiagnostics(),
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json(
        {
          error:
            'Server encryption is not configured. Set a valid ENCRYPTION_KEY (64-char hex) in environment variables and redeploy.',
        },
        { status: 500 }
      )
    }
    if (message.includes('Invalid encrypted data format')) {
      return NextResponse.json(
        { error: 'Stored SMTP secret format is invalid. Re-enter SMTP password and save again.' },
        { status: 400 }
      )
    }

    console.error('Update SMTP settings error:', error)
    return NextResponse.json({ error: 'Failed to update SMTP settings' }, { status: 500 })
  }
}

