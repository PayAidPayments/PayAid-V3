import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { generateInvoicePDF } from '@/lib/invoicing/pdf'
import { GSTCalculation } from '@/lib/invoicing/gst'

// GET /api/invoices/[id]/pdf - Download invoice PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check invoicing module license
    const { tenantId } = await requireFinanceAccess(request)

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        customer: true,
        tenant: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Parse invoice items from JSON field
    let invoiceItems: Array<{
      description: string
      quantity: number
      rate: number
      amount: number
      hsnCode?: string
      sacCode?: string
      gstRate: number
    }> = []

    if (invoice.items && typeof invoice.items === 'object') {
      try {
        const itemsArray = Array.isArray(invoice.items) 
          ? invoice.items 
          : JSON.parse(invoice.items as string)
        
        invoiceItems = itemsArray.map((item: any) => ({
          description: item.description || 'Item',
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          amount: item.amount || (item.quantity * item.rate) || 0,
          hsnCode: item.hsnCode || undefined,
          sacCode: item.sacCode || undefined,
          gstRate: item.gstRate || invoice.gstRate || 18,
        }))
      } catch (error) {
        console.error('Error parsing invoice items:', error)
        // Fallback to single item if parsing fails
        invoiceItems = [{
          description: 'Invoice Items',
          quantity: 1,
          rate: invoice.subtotal,
          amount: invoice.subtotal,
          hsnCode: invoice.hsnCode || undefined,
          gstRate: invoice.gstRate || 18,
        }]
      }
    } else {
      // Fallback if no items
      invoiceItems = [{
        description: 'Invoice Items',
        quantity: 1,
        rate: invoice.subtotal,
        amount: invoice.subtotal,
        hsnCode: invoice.hsnCode || undefined,
        gstRate: invoice.gstRate || 18,
      }]
    }

    // Use actual GST breakdown from invoice
    const gstRate = invoice.gstRate || 18
    const gstAmount = invoice.gstAmount || invoice.tax || 0
    const isInterState = invoice.isInterState || false
    
    // Build GST calculation object
    const gstCalculation: GSTCalculation = {
      baseAmount: invoice.subtotal,
      gstRate: gstRate,
      cgst: invoice.cgst || (isInterState ? 0 : gstAmount / 2),
      sgst: invoice.sgst || (isInterState ? 0 : gstAmount / 2),
      igst: invoice.igst || (isInterState ? gstAmount : 0),
      totalGST: gstAmount,
      totalAmount: invoice.total,
      isInterState: isInterState,
    }
    
    // Use customer details from invoice (prefer invoice fields, fallback to contact)
    const customerName = invoice.customerName || invoice.customer?.name || 'Customer'
    const customerAddress = invoice.customerAddress || invoice.customer?.address || undefined
    const customerCity = invoice.customerCity || invoice.customer?.city || undefined
    const customerState = invoice.customerState || invoice.customer?.state || undefined
    const customerPostalCode = invoice.customerPostalCode || invoice.customer?.postalCode || undefined
    const customerGSTIN = invoice.customerGSTIN || invoice.customer?.gstin || undefined
    
    // Generate PDF with proper GST-compliant format
    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || undefined,
      businessName: invoice.tenant.name,
      businessAddress: invoice.tenant.address || undefined,
      businessCity: invoice.tenant.city || undefined,
      businessState: invoice.tenant.state || undefined,
      businessPostalCode: invoice.tenant.postalCode || undefined,
      businessGSTIN: invoice.supplierGSTIN || invoice.tenant.gstin || undefined,
      customerName,
      customerAddress,
      customerCity,
      customerState,
      customerPostalCode,
      customerGSTIN,
      placeOfSupply: invoice.placeOfSupply || undefined,
      reverseCharge: invoice.reverseCharge || false,
      items: invoiceItems,
      subtotal: invoice.subtotal,
      gst: gstCalculation,
      total: invoice.total,
      notes: invoice.notes || undefined,
      terms: invoice.termsAndConditions || invoice.terms || undefined,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    console.error('Generate invoice PDF error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    )
  }
}

