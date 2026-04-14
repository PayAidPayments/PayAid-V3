import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const convertInvoiceBodySchema = z.object({
  due_date: z.string().datetime().optional(),
  notes: z.string().optional(),
})

/**
 * POST /api/crm/cpq/quotes/[id]/convert-invoice
 * Convert an accepted quote into a Finance invoice.
 * Quote must be in 'accepted' status. Idempotent: returns existing invoice if already converted.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id: quoteId } = await params
    const body = await request.json().catch(() => ({}))
    const validated = convertInvoiceBodySchema.parse(body)

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
      include: {
        lineItems: true,
        deal: { select: { id: true, name: true, contactId: true } },
        contact: { select: { id: true, name: true, email: true } },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (quote.status !== 'accepted') {
      return NextResponse.json(
        {
          error: 'Quote must be accepted before converting to invoice',
          current_status: quote.status,
          code: 'QUOTE_NOT_ACCEPTED',
        },
        { status: 422 }
      )
    }

    // Idempotent check via conversion audit records
    const existingConversion = await prisma.auditLog.findFirst({
      where: { tenantId, entityType: 'quote_conversion', entityId: quoteId },
      select: { id: true, afterSnapshot: true },
    })
    if (existingConversion) {
      const snap = existingConversion.afterSnapshot as Record<string, unknown> | null
      const existingInvoiceId = (snap?.invoice_id as string | undefined) ?? null
      const existing = existingInvoiceId
        ? await prisma.invoice.findFirst({
            where: { id: existingInvoiceId, tenantId },
            select: { id: true, invoiceNumber: true, status: true, total: true, createdAt: true },
          })
        : null
      return NextResponse.json({
        success: true,
        invoice: existing,
        already_converted: true,
        quote_id: quote.id,
      })
    }

    // Generate sequential invoice number
    const invoiceCount = await prisma.invoice.count({ where: { tenantId } })
    const invoiceNumber = `INV-CPQ-${String(invoiceCount + 1).padStart(5, '0')}`

    const dueDate = validated.due_date
      ? new Date(validated.due_date)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days net

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

    // Mark quote as converted (status only)
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'converted' },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        entityType: 'quote_conversion',
        entityId: quoteId,
        changedBy: 'system',
        changeSummary: `Quote ${quote.quoteNumber} converted to invoice ${invoice.invoiceNumber}`,
        afterSnapshot: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoiceNumber,
          quote_id: quoteId,
          converted_at: new Date().toISOString(),
        } as any,
      },
    })

    return NextResponse.json(
      {
        success: true,
        invoice,
        already_converted: false,
        quote_id: quote.id,
        quote_number: quote.quoteNumber,
      },
      { status: 201 }
    )
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('Convert quote to invoice error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to convert quote to invoice' },
      { status: 500 }
    )
  }
}
