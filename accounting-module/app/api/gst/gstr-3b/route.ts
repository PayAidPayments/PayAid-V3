import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/gst/gstr-3b - Generate GSTR-3B (Summary Return)
export async function GET(request: NextRequest) {
  try {
    // Check Accounting module license (GST reports are part of accounting)
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // Get GSTR-1 data (sales)
    const salesInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenantId,
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'cancelled' },
      },
    })

    const outwardSupplies = {
      taxable: salesInvoices.reduce((sum, inv) => sum + inv.subtotal, 0),
      gst: salesInvoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0),
    }

    // Get GSTR-2B data (purchases) - would come from expenses/bills
    const inwardSupplies = {
      taxable: 0, // Would come from purchase bills
      gst: 0, // Input Tax Credit
    }

    // Calculate net GST payable
    const netGSTPayable = outwardSupplies.gst - inwardSupplies.gst

    return NextResponse.json({
      filingPeriod: `${month}/${year}`,
      outwardSupplies,
      inwardSupplies,
      netGSTPayable: Math.max(0, netGSTPayable),
      inputTaxCredit: inwardSupplies.gst,
      summary: {
        totalSales: outwardSupplies.taxable,
        totalPurchases: inwardSupplies.taxable,
        gstPayable: netGSTPayable,
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Generate GSTR-3B error:', error)
    return NextResponse.json(
      { error: 'Failed to generate GSTR-3B' },
      { status: 500 }
    )
  }
}

