import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { trackEvent } from '@/lib/analytics/track'
import { z } from 'zod'

const approveBodySchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  approver_note: z.string().optional(),
  reason: z.string().optional(),
})

const NON_APPROVABLE_STATUSES = ['converted', 'void']

/**
 * POST /api/v1/quotes/[id]/approve
 * Approve or reject a quote. Records decision to AuditLog.
 * Returns 422 INVALID_STATE_TRANSITION if the quote is already converted or void.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_cpq')
    const { id: quoteId } = await params
    const body = await request.json()
    const validated = approveBodySchema.parse(body)

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
      select: { id: true, status: true, quoteNumber: true },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (NON_APPROVABLE_STATUSES.includes(quote.status)) {
      return NextResponse.json(
        {
          error: `Cannot approve/reject a quote with status '${quote.status}'`,
          current_status: quote.status,
          code: 'INVALID_STATE_TRANSITION',
        },
        { status: 422 }
      )
    }

    const newStatus = validated.decision === 'approved' ? 'accepted' : 'rejected'

    const updated = await prisma.quote.update({
      where: { id: quoteId },
      data: { status: newStatus },
      select: { id: true, quoteNumber: true, status: true },
    })

    // Audit trail — non-fatal
    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          entityType: 'quote',
          entityId: quoteId,
          changedBy: userId || 'system',
          changeSummary: `Quote ${validated.decision}: ${validated.approver_note ?? validated.reason ?? ''}`,
          afterSnapshot: {
            decision: validated.decision,
            approver_note: validated.approver_note,
            reason: validated.reason,
            new_status: newStatus,
          },
        },
      })
    } catch { /* non-fatal */ }

    trackEvent(validated.decision === 'approved' ? 'quote_approved' : 'quote_rejected', {
      tenantId,
      userId,
      entityId: quoteId,
      properties: { quote_number: updated.quoteNumber, new_status: newStatus },
    })

    return NextResponse.json({
      success: true,
      quote: {
        id: updated.id,
        quote_number: updated.quoteNumber,
        decision: validated.decision,
        status: updated.status,
        approver_note: validated.approver_note,
        reason: validated.reason,
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
    console.error('Approve quote error:', e)
    return NextResponse.json({ error: 'Failed to approve quote' }, { status: 500 })
  }
}
