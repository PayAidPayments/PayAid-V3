import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { generateReportData } from '@/lib/hr/report-generator'

/**
 * POST /api/hr/reports/builder/[id]/generate
 * Generate report data based on saved configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const result = await generateReportData(id, tenantId)
    if (!result) {
      return NextResponse.json({ error: 'Report not found or unsupported data source' }, { status: 404 })
    }

    return NextResponse.json({
      reportId: id,
      reportName: result.reportName,
      data: result.data,
      summary: result.summary,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
