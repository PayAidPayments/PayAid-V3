import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getTransactionsForTally, formatTransactionsAsCSV } from '@/lib/finance/tally-export'

/** GET /api/finance/tally/export/transactions?fromDate=&toDate=&limit=&format=csv|json */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined
    const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '5000', 10), 10000)

    const { rows, summary } = await getTransactionsForTally(tenantId, {
      fromDate: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
      toDate: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
      limit,
    })

    if (format === 'csv') {
      const csv = formatTransactionsAsCSV(rows)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tally-transactions-${fromDate?.toISOString().slice(0, 10) ?? 'all'}.csv"`,
        },
      })
    }
    return NextResponse.json({ transactions: rows, summary })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
