import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getPayrollJournalEntries, formatTallyExportAsCSV, formatTallyExportAsXML } from '@/lib/hr/tally-export'

/** GET /api/hr/tally/export/payroll?cycleId=xxx or ?month=2&year=2026. Export format=csv or json */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId') ?? undefined
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const format = searchParams.get('format') || 'json'

    const { entries, summary } = await getPayrollJournalEntries(tenantId, {
      cycleId,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
    })

    if (format === 'csv') {
      const csv = formatTallyExportAsCSV(entries)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tally-payroll-${year || ''}-${month || ''}.csv"`,
        },
      })
    }
    if (format === 'xml') {
      const xml = formatTallyExportAsXML(entries)
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="tally-payroll-${year || ''}-${month || ''}.xml"`,
        },
      })
    }
    return NextResponse.json({ entries, summary })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
