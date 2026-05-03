import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { z } from 'zod'

const endCallBodySchema = z.object({
  status: z.string().default('COMPLETED'),
  duration_seconds: z.number().int().nonnegative().optional(),
  disposition: z.string().optional(),
  summary: z.string().optional(),
})

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED', 'NO_ANSWER', 'BUSY']

/** POST /api/v1/calls/[id]/end — Mark a call as ended */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_voice')
    const { id: callId } = await params

    const call = await prisma.aICall.findFirst({
      where: { id: callId, tenantId },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (TERMINAL_STATUSES.includes(call.status.toUpperCase())) {
      return NextResponse.json(
        {
          error: `Call is already in a terminal state: ${call.status.toLowerCase()}`,
          current_status: call.status.toLowerCase(),
          code: 'INVALID_STATE_TRANSITION',
        },
        { status: 422 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const validated = endCallBodySchema.parse(body)

    const endedAt = new Date()
    const updated = await prisma.aICall.update({
      where: { id: callId },
      data: {
        status: validated.status.toUpperCase(),
        duration: validated.duration_seconds,
        endedAt,
        aiIntent: validated.disposition,
      },
      select: {
        id: true,
        phoneNumber: true,
        status: true,
        duration: true,
        contactId: true,
        dealId: true,
        startedAt: true,
        endedAt: true,
        aiIntent: true,
      },
    })

    // Non-fatal audit trail
    prisma.auditLog.create({
      data: {
        tenantId,
        entityType: 'call',
        entityId: callId,
        changedBy: userId ?? 'system',
        changeSummary: `call_ended:${updated.status.toLowerCase()}`,
        afterSnapshot: {
          status: updated.status.toLowerCase(),
          duration_seconds: updated.duration ?? null,
          disposition: updated.aiIntent ?? null,
          ended_at: updated.endedAt?.toISOString() ?? null,
           
        } as any,
      },
    }).catch(() => { /* non-fatal */ })

    return NextResponse.json({
      success: true,
      call: {
        id: updated.id,
        phone_number: updated.phoneNumber,
        status: updated.status.toLowerCase(),
        duration_seconds: updated.duration,
        contact_id: updated.contactId,
        deal_id: updated.dealId,
        disposition: updated.aiIntent,
        started_at: updated.startedAt,
        ended_at: updated.endedAt,
      },
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('End call error:', e)
    return NextResponse.json({ error: 'Failed to end call' }, { status: 500 })
  }
}
