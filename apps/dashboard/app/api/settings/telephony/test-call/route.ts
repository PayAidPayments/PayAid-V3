import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { captureIntegrationError, enforceIntegrationRateLimit } from '@/lib/integrations/security'

const bodySchema = z.object({
  toPhone: z.string().min(8).max(20),
})

/**
 * Safe dry-run test call endpoint.
 * No outbound provider call is made; this validates config and records an audit trail.
 */
export async function POST(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:telephony:test-call',
    limit: 5,
    windowMs: 60_000,
  })
  if (limited) return limited

  let actor: { tenantId: string; userId: string | null | undefined } | null = null

  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    actor = { tenantId: user.tenantId, userId: user.userId }
    await assertIntegrationPermission(request, 'configure')

    const { toPhone } = bodySchema.parse(await request.json())
    const settings = await (prisma as any).tenantTelephonySettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    if (!settings?.isConfigured) {
      return NextResponse.json({ error: 'Telephony is not configured' }, { status: 400 })
    }

    const simulatedCall = await prisma.aICall.create({
      data: {
        tenantId: user.tenantId,
        phoneNumber: toPhone,
        direction: 'OUTBOUND',
        status: 'RINGING',
        handledByAI: true,
      },
      select: {
        id: true,
        phoneNumber: true,
        status: true,
        direction: true,
        startedAt: true,
      },
    })

    await prisma.auditLog
      .create({
        data: {
          tenantId: user.tenantId,
          entityType: 'telephony_test_call',
          entityId: simulatedCall.id,
          changedBy: user.userId || 'system',
          changeSummary: `dry_run_test_call:${settings.provider}`,
          afterSnapshot: {
            provider: settings.provider,
            to_phone: toPhone,
            call_id: simulatedCall.id,
            mode: 'dry_run',
          } as any,
        },
      })
      .catch(() => undefined)

    return NextResponse.json({
      ok: true,
      dryRun: true,
      message: 'Dry-run test call validated and logged. No outbound provider call was made.',
      call: {
        id: simulatedCall.id,
        phone_number: simulatedCall.phoneNumber,
        status: simulatedCall.status,
        direction: simulatedCall.direction,
        started_at: simulatedCall.startedAt,
      },
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    await captureIntegrationError({
      scope: 'telephony_test_call',
      tenantId: actor?.tenantId,
      userId: actor?.userId,
      error,
    })
    return NextResponse.json(
      { error: 'Failed to run dry-run test call' },
      { status: 500 }
    )
  }
}

