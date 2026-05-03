import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/gst/gstr-1 - Generate GSTR-1 (Sales Register)
export async function GET(request: NextRequest) {
  try {
    // Check Finance module license (GST reports are part of finance)
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // Get all invoices for the month
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenantId,
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'cancelled' },
      },
      include: {
        customer: true,
      },
    })

    // Group by GSTIN (B2B) or state (B2C)
    const b2b: Record<string, any[]> = {}
    const b2c: any[] = []

    invoices.forEach(invoice => {
      // Get GSTIN from invoice (customerGSTIN) or from customer contact (gstin)
      // Note: customerGSTIN is on Invoice, gstin is on Contact
      const gstin: string | null = invoice.customerGSTIN || invoice.customer?.gstin || null
      if (gstin) {
        if (!b2b[gstin]) {
          b2b[gstin] = []
        }
        b2b[gstin].push({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          amount: invoice.subtotal,
          gst: invoice.gstAmount || 0,
          total: invoice.total,
        })
      } else {
        b2c.push({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          amount: invoice.subtotal,
          gst: invoice.gstAmount || 0,
          total: invoice.total,
        })
      }
    })

    // Calculate totals
    const b2bTotal = Object.values(b2b).flat().reduce((sum, inv) => sum + inv.total, 0)
    const b2cTotal = b2c.reduce((sum, inv) => sum + inv.total, 0)
    const totalGST = invoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0)

    return NextResponse.json({
      filingPeriod: `${month}/${year}`,
      b2b: Object.entries(b2b).map(([gstin, invoices]) => ({
        gstin,
        invoices,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
        totalGST: invoices.reduce((sum, inv) => sum + inv.gst, 0),
        total: invoices.reduce((sum, inv) => sum + inv.total, 0),
      })),
      b2c: {
        invoices: b2c,
        totalAmount: b2c.reduce((sum, inv) => sum + inv.amount, 0),
        totalGST: b2c.reduce((sum, inv) => sum + inv.gst, 0),
        total: b2cTotal,
      },
      summary: {
        totalInvoices: invoices.length,
        totalAmount: b2bTotal + b2cTotal,
        totalGST,
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Generate GSTR-1 error:', error)
    return NextResponse.json(
      { error: 'Failed to generate GSTR-1' },
      { status: 500 }
    )
  }
}

