import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { checkTenantLimits } from '@/lib/middleware/tenant'
import { calculateGST, getGSTRate, getHSNCode } from '@/lib/invoicing/gst'
import { determineGSTType } from '@/lib/invoicing/gst-state'
import { generateInvoicePDF } from '@/lib/invoicing/pdf'
import { multiLayerCache } from '@/lib/cache/multi-layer'
import { z } from 'zod'
import { mediumPriorityQueue } from '@/lib/queue/bull'

const createInvoiceSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerCity: z.string().optional(),
  customerState: z.string().optional(),
  customerPostalCode: z.string().optional(),
  customerGSTIN: z.string().optional(),
  supplierGSTIN: z.string().optional(),
  placeOfSupply: z.string().optional(),
  reverseCharge: z.boolean().default(false),
  template: z.string().optional(),
  orderNumber: z.string().optional(),
  terms: z.string().optional(),
  termsAndConditions: z.string().optional(),
  accountsReceivable: z.string().optional(),
  salespersonId: z.string().optional(),
  discount: z.number().default(0),
  discountType: z.enum(['amount', 'percentage']).default('amount'),
  tdsType: z.enum(['tds', 'tcs']).optional(),
  tdsTax: z.string().optional(),
  adjustment: z.number().default(0),
  invoiceDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    rate: z.number().positive(),
    category: z.string().default('standard'),
    hsnCode: z.string().optional(),
    sacCode: z.string().optional(),
    gstRate: z.number().min(0).max(100).default(18),
  })),
  notes: z.string().optional(),
})

