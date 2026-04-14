import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { trackEvent } from '@/lib/analytics/track'
import { z } from 'zod'

const ENTITY_TYPE = 'ai_decision'

const overrideBodySchema = z.object({
  outcome: z.enum(['accepted', 'rejected', 'overridden']),
  override_reason: z.string().min(1, 'override_reason is required').max(1000),
})

/**
 * POST /api/v1/ai/decisions/[id]/override
 *
 * Record a human override of an AI decision.
 * Creates a new AuditLog entry capturing the override actor, reason, and outcome.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Verify the original decision exists and belongs to this tenant
    const original = await prisma.auditLog.findFirst({
      where: { id: params.id, tenantId, entityType: ENTITY_TYPE },
      select: { id: true, entityId: true, afterSnapshot: true, timestamp: true },
    })

    if (!original) {
      return NextResponse.json({ error: 'AI decision not found', id: params.id }, { status: 404 })
    }

    const origSnap = original.afterSnapshot as Record<string, unknown> | null
    const currentOutcome = origSnap?.outcome as string | undefined
    if (currentOutcome === 'overridden') {
      return NextResponse.json(
        { error: 'Decision has already been overridden', id: params.id, code: 'ALREADY_OVERRIDDEN' },
        { status: 422 }
      )
    }

    const body = await request.json()
    const validated = overrideBodySchema.parse(body)

    // Write override audit record (non-fatal Prisma create for the original update,
    // plus a separate override event record)
    const overrideRecord = await prisma.auditLog.create({
      data: {
        tenantId,
        entityType: 'ai_decision_override',
        entityId: params.id,
        changedBy: userId ?? 'system',
        changeSummary: `ai_decision_${validated.outcome}`,
        beforeSnapshot: { original_outcome: currentOutcome ?? 'pending' } as any,
        afterSnapshot: {
          decision_id: params.id,
          original_entity_id: original.entityId,
          outcome: validated.outcome,
          override_reason: validated.override_reason,
          overridden_by: userId ?? 'system',
          overridden_at: new Date().toISOString(),
          original_decision_type: origSnap?.type ?? 'unknown',
          original_confidence: origSnap?.confidence ?? null,
        } as any,
      },
      select: { id: true, timestamp: true },
    })

    // Track product analytics
    trackEvent('sdr_run_stopped', {
      tenantId,
      userId,
      entityId: params.id,
      properties: {
        outcome: validated.outcome,
        original_type: origSnap?.type ?? 'unknown',
      },
    })

    return NextResponse.json(
      {
        success: true,
        override: {
          id: overrideRecord.id,
          decision_id: params.id,
          outcome: validated.outcome,
          override_reason: validated.override_reason,
          overridden_by: userId ?? 'system',
          overridden_at: overrideRecord.timestamp,
        },
      },
      { status: 201 }
    )
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('AI decision override error:', e)
    return NextResponse.json({ error: 'Failed to record AI decision override' }, { status: 500 })
  }
}
