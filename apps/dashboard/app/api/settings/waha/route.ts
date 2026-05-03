import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'

const updateSchema = z.object({
  baseUrl: z.string().url().nullable().optional(),
  apiKey: z.string().min(1).nullable().optional(),
  defaultInstance: z.string().min(1).nullable().optional(),
})

function getDiagnostics() {
  const key = process.env.ENCRYPTION_KEY?.trim() || ''
  const encryptionKeyFormatValid = key.length === 64 && /^[0-9a-fA-F]+$/.test(key)
  return {
    encryptionKeyConfigured: encryptionKeyFormatValid,
    encryptionKeyFormatValid,
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'view')

    const settings = await (prisma as any).tenantWahaSettings.findUnique({
      where: { tenantId: user.tenantId },
      select: {
        baseUrl: true,
        apiKeyEnc: true,
        defaultInstance: true,
        isConfigured: true,
        lastTestAt: true,
        lastTestOk: true,
        lastTestError: true,
        updatedAt: true,
      },
    })

    const [accountSummary] = await prisma.$queryRaw<
      Array<{ connected_count: bigint; last_event_at: Date | null }>
    >`
      SELECT
        COUNT(*) FILTER (
          WHERE wa."isActive" = true
            AND (
              wa."status" ILIKE 'active'
              OR wa."status" ILIKE 'connected'
              OR wa."status" ILIKE 'ready'
            )
        ) AS connected_count,
        MAX(COALESCE(ws."lastSeenAt", ws."lastSyncAt", wa."updatedAt")) AS last_event_at
      FROM "WhatsappAccount" wa
      LEFT JOIN "WhatsappSession" ws ON ws."accountId" = wa."id"
      WHERE wa."tenantId" = ${user.tenantId}
    `

    const connectedCount = Number(accountSummary?.connected_count || 0)
    const operationalConnected = connectedCount > 0
    const lastEventAt = accountSummary?.last_event_at ?? null

    if (!settings) {
      return NextResponse.json({
        baseUrl: null,
        apiKey: null,
        defaultInstance: null,
        isConfigured: false,
        operationalConnected,
        connectedAccounts: connectedCount,
        lastEventAt: lastEventAt ? lastEventAt.toISOString() : null,
        lastTestAt: null,
        lastTestOk: null,
        lastTestError: null,
        diagnostics: getDiagnostics(),
      })
    }

    return NextResponse.json({
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKeyEnc ? '••••••••' : null,
      defaultInstance: settings.defaultInstance,
      isConfigured: settings.isConfigured,
      operationalConnected,
      connectedAccounts: connectedCount,
      lastEventAt: lastEventAt ? lastEventAt.toISOString() : null,
      lastTestAt: settings.lastTestAt?.toISOString?.() ?? settings.lastTestAt,
      lastTestOk: settings.lastTestOk ?? null,
      lastTestError: settings.lastTestError ?? null,
      updatedAt: settings.updatedAt?.toISOString?.() ?? settings.updatedAt,
      diagnostics: getDiagnostics(),
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    console.error('Get WAHA settings error:', error)
    return NextResponse.json({ error: 'Failed to get WAHA settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const validated = updateSchema.parse(await request.json())

    const existing = await (prisma as any).tenantWahaSettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    const updateData: any = {}
    if (validated.baseUrl !== undefined) updateData.baseUrl = validated.baseUrl
    if (validated.defaultInstance !== undefined) updateData.defaultInstance = validated.defaultInstance
    if (validated.apiKey !== undefined) updateData.apiKeyEnc = validated.apiKey ? encrypt(validated.apiKey) : null

    const effectiveBaseUrl = validated.baseUrl !== undefined ? validated.baseUrl : existing?.baseUrl
    const effectiveKeyPresent =
      validated.apiKey !== undefined ? Boolean(validated.apiKey) : Boolean(existing?.apiKeyEnc)
    updateData.isConfigured = Boolean(effectiveBaseUrl && effectiveKeyPresent)

    const saved = existing
      ? await (prisma as any).tenantWahaSettings.update({
          where: { tenantId: user.tenantId },
          data: updateData,
        })
      : await (prisma as any).tenantWahaSettings.create({
          data: { tenantId: user.tenantId, ...updateData },
        })

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_waha',
      entityId: user.tenantId,
      action: existing ? 'waha_config_updated' : 'waha_config_created',
      after: {
        isConfigured: saved.isConfigured,
        baseUrlConfigured: Boolean(saved.baseUrl),
        apiKeyConfigured: Boolean(saved.apiKeyEnc),
        defaultInstanceConfigured: Boolean(saved.defaultInstance),
      },
    })

    return NextResponse.json({
      baseUrl: saved.baseUrl,
      apiKey: saved.apiKeyEnc ? '••••••••' : null,
      defaultInstance: saved.defaultInstance,
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
      return NextResponse.json(
        { error: 'Server encryption is not configured. Set ENCRYPTION_KEY and redeploy.' },
        { status: 500 }
      )
    }
    console.error('Update WAHA settings error:', error)
    return NextResponse.json({ error: 'Failed to update WAHA settings' }, { status: 500 })
  }
}

