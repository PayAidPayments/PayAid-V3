import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { trackEvent } from '@/lib/analytics/track'
import { z } from 'zod'

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit_price: z.number().nonnegative(),
  tax_rate: z.number().min(0).max(1).default(0),
  discount_rate: z.number().min(0).max(1).default(0),
})

const patchQuoteBodySchema = z.object({
  line_items: z.array(lineItemSchema).min(1).max(50),
})

/**
 * PATCH /api/v1/quotes/[id] — Replace line items and recompute totals (CPQ workspace save).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_cpq')
    const { id: quoteId } = await params
    const body = await request.json()
    const validated = patchQuoteBodySchema.parse(body)

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
      select: { id: true, status: true, quoteNumber: true },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (quote.status === 'converted' || quote.status === 'void') {
      return NextResponse.json(
        { error: `Cannot edit quote in status '${quote.status}'`, code: 'INVALID_STATE' },
        { status: 422 }
      )
    }

    const subtotal = validated.line_items.reduce((s, li) => s + li.quantity * li.unit_price, 0)
    const discount = validated.line_items.reduce(
      (s, li) => s + li.quantity * li.unit_price * li.discount_rate,
      0
    )
    const taxable = subtotal - discount
    const tax = validated.line_items.reduce(
      (s, li) => s + li.quantity * li.unit_price * (1 - li.discount_rate) * li.tax_rate,
      0
    )
    const total = taxable + tax

    await prisma.$transaction(async (tx) => {
      await tx.quoteLineItem.deleteMany({ where: { quoteId } })
      await tx.quoteLineItem.createMany({
        data: validated.line_items.map((li) => ({
          quoteId,
          productName: li.description.slice(0, 200),
          description: li.description,
          quantity: Math.round(li.quantity),
          unitPrice: li.unit_price,
          discount: li.quantity * li.unit_price * li.discount_rate,
          total: li.quantity * li.unit_price * (1 - li.discount_rate) * (1 + li.tax_rate),
        })),
      })
      await tx.quote.update({
        where: { id: quoteId },
        data: { subtotal, discount, tax, total },
      })
    })

    trackEvent('quote_updated', {
      tenantId,
      userId,
      entityId: quoteId,
      properties: { quote_number: quote.quoteNumber, line_item_count: validated.line_items.length, total },
    })

    return NextResponse.json({
      success: true,
      quote: {
        id: quoteId,
        quote_number: quote.quoteNumber,
        subtotal,
        discount,
        tax,
        total,
        line_item_count: validated.line_items.length,
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
    console.error('Patch quote error:', e)
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 })
  }
}
