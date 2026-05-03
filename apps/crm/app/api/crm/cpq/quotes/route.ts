import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/crm/cpq/quotes - List quotes for tenant (real data from Prisma)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const dealId = searchParams.get('dealId')
    const status = searchParams.get('status')

    const quotes = await prisma.quote.findMany({
      where: {
        tenantId,
        ...(dealId ? { dealId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        lineItems: true,
        deal: { select: { id: true, name: true, value: true, stage: true } },
        contact: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ success: true, quotes })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get quotes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes', message: error?.message },
      { status: 500 }
    )
  }
}

// POST /api/crm/cpq/quotes - Create a quote for a deal
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()

    const dealId = body.dealId as string
    const contactId = (body.contactId as string) || null
    const validUntil = body.validUntil ? new Date(body.validUntil) : null
    const notes = (body.notes as string) || null
    const lineItems = Array.isArray(body.lineItems) ? body.lineItems : []

    if (!dealId?.trim()) {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 })
    }

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, tenantId },
      include: { contact: true },
    })
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const existingQuote = await prisma.quote.findUnique({ where: { dealId } })
    if (existingQuote) {
      return NextResponse.json(
        { error: 'A quote already exists for this deal', quoteId: existingQuote.id },
        { status: 409 }
      )
    }

    const quoteNumber =
      'Q-' +
      new Date().toISOString().slice(0, 10).replace(/-/g, '') +
      '-' +
      Math.random().toString(36).slice(2, 8).toUpperCase()

    let subtotal = 0
    let tax = 0
    const discount = 0

    const createdLineItems = []
    for (const item of lineItems) {
      const qty = Math.max(1, Number(item.quantity) || 1)
      const unitPrice = Number(item.unitPrice) || 0
      const itemDiscount = Number(item.discount) || 0
      const total = qty * unitPrice - itemDiscount
      subtotal += total
      createdLineItems.push({
        productId: item.productId || null,
        productName: item.productName || 'Item',
        description: item.description || null,
        quantity: qty,
        unitPrice,
        discount: itemDiscount,
        total,
      })
    }

    const total = Math.max(0, subtotal + tax - discount)

    const quote = await prisma.quote.create({
      data: {
        tenantId,
        dealId,
        contactId: contactId || deal.contactId || null,
        quoteNumber,
        status: 'draft',
        subtotal,
        tax,
        discount,
        total,
        validUntil,
        notes,
        lineItems: {
          create: createdLineItems.map((li) => ({
            productId: li.productId,
            productName: li.productName,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            discount: li.discount,
            total: li.total,
          })),
        },
      },
      include: {
        lineItems: true,
        deal: { select: { id: true, name: true, value: true, stage: true } },
        contact: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, quote }, { status: 201 })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create quote error:', error)
    return NextResponse.json(
      { error: 'Failed to create quote', message: error?.message },
      { status: 500 }
    )
  }
}
