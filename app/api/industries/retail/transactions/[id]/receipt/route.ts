import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { generateReceiptPDF } from '@/lib/retail/receipt-pdf'

// GET /api/industries/retail/transactions/[id]/receipt - Generate receipt PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    // Verify tenant is retail industry
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true, name: true, address: true, city: true, state: true, postalCode: true, gstin: true, phone: true },
    })

    if (tenant?.industry !== 'retail') {
      return NextResponse.json(
        { error: 'This endpoint is only for retail industry' },
        { status: 403 }
      )
    }

    // Fetch transaction with items and customer
    const transaction = await prisma.retailTransaction.findUnique({
      where: {
        id,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Generate receipt PDF
    const pdfBuffer = await generateReceiptPDF({
      transactionNumber: transaction.transactionNumber,
      transactionDate: transaction.createdAt,
      businessName: tenant.name,
      businessAddress: tenant.address || undefined,
      businessCity: tenant.city || undefined,
      businessState: tenant.state || undefined,
      businessPostalCode: tenant.postalCode || undefined,
      businessGSTIN: tenant.gstin || undefined,
      businessPhone: tenant.phone || undefined,
      customerName: transaction.customer?.name || 'Walk-in Customer',
      customerPhone: transaction.customer?.phone || undefined,
      items: transaction.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(transaction.subtotal),
      tax: Number(transaction.tax),
      discount: Number(transaction.discount),
      total: Number(transaction.total),
      paymentMethod: transaction.paymentMethod,
      paymentStatus: transaction.paymentStatus,
    })

    // Mark receipt as printed
    await prisma.retailTransaction.update({
      where: { id },
      data: { receiptPrinted: true },
    })

    return new NextResponse(pdfBuffer as unknown as Blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${transaction.transactionNumber}.pdf"`,
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Generate receipt error:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}

