import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { trackEvent } from '@/lib/analytics/track'

const VALID_REPLY_STATUSES = ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'BOUNCED'] as const
type ReplyStatus = (typeof VALID_REPLY_STATUSES)[number]

const bodySchema = z.object({
  reply_status: z.enum(VALID_REPLY_STATUSES),
  replied_at: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
})

type Params = { params: { id: string; enrollmentId: string } }

/**
 * PATCH /api/v1/sequences/[id]/enrollments/[enrollmentId]/reply
 *
 * Records the reply status for a sequence enrollment (WorkflowExecution).
 * Used to compute the sequence enrollment-to-positive-reply conversion KPI.
 *
 * reply_status: POSITIVE | NEGATIVE | NEUTRAL | BOUNCED
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    await assertAnyPermission(request, ['crm:sequence:write', 'crm:admin'])

    const body = await request.json()
    const validated = bodySchema.parse(body)

    // Confirm the enrollment belongs to this tenant and the given sequence
    const enrollment = await prisma.workflowExecution.findFirst({
      where: {
        id: params.enrollmentId,
        tenantId,
        workflowId: params.id,
      },
      select: { id: true, workflowId: true, replyStatus: true },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const repliedAt = validated.replied_at ? new Date(validated.replied_at) : new Date()

    const updated = await prisma.workflowExecution.update({
      where: { id: enrollment.id },
      data: {
        replyStatus: validated.reply_status,
        repliedAt,
      },
      select: { id: true, replyStatus: true, repliedAt: true, workflowId: true, status: true },
    })

    // Audit trail
    prisma.auditLog
      .create({
        data: {
          tenantId,
          entityType: 'sequence_enrollment',
          entityId: enrollment.id,
          changedBy: userId ?? 'system',
          changeSummary: `enrollment_reply_recorded:${validated.reply_status.toLowerCase()}`,
           
          afterSnapshot: {
            enrollment_id: enrollment.id,
            sequence_id: params.id,
            reply_status: validated.reply_status,
            replied_at: repliedAt.toISOString(),
            previous_reply_status: enrollment.replyStatus ?? null,
            notes: validated.notes ?? null,
          } as any,
        },
      })
      .catch(() => {})

    trackEvent('sequence_reply_recorded', {
      tenantId,
      userId,
      entityId: enrollment.id,
      properties: {
        sequence_id: params.id,
        reply_status: validated.reply_status,
        is_positive: validated.reply_status === 'POSITIVE',
      },
    })

    return NextResponse.json({
      enrollment_id: updated.id,
      sequence_id: updated.workflowId,
      reply_status: updated.replyStatus as ReplyStatus,
      replied_at: updated.repliedAt?.toISOString() ?? null,
      status: updated.status,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: error.message, code: 'PERMISSION_DENIED' }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Failed to record reply'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
