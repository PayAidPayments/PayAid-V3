/**
 * Finance Invoices API Route
 * POST /api/finance/invoices - Create invoice
 * GET /api/finance/invoices - List invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse } from '@/types/base-modules'
import type { Invoice } from '@/types/base-modules'
import { CreateInvoiceSchema } from '@/modules/shared/finance/types'
import { calculateGST } from '@/lib/invoicing/gst'
import { formatINR } from '@/lib/currency'
import { z } from 'zod'

/**
 * Create a new invoice
 * POST /api/finance/invoices
 */
export async function POST(request: NextRequest) {
  try {
  const body = await request.json()
  const validatedData = CreateInvoiceSchema.parse(body)

  // Calculate line items with GST
  const calculatedLineItems = validatedData.lineItems.map((item) => {
    const amount = item.quantity * item.unitPrice
    const taxAmount = (amount * item.taxRate) / 100
    return {
      id: `item-${Date.now()}-${Math.random()}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      hsnCode: item.hsnCode,
      amount,
      taxAmount,
    }
  })

  // Calculate totals
  const subtotalINR = calculatedLineItems.reduce((sum, item) => sum + item.amount, 0)
  const totalTax = calculatedLineItems.reduce((sum, item) => sum + item.taxAmount, 0)
  const totalINR = subtotalINR + totalTax - validatedData.discountINR

  // Calculate tax breakdown
  const taxBreakdownByRate: Record<string, number> = {}
  calculatedLineItems.forEach((item) => {
    const rate = item.taxRate.toString()
    taxBreakdownByRate[rate] = (taxBreakdownByRate[rate] || 0) + item.taxAmount
  })

  // Generate invoice number
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

  // Calculate due date based on payment terms
  const invoiceDate = new Date(validatedData.invoiceDate)
  let dueDate = new Date(validatedData.dueDate)
  
  if (validatedData.paymentTerms === 'immediate') {
    dueDate = invoiceDate
  } else if (validatedData.paymentTerms === 'net15') {
    dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 15)
  } else if (validatedData.paymentTerms === 'net30') {
    dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 30)
  } else if (validatedData.paymentTerms === 'net45') {
    dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 45)
  }

  // Create invoice in database
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: validatedData.organizationId,
      invoiceNumber,
      invoiceDate,
      dueDate: dueDate || undefined,
      customerId: validatedData.customerId || undefined,
      subtotal: subtotalINR,
      tax: totalTax,
      discount: validatedData.discountINR,
      total: totalINR,
      status: 'draft',
      terms: validatedData.paymentTerms ? `Payment Terms: ${validatedData.paymentTerms}` : undefined,
      notes: validatedData.notes || '',
      // Store line items and metadata as JSON in items field
      items: JSON.stringify({
        lineItems: calculatedLineItems,
        taxBreakdown: {
          cgst: totalTax / 2, // Simplified - should calculate based on inter-state
          sgst: totalTax / 2,
          igst: 0,
          totalTax,
          breakdownByRate: taxBreakdownByRate,
        },
        paymentTerms: validatedData.paymentTerms,
        isRecurring: validatedData.isRecurring || false,
        recurringInterval: validatedData.recurringInterval || null,
      }),
    },
  })

  const itemsData = invoice.items ? (typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items) : {}
  const lineItems = itemsData.lineItems || []
  const taxBreakdown = itemsData.taxBreakdown || {}
  
  const response: ApiResponse<Invoice> = {
    success: true,
    statusCode: 201,
    data: {
      id: invoice.id,
      organizationId: invoice.tenantId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || undefined,
      customerId: invoice.customerId || undefined,
      lineItems,
      subtotalINR: Number(invoice.subtotal),
      totalTax: Number(invoice.tax),
      taxBreakdown: taxBreakdown.breakdownByRate || {},
      discountINR: Number(invoice.discount),
      totalINR: Number(invoice.total),
      status: invoice.status as Invoice['status'],
      paymentTerms: itemsData.paymentTerms,
      isRecurring: itemsData.isRecurring || false,
      recurringInterval: itemsData.recurringInterval,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error in POST invoices route:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, statusCode: 400, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

/**
 * Get invoices list
 * GET /api/finance/invoices?organizationId=xxx&status=paid&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
  try {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  const status = searchParams.get('status')
  const customerId = searchParams.get('customerId')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  const where: Record<string, unknown> = {
    tenantId: organizationId,
  }

  if (status) {
    where.status = status
  }

  if (customerId) {
    where.customerId = customerId
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ])

  const formattedInvoices: Invoice[] = invoices.map((invoice) => {
    const itemsData = invoice.items ? (typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items) : {}
    const lineItems = itemsData.lineItems || []
    const taxBreakdown = itemsData.taxBreakdown?.breakdownByRate || {}
    
    return {
      id: invoice.id,
      organizationId: invoice.tenantId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || undefined,
      customerId: invoice.customerId || undefined,
      customerName: invoice.customerName || undefined,
      customerEmail: invoice.customerEmail || undefined,
      customerPhone: invoice.customerPhone || undefined,
      lineItems,
      subtotalINR: Number(invoice.subtotal),
      totalTax: Number(invoice.tax),
      taxBreakdown,
      discountINR: Number(invoice.discount),
      totalINR: Number(invoice.total),
      status: invoice.status as Invoice['status'],
      paymentTerms: itemsData.paymentTerms,
      paymentLinkUrl: invoice.paymentLinkUrl || undefined,
      isRecurring: itemsData.isRecurring || false,
      recurringInterval: itemsData.recurringInterval,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }
  })

  const response: ApiResponse<{
    invoices: Invoice[]
    total: number
    page: number
    pageSize: number
  }> = {
    success: true,
    statusCode: 200,
    data: {
      invoices: formattedInvoices,
      total,
      page,
      pageSize,
    },
    meta: {
      pagination: {
        page,
        pageSize,
        total,
      },
      timestamp: new Date().toISOString(),
    },
  }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET invoices route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}
