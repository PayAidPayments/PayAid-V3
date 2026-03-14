import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getCoAForTally, formatCoAAsCSV } from '@/lib/finance/tally-export'

/** GET /api/finance/tally/export/coa?format=csv|json - Export Chart of Accounts for Tally */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const rows = await getCoAForTally(tenantId)

    if (format === 'csv') {
      const csv = formatCoAAsCSV(rows)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="tally-coa.csv"',
        },
      })
    }
    return NextResponse.json({ coa: rows, count: rows.length })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
