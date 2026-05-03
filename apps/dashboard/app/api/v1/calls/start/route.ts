import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { trackEvent } from '@/lib/analytics/track'
import { z } from 'zod'

const startCallBodySchema = z.object({
  phone_number: z.string().min(1, 'phone_number is required'),
  direction: z.enum(['INBOUND', 'OUTBOUND']).default('OUTBOUND'),
  contact_id: z.string().optional(),
  deal_id: z.string().optional(),
  lead_id: z.string().optional(),
})

/** POST /api/v1/calls/start — Initiate a new outbound/inbound call */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_voice')
    const body = await request.json()
    const validated = startCallBodySchema.parse(body)

    const call = await prisma.aICall.create({
      data: {
        tenantId,
        phoneNumber: validated.phone_number,
        direction: validated.direction,
        status: 'RINGING',
        handledByAI: true,
        contactId: validated.contact_id,
        dealId: validated.deal_id,
        leadId: validated.lead_id,
      },
      select: {
        id: true,
        phoneNumber: true,
        direction: true,
        status: true,
        contactId: true,
        dealId: true,
        leadId: true,
        startedAt: true,
      },
    })

    // Product analytics + audit trail (both non-fatal)
    trackEvent('call_started', {
      tenantId,
      userId,
      entityId: call.id,
      properties: {
        direction: validated.direction,
        has_contact: !!validated.contact_id,
        has_deal: !!validated.deal_id,
      },
    })

    prisma.auditLog.create({
      data: {
        tenantId,
        entityType: 'call',
        entityId: call.id,
        changedBy: userId ?? 'system',
        changeSummary: `call_started:${validated.direction.toLowerCase()}`,
        afterSnapshot: {
          phone_number: validated.phone_number,
          direction: validated.direction,
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
          contact_id: call.contactId,
          deal_id: call.dealId,
          lead_id: call.leadId,
          started_at: call.startedAt,
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
    console.error('Start call error:', e)
    return NextResponse.json({ error: 'Failed to start call' }, { status: 500 })
  }
}
