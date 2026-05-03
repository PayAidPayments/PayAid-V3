import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/recurring-billing/invoices - Get recurring invoices
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    // Note: Invoice model doesn't have isRecurring field yet
    // For now, we'll filter by recurringFrequency in notes or use a different approach
    // This is a workaround until schema is updated
    const where: any = {
      tenantId,
      // Filter by notes containing "recurring" as a workaround
      notes: { contains: 'recurring', mode: 'insensitive' },
    }

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get recurring invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to get recurring invoices' },
      { status: 500 }
    )
  }
}

// POST /api/recurring-billing/invoices - Create recurring invoice template
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const {
      customerId,
      customerName,
      customerEmail,
      items,
      recurringFrequency, // daily, weekly, monthly, quarterly, yearly
      startDate,
      endDate,
      notes,
    } = body

    if (!customerId && !customerName) {
      return NextResponse.json(
        { error: 'Customer ID or name is required' },
        { status: 400 }
      )
    }

    if (!recurringFrequency) {
      return NextResponse.json(
        { error: 'Recurring frequency is required' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)
    const tax = subtotal * 0.18 // 18% GST (can be made configurable)
    const total = subtotal + tax

    // Generate invoice number
    const count = await prisma.invoice.count({ where: { tenantId } })
    const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`

    // Create recurring invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        customerId: customerId || null,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        subtotal,
        tax,
        total,
        status: 'draft',
        // Store recurring info in notes until schema is updated
        notes: `RECURRING_INVOICE_TEMPLATE|FREQUENCY:${recurringFrequency}|${notes || ''}`,
        items: items,
        terms: `This is a recurring invoice. Frequency: ${recurringFrequency}`,
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Create recurring invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to create recurring invoice' },
      { status: 500 }
    )
  }
}

