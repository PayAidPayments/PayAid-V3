import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculateGST } from '@/lib/invoicing/gst'
import { z } from 'zod'

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  rate: z.number().min(0),
  amount: z.number().optional(),
  gstRate: z.number().min(0).max(100).optional(),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
})

const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  paidAt: z.string().datetime().optional(),
  items: z.array(itemSchema).optional(),
})

// GET /api/invoices/[id] - Get a single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Handle Next.js 16+ async params
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        customer: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to get invoice' },
      { status: 500 }
    )
  }
}

// PATCH /api/invoices/[id] - Update an invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const validated = updateInvoiceSchema.parse(body)

    // Check if invoice exists and belongs to tenant
    const existing = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validated.status) updateData.status = validated.status
    if (validated.paidAt) updateData.paidAt = new Date(validated.paidAt)
    if (validated.status === 'paid' && !validated.paidAt) {
      updateData.paidAt = new Date()
    }

    if (validated.items && validated.items.length > 0) {
      const invoiceItems = validated.items.map((item) => {
        const amount = item.quantity * item.rate
        return {
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount,
          gstRate: item.gstRate ?? 18,
          hsnCode: item.hsnCode ?? null,
          sacCode: item.sacCode ?? null,
        }
      })
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0)
      const avgGstRate = invoiceItems.reduce((s, i) => s + (i.gstRate || 18), 0) / invoiceItems.length
      const gst = calculateGST(subtotal, avgGstRate, existing.isInterState ?? false)
      updateData.items = invoiceItems
      updateData.subtotal = subtotal
      updateData.tax = gst.totalGST
      updateData.gstAmount = gst.totalGST
      updateData.total = gst.totalAmount
      updateData.gstRate = avgGstRate
      if (gst.cgst != null) updateData.cgst = gst.cgst
      if (gst.sgst != null) updateData.sgst = gst.sgst
      if (gst.igst != null) updateData.igst = gst.igst
    }

    const invoice = await prisma.invoice.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}


