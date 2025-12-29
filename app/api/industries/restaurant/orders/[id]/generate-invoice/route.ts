import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { generateInvoiceNumber } from '@/lib/invoicing/utils'

// POST /api/industries/restaurant/orders/[id]/generate-invoice - Generate invoice from order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'finance')

    // Get the order
    const order = await prisma.restaurantOrder.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        invoice: true, // Check if invoice already exists
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if invoice already exists
    if (order.invoiceId) {
      return NextResponse.json(
        { error: 'Invoice already exists for this order', invoiceId: order.invoiceId },
        { status: 400 }
      )
    }

    // Get tenant for GST information
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        gstin: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })

    // Calculate totals
    const subtotal = Number(order.totalAmount)
    const gstRate = 18 // Default GST rate (can be made configurable)
    const gstAmount = (subtotal * gstRate) / 100
    const total = subtotal + gstAmount

    // Prepare invoice items
    const invoiceItems = order.items.map((item) => ({
      description: item.menuItem.name,
      quantity: item.quantity,
      rate: Number(item.price),
      amount: Number(item.subtotal),
      hsnCode: null, // Can be added to menu items later
      sacCode: null,
      gstRate: gstRate,
    }))

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId)

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        status: 'draft',
        subtotal,
        tax: gstAmount,
        total,
        gstRate,
        gstAmount,
        cgst: tenant?.state ? gstAmount / 2 : null, // Intra-state
        sgst: tenant?.state ? gstAmount / 2 : null, // Intra-state
        igst: !tenant?.state ? gstAmount : null, // Inter-state
        isInterState: !tenant?.state,
        items: invoiceItems as any,
        customerName: order.customerName || 'Walk-in Customer',
        customerPhone: order.customerPhone,
        orderNumber: order.orderNumber,
        invoiceDate: new Date(),
        notes: `Generated from Restaurant Order #${order.orderNumber}`,
      },
    })

    // Link invoice to order
    await prisma.restaurantOrder.update({
      where: { id },
      data: { invoiceId: invoice.id },
    })

    return NextResponse.json({
      invoice,
      message: 'Invoice generated successfully',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Generate invoice from order error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

