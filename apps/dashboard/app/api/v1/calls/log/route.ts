import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { z } from 'zod'

const logCallBodySchema = z.object({
  phone_number: z.string().min(1, 'phone_number is required'),
  direction: z.enum(['INBOUND', 'OUTBOUND']).default('INBOUND'),
  status: z.string().default('COMPLETED'),
  duration_seconds: z.number().int().nonnegative().optional(),
  contact_id: z.string().optional(),
  deal_id: z.string().optional(),
  lead_id: z.string().optional(),
  recording_url: z.string().url().optional(),
  summary: z.string().optional(),
})

/**
 * POST /api/v1/calls/log — Log a completed call with optional CRM linkage.
 * Used by voice providers to record call metadata after the call ends.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_voice')
    const body = await request.json()
    const validated = logCallBodySchema.parse(body)

    const endedAt = new Date()
    const startedAt = validated.duration_seconds
      ? new Date(endedAt.getTime() - validated.duration_seconds * 1000)
      : endedAt

    const call = await prisma.aICall.create({
      data: {
        tenantId,
        phoneNumber: validated.phone_number,
        direction: validated.direction,
        status: validated.status.toUpperCase(),
        handledByAI: false,
        contactId: validated.contact_id,
        dealId: validated.deal_id,
        leadId: validated.lead_id,
        duration: validated.duration_seconds,
        startedAt,
        endedAt,
      },
      select: {
        id: true,
        phoneNumber: true,
        direction: true,
        status: true,
        duration: true,
        contactId: true,
        dealId: true,
        leadId: true,
        startedAt: true,
        endedAt: true,
      },
    })

    // Non-fatal audit trail
    prisma.auditLog.create({
      data: {
        tenantId,
        entityType: 'call',
        entityId: call.id,
        changedBy: userId ?? 'system',
        changeSummary: `call_logged:${call.status.toLowerCase()}`,
        afterSnapshot: {
          phone_number: validated.phone_number,
          direction: validated.direction,
          status: validated.status,
          duration_seconds: validated.duration_seconds ?? null,
          contact_id: validated.contact_id ?? null,
          deal_id: validated.deal_id ?? null,
           
        } as any,
      },
    }).catch(() => { /* non-fatal */ })

    return NextResponse.json(
      {
        success: true,
        call: {
          id: call.id,
          phone_number: call.phoneNumber,
          direction: call.direction.toLowerCase(),
          status: call.status.toLowerCase(),
          duration_seconds: call.duration,
          contact_id: call.contactId,
          deal_id: call.dealId,
          lead_id: call.leadId,
          started_at: call.startedAt,
          ended_at: call.endedAt,
        },
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('Log call error:', e)
    return NextResponse.json({ error: 'Failed to log call' }, { status: 500 })
  }
}
