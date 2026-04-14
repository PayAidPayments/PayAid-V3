import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'

const updateSchema = z.object({
  provider: z.enum(['none', 'twilio', 'exotel']).optional(),
  accountSid: z.string().min(1).nullable().optional(),
  authToken: z.string().min(1).nullable().optional(),
  apiKey: z.string().min(1).nullable().optional(),
  apiSecret: z.string().min(1).nullable().optional(),
  apiBaseUrl: z.string().url().nullable().optional(),
  fromNumber: z.string().min(1).nullable().optional(),
  webhookBaseUrl: z.string().url().nullable().optional(),
})

function getDiagnostics() {
  const key = process.env.ENCRYPTION_KEY?.trim() || ''
  const encryptionKeyFormatValid = key.length === 64 && /^[0-9a-fA-F]+$/.test(key)
  return {
    encryptionKeyConfigured: encryptionKeyFormatValid,
    encryptionKeyFormatValid,
  }
}

function computeConfigured(provider: string, fields: { accountSid?: string | null; authTokenPresent: boolean }) {
  if (provider === 'none') return false
  return Boolean(fields.accountSid && fields.authTokenPresent)
}

function getSignatureVerificationStatus(provider: string, authTokenPresent: boolean) {
  if (provider === 'none') return 'not_applicable' as const
  if (provider !== 'twilio') return 'provider_specific' as const
  return authTokenPresent ? 'active' as const : 'missing_secret' as const
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'view')

    const settings = await (prisma as any).tenantTelephonySettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    if (!settings) {
      return NextResponse.json({
        provider: 'none',
        accountSid: null,
        authToken: null,
        apiKey: null,
        apiSecret: null,
        apiBaseUrl: null,
        fromNumber: null,
        webhookBaseUrl: null,
        webhookVerification: {
          expectedWebhookUrl: `${origin.replace(/\/+$/, '')}/api/calls/webhook`,
          lastWebhookAt: null,
          lastWebhookProvider: null,
          lastWebhookCallSid: null,
          signatureVerification: 'not_applicable',
          lastSignatureValid: null,
        },
        isConfigured: false,
        lastTestAt: null,
        lastTestOk: null,
        lastTestError: null,
        diagnostics: getDiagnostics(),
      })
    }

    return NextResponse.json({
      provider: settings.provider,
      accountSid: settings.accountSid,
      authToken: settings.authTokenEnc ? '••••••••' : null,
      apiKey: settings.apiKey ? `${String(settings.apiKey).slice(0, 4)}••••` : null,
      apiSecret: settings.apiSecretEnc ? '••••••••' : null,
      apiBaseUrl: settings.apiBaseUrl,
      fromNumber: settings.fromNumber,
      webhookBaseUrl: settings.webhookBaseUrl,
      webhookVerification: {
        expectedWebhookUrl: `${String(settings.webhookBaseUrl || origin).replace(/\/+$/, '')}/api/calls/webhook`,
        lastWebhookAt: settings.lastWebhookAt?.toISOString?.() ?? null,
        lastWebhookProvider: settings.lastWebhookProvider ?? null,
        lastWebhookCallSid: settings.lastWebhookCallSid ?? null,
        signatureVerification: getSignatureVerificationStatus(settings.provider, Boolean(settings.authTokenEnc)),
        lastSignatureValid: settings.lastWebhookSignatureValid ?? null,
      },
      isConfigured: settings.isConfigured,
      lastTestAt: settings.lastTestAt?.toISOString?.() ?? settings.lastTestAt,
      lastTestOk: settings.lastTestOk ?? null,
      lastTestError: settings.lastTestError ?? null,
      diagnostics: getDiagnostics(),
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    console.error('Get telephony settings error:', error)
    return NextResponse.json({ error: 'Failed to get telephony settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const validated = updateSchema.parse(await request.json())
    const existing = await (prisma as any).tenantTelephonySettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    const updateData: any = {}
    if (validated.provider !== undefined) updateData.provider = validated.provider
    if (validated.accountSid !== undefined) updateData.accountSid = validated.accountSid
    if (validated.apiKey !== undefined) updateData.apiKey = validated.apiKey
    if (validated.apiBaseUrl !== undefined) updateData.apiBaseUrl = validated.apiBaseUrl
    if (validated.fromNumber !== undefined) updateData.fromNumber = validated.fromNumber
    if (validated.webhookBaseUrl !== undefined) updateData.webhookBaseUrl = validated.webhookBaseUrl
    if (validated.authToken !== undefined) {
      updateData.authTokenEnc = validated.authToken ? encrypt(validated.authToken) : null
    }
    if (validated.apiSecret !== undefined) {
      updateData.apiSecretEnc = validated.apiSecret ? encrypt(validated.apiSecret) : null
    }

    const provider = validated.provider ?? existing?.provider ?? 'none'
    const accountSid = validated.accountSid !== undefined ? validated.accountSid : existing?.accountSid
    const authTokenPresent =
      validated.authToken !== undefined ? Boolean(validated.authToken) : Boolean(existing?.authTokenEnc)
    updateData.isConfigured = computeConfigured(provider, { accountSid, authTokenPresent })

    const saved = existing
      ? await (prisma as any).tenantTelephonySettings.update({
          where: { tenantId: user.tenantId },
          data: updateData,
        })
      : await (prisma as any).tenantTelephonySettings.create({
          data: { tenantId: user.tenantId, ...updateData },
        })

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_telephony',
      entityId: user.tenantId,
      action: existing ? 'telephony_config_updated' : 'telephony_config_created',
      after: {
        provider: saved.provider,
        isConfigured: saved.isConfigured,
        accountSidConfigured: Boolean(saved.accountSid),
        authTokenConfigured: Boolean(saved.authTokenEnc),
        fromNumberConfigured: Boolean(saved.fromNumber),
        webhookBaseUrlConfigured: Boolean(saved.webhookBaseUrl),
      },
    })

    return NextResponse.json({
      provider: saved.provider,
      accountSid: saved.accountSid,
      authToken: saved.authTokenEnc ? '••••••••' : null,
      apiKey: saved.apiKey ? `${String(saved.apiKey).slice(0, 4)}••••` : null,
      apiSecret: saved.apiSecretEnc ? '••••••••' : null,
      apiBaseUrl: saved.apiBaseUrl,
      fromNumber: saved.fromNumber,
      webhookBaseUrl: saved.webhookBaseUrl,
      isConfigured: saved.isConfigured,
      lastTestAt: saved.lastTestAt?.toISOString?.() ?? saved.lastTestAt,
      lastTestOk: saved.lastTestOk ?? null,
      lastTestError: saved.lastTestError ?? null,
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
      return NextResponse.json({ error: 'Server encryption is not configured. Set ENCRYPTION_KEY and redeploy.' }, { status: 500 })
    }
    console.error('Update telephony settings error:', error)
    return NextResponse.json({ error: 'Failed to update telephony settings' }, { status: 500 })
  }
}

