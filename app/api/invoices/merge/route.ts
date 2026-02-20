/**
 * Invoice Merging API Route
 * POST /api/invoices/merge - Merge multiple invoices into one
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const mergeInvoicesSchema = z.object({
  invoiceIds: z.array(z.string()).min(2, 'At least 2 invoices required'),
  mergedInvoiceNumber: z.string().optional(), // Auto-generate if not provided
  keepOriginalInvoices: z.boolean().default(false), // Keep originals or mark as merged
})

// POST /api/invoices/merge - Merge invoices
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = mergeInvoicesSchema.parse(body)

    // Fetch all invoices to merge
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: validated.invoiceIds },
        tenantId,
      },
    })

    if (invoices.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 invoices required to merge' },
        { status: 400 }
      )
    }

    // Validate all invoices belong to same tenant and customer
    const customerIds = [...new Set(invoices.map((inv) => inv.customerId).filter(Boolean))]
    if (customerIds.length > 1) {
      return NextResponse.json(
        { error: 'Cannot merge invoices from different customers' },
        { status: 400 }
      )
    }

    // Check if any invoice is already paid/partially paid
    const paidInvoices = invoices.filter(
      (inv) => inv.paymentStatus === 'paid' || inv.paymentStatus === 'partial'
    )
    if (paidInvoices.length > 0 && !validated.keepOriginalInvoices) {
      return NextResponse.json(
        {
          error: 'Cannot merge invoices that are already paid. Set keepOriginalInvoices=true to keep originals.',
        },
        { status: 400 }
      )
    }

    // Combine all line items
    const allItems: any[] = []
    let totalSubtotal = 0
    let totalTax = 0
    let totalDiscount = 0
    let totalAdjustment = 0

    for (const invoice of invoices) {
      const items = (invoice.items as any) || []
      allItems.push(...items)

      totalSubtotal += invoice.subtotal || 0
      totalTax += invoice.tax || 0
      totalDiscount += invoice.discount || 0
      totalAdjustment += invoice.adjustment || 0
    }

    const total = totalSubtotal + totalTax - totalDiscount + totalAdjustment

    // Generate merged invoice number
    const mergedInvoiceNumber =
      validated.mergedInvoiceNumber ||
      `INV-MERGED-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    // Get customer info from first invoice
    const customerId = invoices[0].customerId
    const contact = customerId
      ? await prisma.contact.findFirst({
          where: { id: customerId, tenantId },
        })
      : null

    // Create merged invoice
    const mergedInvoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber: mergedInvoiceNumber,
        customerId: customerId || undefined,
        customerName: invoices[0].customerName || contact?.name,
        customerEmail: invoices[0].customerEmail || contact?.email,
        customerPhone: invoices[0].customerPhone || contact?.phone,
        customerAddress: invoices[0].customerAddress || contact?.address,
        customerCity: invoices[0].customerCity || contact?.city,
        customerState: invoices[0].customerState || contact?.state,
        customerPostalCode: invoices[0].customerPostalCode || contact?.postalCode,
        customerGSTIN: invoices[0].customerGSTIN || contact?.gstin,
        subtotal: totalSubtotal,
        tax: totalTax,
        discount: totalDiscount,
        adjustment: totalAdjustment,
        total,
        items: allItems,
        status: 'draft',
        notes: `Merged from invoices: ${invoices.map((inv) => inv.invoiceNumber).join(', ')}`,
        terms: invoices[0].terms,
        termsAndConditions: invoices[0].termsAndConditions,
        template: invoices[0].template,
        gstRate: invoices[0].gstRate,
        gstAmount: invoices[0].gstAmount,
        isInterState: invoices[0].isInterState,
        placeOfSupply: invoices[0].placeOfSupply,
        hsnCode: invoices[0].hsnCode,
      },
    })

    // Update original invoices
    if (validated.keepOriginalInvoices) {
      // Mark as merged but keep them
      await prisma.invoice.updateMany({
        where: {
          id: { in: validated.invoiceIds },
          tenantId,
        },
        data: {
          notes: (invoices[0].notes || '') + ` [Merged into ${mergedInvoiceNumber}]`,
          status: 'merged',
        },
      })
    } else {
      // Delete original invoices (only if not paid)
      await prisma.invoice.deleteMany({
        where: {
          id: { in: validated.invoiceIds },
          tenantId,
          paymentStatus: { notIn: ['paid', 'partial'] },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${invoices.length} invoices`,
      data: {
        mergedInvoice,
        originalInvoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          total: inv.total,
          status: validated.keepOriginalInvoices ? 'merged' : 'deleted',
        })),
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Merge invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to merge invoices', message: error.message },
      { status: 500 }
    )
  }
}