// GET /api/invoices - List all invoices
export async function GET(request: NextRequest) {
  try {
    // Check Finance module license
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    const where: any = {
      tenantId: tenantId,
    }

    if (status) where.status = status
    if (customerId) where.customerId = customerId

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
      prismaRead.invoice.count({ where }),
    ])

    const result = {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    // Cache for 3 minutes (multi-layer: L1 + L2)
    const cacheKey = `invoices:${tenantId}:${page}:${limit}:${status || 'all'}:${customerId || 'all'}`
    await multiLayerCache.set(cacheKey, result, 180).catch(() => {
      // Ignore cache errors - not critical
    })

    return NextResponse.json(result)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to get invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    // Check Finance module license
    const { tenantId } = await requireModuleAccess(request, 'finance')

    // Check tenant limits
    const canCreate = await checkTenantLimits(tenantId, 'invoices')
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Invoice limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Log the incoming data for debugging
    console.log('Creating invoice with data:', JSON.stringify(body, null, 2))
    
    let validated
    try {
      validated = createInvoiceSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('Invoice validation error:', validationError.errors)
        return NextResponse.json(
          { 
            error: 'Validation error', 
            message: 'Please check all required fields are filled correctly',
            details: validationError.errors 
          },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Get tenant details for invoice (includes GSTIN and state)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get customer details if customerId is provided
    let customer = null
    if (validated.customerId) {
      customer = await prisma.contact.findFirst({
        where: {
          id: validated.customerId,
          tenantId: tenantId,
        },
      })
    }

    // Calculate totals
    let subtotal = 0
    const invoiceItems = validated.items.map(item => {
      const amount = item.quantity * item.rate
      subtotal += amount
      
      // Use provided GST rate or get from category
      const gstRate = item.gstRate || getGSTRate(item.category)
      const hsnCode = item.hsnCode || (item.sacCode ? undefined : getHSNCode(item.category))
      
      return {
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount,
        hsnCode,
        sacCode: item.sacCode,
        gstRate,
      }
    })

    // Determine GST type based on seller and buyer states
    // Priority: GSTIN > State name
    const sellerGSTIN = tenant.gstin || validated.supplierGSTIN
    const sellerState = tenant.state
    const buyerGSTIN = customer?.gstin || validated.customerGSTIN
    const buyerState = customer?.state || validated.customerState
    const placeOfSupply = validated.placeOfSupply

    // Auto-determine GST type
    const gstTypeInfo = determineGSTType(
      sellerGSTIN,
      sellerState,
      buyerGSTIN,
      buyerState,
      placeOfSupply
    )

    // Calculate GST using the highest rate from items (or average if multiple rates)
    const avgGstRate = invoiceItems.reduce((sum, item) => sum + item.gstRate, 0) / invoiceItems.length
    const gst = calculateGST(subtotal, avgGstRate, gstTypeInfo.isInterState)
    const total = gst.totalAmount

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { tenantId: tenantId },
    })
    const invoiceNumber = `INV-${tenant.name.substring(0, 3).toUpperCase()}-${String(invoiceCount + 1).padStart(5, '0')}`

    // Create invoice with GST breakdown
    // Build invoice data object conditionally to handle potential schema mismatches
    const invoiceData: any = {
      invoiceNumber,
      tenantId: tenantId,
      customerId: validated.customerId || customer?.id || null,
      // Store customer details directly on invoice (for manual entries or snapshot)
      customerName: validated.customerName || customer?.name || null,
      customerEmail: validated.customerEmail || customer?.email || null,
      customerPhone: validated.customerPhone || customer?.phone || null,
      customerAddress: validated.customerAddress || customer?.address || null,
      customerCity: validated.customerCity || customer?.city || null,
      customerState: validated.customerState || customer?.state || null,
      customerPostalCode: validated.customerPostalCode || customer?.postalCode || null,
      customerGSTIN: validated.customerGSTIN || customer?.gstin || null,
      subtotal,
      tax: gst.totalGST,
      total,
      gstRate: avgGstRate,
      gstAmount: gst.totalGST,
      isInterState: gstTypeInfo.isInterState,
      placeOfSupply: gstTypeInfo.placeOfSupplyCode || null,
      hsnCode: invoiceItems[0]?.hsnCode || invoiceItems[0]?.sacCode || null,
      reverseCharge: validated.reverseCharge || false,
      supplierGSTIN: validated.supplierGSTIN || tenant.gstin || null,
      orderNumber: validated.orderNumber || null,
      terms: validated.terms || null, // Payment Terms
      termsAndConditions: validated.termsAndConditions || null, // Terms & Conditions
      accountsReceivable: validated.accountsReceivable || null,
      salespersonId: validated.salespersonId || null,
      template: validated.template || null,
      discount: validated.discount || 0,
      discountType: validated.discountType || 'amount',
      tdsType: validated.tdsType || null,
      tdsTax: validated.tdsTax || null,
      tdsAmount: null, // TDS amount calculation can be added later if needed
      adjustment: validated.adjustment || 0,
      notes: validated.notes || null,
      items: invoiceItems, // Store invoice items as JSON
      invoiceDate: validated.invoiceDate ? new Date(validated.invoiceDate) : new Date(),
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      status: 'draft',
    }
    
    // Conditionally add GST breakdown fields (only if they have values)
    // This helps if Prisma client is out of sync with schema
    if (gst.cgst !== undefined && gst.cgst !== null) {
      invoiceData.cgst = gst.cgst
    }
    if (gst.sgst !== undefined && gst.sgst !== null) {
      invoiceData.sgst = gst.sgst
    }
    if (gst.igst !== undefined && gst.igst !== null) {
      invoiceData.igst = gst.igst
    }
    
    // Try to create invoice with GST breakdown fields
    // If Prisma client doesn't recognize them, fall back to creating without them
    let invoice
    try {
      invoice = await prisma.invoice.create({
        data: invoiceData,
      })
    } catch (createError: any) {
      // If error is about unknown GST fields, try without them
      if (createError?.message?.includes('cgst') || 
          createError?.message?.includes('sgst') || 
          createError?.message?.includes('igst') ||
          createError?.message?.includes('Unknown argument')) {
        console.warn('Prisma client missing GST fields, creating invoice without breakdown:', createError.message)
        // Remove GST breakdown fields and try again
        const { cgst, sgst, igst, ...invoiceDataWithoutGST } = invoiceData
        invoice = await prisma.invoice.create({
          data: invoiceDataWithoutGST,
        })
        console.warn('Invoice created without GST breakdown fields. Please run: npx prisma generate')
      } else {
        throw createError
      }
    }

    // Generate PDF (async)
    mediumPriorityQueue.add('generate-invoice-pdf', {
      invoiceId: invoice.id,
      invoiceData: {
        invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        businessName: tenant.name,
        customerName: validated.customerName,
        items: invoiceItems,
        subtotal,
        gst,
        total,
        notes: validated.notes,
        terms: validated.terms,
      },
    })

    // Send invoice email if customer email provided (async)
    if (validated.customerEmail) {
      mediumPriorityQueue.add('send-invoice-email', {
        invoiceId: invoice.id,
        customerEmail: validated.customerEmail,
        invoiceNumber,
      })
    }

    // Invalidate cache after creating invoice
    await multiLayerCache.deletePattern(`invoices:${tenantId}:*`).catch(() => {
      // Ignore cache errors - not critical
    })
    await multiLayerCache.delete(`dashboard:stats:${tenantId}`).catch(() => {
      // Ignore cache errors - not critical
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Invoice validation error:', error.errors)
      return NextResponse.json(
        { 
          error: 'Validation error', 
          message: 'Please check all required fields are filled correctly',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    console.error('Create invoice error:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      error: error,
    })
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error?.code || error?.meta?.code
    
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create invoice',
        message: errorMessage,
        code: errorCode,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
          meta: error?.meta,
        })
      },
      { status: 500 }
    )
  }
}

