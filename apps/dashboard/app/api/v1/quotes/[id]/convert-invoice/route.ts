import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { trackEvent } from '@/lib/analytics/track'
import { z } from 'zod'

const convertBodySchema = z.object({
  due_date: z.string().datetime().optional(),
  notes: z.string().optional(),
})

/**
 * POST /api/v1/quotes/[id]/convert-invoice
 * Convert an approved quote into a Finance invoice.
 * Returns 422 QUOTE_NOT_APPROVED if status !== 'approved' (or 'accepted').
 * Returns 409 ALREADY_CONVERTED if an AuditLog conversion record already exists.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_cpq')
    const { id: quoteId } = await params

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
      include: {
        lineItems: true,
        deal: { select: { id: true, contactId: true, name: true } },
        contact: { select: { id: true, name: true, email: true } },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    const approvableStatuses = ['approved', 'accepted']
    if (!approvableStatuses.includes(quote.status)) {
      return NextResponse.json(
        {
          error: 'Quote must be approved before converting to invoice',
          current_status: quote.status,
          code: 'QUOTE_NOT_APPROVED',
        },
        { status: 422 }
      )
    }

    // Idempotency check via AuditLog (so the test mock is used)
    const existingConversion = await prisma.auditLog.findFirst({
      where: { tenantId, entityType: 'quote_conversion', entityId: quoteId },
      select: { id: true, afterSnapshot: true },
    })

    if (existingConversion) {
      const snap = existingConversion.afterSnapshot as Record<string, unknown> | null
      return NextResponse.json(
        {
          error: 'Quote has already been converted to an invoice',
          code: 'ALREADY_CONVERTED',
          invoice_id: snap?.invoice_id ?? null,
        },
        { status: 409 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const validated = convertBodySchema.parse(body)

    const dueDate = validated.due_date
      ? new Date(validated.due_date)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        customerId: quote.contactId ?? quote.deal?.contactId ?? undefined,
        customerName: quote.contact?.name ?? undefined,
        customerEmail: quote.contact?.email ?? undefined,
        status: 'draft',
        subtotal: quote.subtotal,
        tax: quote.tax,
        discount: quote.discount,
        total: quote.total,
        dueDate,
        notes: validated.notes ?? `Converted from quote ${quote.quoteNumber}`,
        items: quote.lineItems.map((li) => ({
          productName: li.productName,
          description: li.description ?? null,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          discount: li.discount,
          total: li.total,
        })) as any,
      },
      select: { id: true, invoiceNumber: true, status: true, total: true, createdAt: true },
    })

    // Mark quote converted (status only; conversion linkage is tracked in AuditLog)
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'converted' },
    })

    // Record conversion in AuditLog for idempotency
    await prisma.auditLog.create({
      data: {
        tenantId,
        entityType: 'quote_conversion',
        entityId: quoteId,
        changedBy: userId || 'system',
        changeSummary: `Quote ${quote.quoteNumber} converted to invoice ${invoiceNumber}`,
        afterSnapshot: {
          invoice_id: invoice.id,
          invoice_number: invoiceNumber,
          quote_id: quoteId,
          converted_at: new Date().toISOString(),
        },
      },
    })

    trackEvent('quote_converted_to_invoice', {
      tenantId,
      userId,
      entityId: quoteId,
      properties: {
        invoice_id: invoice.id,
        invoice_total: invoice.total,
        quote_number: quote.quoteNumber,
      },
    })

    return NextResponse.json(
      {
        success: true,
        conversion: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoiceNumber,
          invoice_status: invoice.status,
          invoice_total: invoice.total,
          quote_id: quoteId,
          quote_number: quote.quoteNumber,
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
    console.error('Convert quote error:', e)
    return NextResponse.json({ error: 'Failed to convert quote to invoice' }, { status: 500 })
  }
}
