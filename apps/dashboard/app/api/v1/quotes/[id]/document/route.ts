import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { z } from 'zod'

const bodySchema = z.object({
  channel: z.enum(['pdf', 'web']),
})

/**
 * POST /api/v1/quotes/[id]/document — Record document issuance (demo stub; extend with real PDF/web pipeline).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_cpq')
    const { id: quoteId } = await params
    const body = await request.json().catch(() => ({}))
    const validated = bodySchema.parse(body)

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
      select: { id: true, quoteNumber: true },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    prisma.auditLog
      .create({
        data: {
          tenantId,
          entityType: 'quote',
          entityId: quoteId,
          changedBy: 'system',
          changeSummary: `quote_document_${validated.channel}_requested`,
          afterSnapshot: { channel: validated.channel, quote_number: quote.quoteNumber },
        },
      })
      .catch(() => {})

    return NextResponse.json({
      success: true,
      channel: validated.channel,
      quote_id: quote.id,
      quote_number: quote.quoteNumber,
      message:
        validated.channel === 'pdf'
          ? 'PDF generation recorded. Connect a renderer to download a binary in production.'
          : 'Web quote link recorded. Connect customer portal URL in production.',
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
    console.error('Quote document stub error:', e)
    return NextResponse.json({ error: 'Failed to record document request' }, { status: 500 })
  }
}
