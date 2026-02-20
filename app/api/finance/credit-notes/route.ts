import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'

// GET /api/finance/credit-notes - List credit notes
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

    const [creditNotes, total] = await Promise.all([
      prisma.creditNote.findMany({
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
        orderBy: { creditNoteDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.creditNote.count({ where }),
    ])

    // Calculate summary
    const summary = {
      total: total,
      draft: await prisma.creditNote.count({ where: { ...where, status: 'draft' } }),
      issued: await prisma.creditNote.count({ where: { ...where, status: 'issued' } }),
      cancelled: await prisma.creditNote.count({ where: { ...where, status: 'cancelled' } }),
      totalAmount: await prisma.creditNote.aggregate({
        where: { ...where, status: 'issued' },
        _sum: { total: true },
      }),
    }

    return NextResponse.json({
      creditNotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    })
  } catch (error: any) {
    console.error('[GET /api/finance/credit-notes]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credit notes' },
      { status: 500 }
    )
  }
}

// POST /api/finance/credit-notes - Create credit note
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
      creditNoteDate,
      currency = 'INR',
    } = body

    const tenantId = tenantIdFromBody || jwtTenantId

    // Generate credit note number
    const year = new Date().getFullYear()
    const count = await prisma.creditNote.count({
      where: {
        tenantId,
        creditNoteDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    })
    const creditNoteNumber = `CN-${year}-${String(count + 1).padStart(4, '0')}`

    const creditNote = await prisma.creditNote.create({
      data: {
        creditNoteNumber,
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
        creditNoteDate: creditNoteDate ? new Date(creditNoteDate) : new Date(),
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

    return NextResponse.json({ creditNote }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/finance/credit-notes]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create credit note' },
      { status: 500 }
    )
  }
}
