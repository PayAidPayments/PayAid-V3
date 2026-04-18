import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { trackEvent } from '@/lib/analytics/track'

const BLOCKED_SEND_STATUSES = new Set(['rejected', 'converted', 'void'])

function policyRequiresApproval(total: number, subtotal: number, discount: number): boolean {
  const discPct = subtotal > 0 ? (discount / subtotal) * 100 : 0
  return total > 250_000 || discPct > 15
}

/**
 * POST /api/v1/quotes/[id]/send — Mark quote as sent when policy allows.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_cpq')
    const { id: quoteId } = await params

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
      select: {
        id: true,
        quoteNumber: true,
        status: true,
        subtotal: true,
        discount: true,
        total: true,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (BLOCKED_SEND_STATUSES.has(quote.status)) {
      return NextResponse.json(
        {
          error: `Cannot send quote in status '${quote.status}'`,
          code: 'INVALID_STATE_TRANSITION',
        },
        { status: 422 }
      )
    }

    if (quote.status === 'sent') {
      return NextResponse.json({
        success: true,
        already_sent: true,
        quote: { id: quote.id, quote_number: quote.quoteNumber, status: quote.status },
      })
    }

    const needsApproval = policyRequiresApproval(quote.total, quote.subtotal, quote.discount)
    if (needsApproval && quote.status !== 'accepted') {
      return NextResponse.json(
        {
          error: 'Approval required before send',
          code: 'APPROVAL_REQUIRED',
        },
        { status: 422 }
      )
    }

    const updated = await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'sent' },
      select: { id: true, quoteNumber: true, status: true },
    })

    trackEvent('quote_sent', {
      tenantId,
      userId,
      entityId: quoteId,
      properties: { quote_number: updated.quoteNumber },
    })

    prisma.auditLog
      .create({
        data: {
          tenantId,
          entityType: 'quote',
          entityId: quoteId,
          changedBy: userId || 'system',
          changeSummary: 'quote_sent',
          afterSnapshot: { status: updated.status },
        },
      })
      .catch(() => {})

    return NextResponse.json({
      success: true,
      quote: {
        id: updated.id,
        quote_number: updated.quoteNumber,
        status: updated.status,
      },
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    console.error('Send quote error:', e)
    return NextResponse.json({ error: 'Failed to send quote' }, { status: 500 })
  }
}
