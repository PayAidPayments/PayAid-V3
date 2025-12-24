import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import * as XLSX from 'xlsx'

// GET /api/gst/gstr-3b/export?month=1&year=2025&format=excel
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const format = searchParams.get('format') || 'excel'

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // Get outward supplies (sales/invoices)
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenantId,
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'cancelled' },
      },
    })

    // Get inward supplies (expenses/purchases)
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId: tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Calculate totals
    const outwardSupplies = {
      taxable: invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0),
      gst: invoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0),
    }

    const inwardSupplies = {
      taxable: expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
      gst: expenses.reduce((sum, exp) => sum + (exp.gstAmount || 0), 0),
    }

    const inputTaxCredit = inwardSupplies.gst
    const netGSTPayable = outwardSupplies.gst - inputTaxCredit

    if (format === 'excel') {
      // Create Excel workbook
      const workbook = XLSX.utils.book_new()

      // Summary Sheet
      const summaryData = [
        { 'Description': 'Outward Supplies - Taxable Value', 'Amount': outwardSupplies.taxable },
        { 'Description': 'Outward Supplies - GST Collected', 'Amount': outwardSupplies.gst },
        { 'Description': 'Inward Supplies - Taxable Value', 'Amount': inwardSupplies.taxable },
        { 'Description': 'Inward Supplies - Input Tax Credit', 'Amount': inputTaxCredit },
        { 'Description': 'Net GST Payable', 'Amount': netGSTPayable },
      ]
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

      // Outward Supplies Sheet
      const outwardData = invoices.map(inv => ({
        'Invoice Number': inv.invoiceNumber,
        'Invoice Date': new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
        'Taxable Amount': inv.subtotal || 0,
        'GST Amount': inv.gstAmount || 0,
        'Total Amount': inv.total || 0,
      }))
      if (outwardData.length > 0) {
        const outwardSheet = XLSX.utils.json_to_sheet(outwardData)
        XLSX.utils.book_append_sheet(workbook, outwardSheet, 'Outward Supplies')
      }

      // Inward Supplies Sheet
      const inwardData = expenses.map(exp => ({
        'Expense Description': exp.description || '',
        'Date': new Date(exp.date).toLocaleDateString('en-IN'),
        'Taxable Amount': exp.amount || 0,
        'GST Amount': exp.gstAmount || 0,
        'Total Amount': (exp.amount || 0) + (exp.gstAmount || 0),
      }))
      if (inwardData.length > 0) {
        const inwardSheet = XLSX.utils.json_to_sheet(inwardData)
        XLSX.utils.book_append_sheet(workbook, inwardSheet, 'Inward Supplies')
      }

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="GSTR-3B-${month}-${year}.xlsx"`,
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
    console.error('GSTR-3B export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export GSTR-3B' },
      { status: 500 }
    )
  }
}

