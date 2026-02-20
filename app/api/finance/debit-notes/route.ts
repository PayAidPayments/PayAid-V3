import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'

// GET /api/finance/debit-notes - List debit notes
export async function GET(request: NextRequest) {
  try {
    const { tenantId: jwtTenantId } = await requireModuleAccess(request, 'finance')

    const { searchParams } = new URL(request.url)
    const tenantIdFromQuery = searchParams.get('tenantId')
    const tenantId = tenantIdFromQuery || jwtTenantId
    const status = searchParams.get('status')
    const invoiceId = searchParams.get('invoiceId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = { tenantId }
    if (status) where.status = status
    if (invoiceId) where.invoiceId = invoiceId

    const [debitNotes, total] = await Promise.all([
      prisma.debitNote.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { debitNoteDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.debitNote.count({ where }),
    ])

    // Calculate summary
    const summary = {
      total: total,
      draft: await prisma.debitNote.count({ where: { ...where, status: 'draft' } }),
      issued: await prisma.debitNote.count({ where: { ...where, status: 'issued' } }),
      cancelled: await prisma.debitNote.count({ where: { ...where, status: 'cancelled' } }),
      totalAmount: await prisma.debitNote.aggregate({
        where: { ...where, status: 'issued' },
        _sum: { total: true },
      }),
    }

    return NextResponse.json({
      debitNotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    })
  } catch (error: any) {
    console.error('[GET /api/finance/debit-notes]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch debit notes' },
      { status: 500 }
    )
  }
}

// POST /api/finance/debit-notes - Create debit note
export async function POST(request: NextRequest) {
  try {
    const { tenantId: jwtTenantId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const {
      tenantId: tenantIdFromBody,
      invoiceId,
      invoiceNumber,
      reason,
      reasonDescription,
      subtotal,
      tax,
      total,
      gstRate,
      gstAmount,
      cgst,
      sgst,
      igst,
      isInterState,
      placeOfSupply,
      hsnCode,
      reverseCharge,
      supplierGSTIN,
      items,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerState,
      customerPostalCode,
      customerGSTIN,
      notes,
      termsAndConditions,
      debitNoteDate,
      currency = 'INR',
    } = body

    const tenantId = tenantIdFromBody || jwtTenantId

    // Generate debit note number
    const year = new Date().getFullYear()
    const count = await prisma.debitNote.count({
      where: {
        tenantId,
        debitNoteDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    })
    const debitNoteNumber = `DN-${year}-${String(count + 1).padStart(4, '0')}`

    const debitNote = await prisma.debitNote.create({
      data: {
        debitNoteNumber,
        invoiceId,
        invoiceNumber,
        status: 'draft',
        reason,
        reasonDescription,
        subtotal,
        tax,
        total,
        gstRate,
        gstAmount,
        cgst,
        sgst,
        igst,
        isInterState,
        placeOfSupply,
        hsnCode,
        reverseCharge,
        supplierGSTIN,
        items: items || null,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        customerCity,
        customerState,
        customerPostalCode,
        customerGSTIN,
        notes,
        termsAndConditions,
        debitNoteDate: debitNoteDate ? new Date(debitNoteDate) : new Date(),
        currency,
        tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ debitNote }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/finance/debit-notes]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create debit note' },
      { status: 500 }
    )
  }
}
