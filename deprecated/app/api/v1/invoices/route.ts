/**
 * Public API v1: Invoices endpoint
 * Supports both JWT (internal) and API key (external) authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateApiRequest, requireScope } from '@/lib/middleware/api-key-auth'

/** GET /api/v1/invoices - List invoices (public API) */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateApiRequest(request)
    if (!authResult.authenticated) {
      return authResult.response
    }

    if (authResult.authType === 'api_key') {
      const hasScope = requireScope(['read:invoices'])(authResult)
      if (!hasScope) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Required scope: read:invoices' },
          { status: 403 }
        )
      }
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {
      tenantId: authResult.tenantId,
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          dueDate: true,
          customerName: true,
          customerEmail: true,
          subtotal: true,
          cgst: true,
          sgst: true,
          igst: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API] v1/invoices GET', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

/** POST /api/v1/invoices - Create invoice (public API) */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiRequest(request)
    if (!authResult.authenticated) {
      return authResult.response
    }

    if (authResult.authType === 'api_key') {
      const hasScope = requireScope(['write:invoices'])(authResult)
      if (!hasScope) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Required scope: write:invoices' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const {
      customerName,
      customerEmail,
      customerPhone,
      items = [],
      invoiceDate,
      dueDate,
      notes,
      terms,
    } = body

    if (!customerName || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'customerName and items are required' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (Number(item.quantity || 0) * Number(item.price || 0))
    }, 0)
    const gst = subtotal * 0.18 // 18% GST
    const total = subtotal + gst

    // Generate invoice number
    const tenant = await prisma.tenant.findUnique({
      where: { id: authResult.tenantId },
    })
    const invoiceCount = await prisma.invoice.count({
      where: { tenantId: authResult.tenantId },
    })
    const invoiceNumber = `INV-${(invoiceCount + 1).toString().padStart(6, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: authResult.tenantId,
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customerName: String(customerName),
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        items: items as any,
        subtotal,
        tax: (gst as number) || 0,
        cgst: (gst as number) / 2 || 0,
        sgst: (gst as number) / 2 || 0,
        igst: 0,
        total,
        status: 'draft',
        paymentStatus: 'pending',
        notes: notes || null,
        terms: terms || null,
      },
    })

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error) {
    console.error('[API] v1/invoices POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
