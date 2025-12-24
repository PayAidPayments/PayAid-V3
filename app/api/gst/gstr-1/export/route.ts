import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import * as XLSX from 'xlsx'

// GET /api/gst/gstr-1/export?month=1&year=2025&format=excel
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const format = searchParams.get('format') || 'excel'

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
      if (invoice.customer?.customerGSTIN) {
        const gstin = invoice.customer.customerGSTIN
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

    if (format === 'excel') {
      // Create Excel workbook
      const workbook = XLSX.utils.book_new()

      // B2B Sheet
      const b2bData: any[] = []
      Object.entries(b2b).forEach(([gstin, invoices]) => {
        invoices.forEach((inv, idx) => {
          b2bData.push({
            'GSTIN': idx === 0 ? gstin : '',
            'Invoice Number': inv.invoiceNumber,
            'Invoice Date': new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
            'Taxable Amount': inv.amount,
            'GST Amount': inv.gst,
            'Total Amount': inv.total,
          })
        })
      })

      if (b2bData.length > 0) {
        const b2bSheet = XLSX.utils.json_to_sheet(b2bData)
        XLSX.utils.book_append_sheet(workbook, b2bSheet, 'B2B Invoices')
      }

      // B2C Sheet
      if (b2c.length > 0) {
        const b2cData = b2c.map(inv => ({
          'Invoice Number': inv.invoiceNumber,
          'Invoice Date': new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
          'Taxable Amount': inv.amount,
          'GST Amount': inv.gst,
          'Total Amount': inv.total,
        }))
        const b2cSheet = XLSX.utils.json_to_sheet(b2cData)
        XLSX.utils.book_append_sheet(workbook, b2cSheet, 'B2C Invoices')
      }

      // Summary Sheet
      const totalB2B = Object.values(b2b).flat().reduce((sum, inv) => sum + inv.total, 0)
      const totalB2C = b2c.reduce((sum, inv) => sum + inv.total, 0)
      const summaryData = [
        { 'Category': 'B2B Invoices', 'Total Amount': totalB2B },
        { 'Category': 'B2C Invoices', 'Total Amount': totalB2C },
        { 'Category': 'Grand Total', 'Total Amount': totalB2B + totalB2C },
      ]
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="GSTR-1-${month}-${year}.xlsx"`,
        },
      })
    } else {
      // PDF export would go here (using pdfkit)
      return NextResponse.json(
        { error: 'PDF export not yet implemented' },
        { status: 501 }
      )
    }
  } catch (error: any) {
    console.error('GSTR-1 export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export GSTR-1' },
      { status: 500 }
    )
  }
}

