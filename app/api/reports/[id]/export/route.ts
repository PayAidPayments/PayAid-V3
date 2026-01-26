/**
 * Report Export API
 * GET /api/reports/[id]/export - Export report to PDF/Excel/CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { ReportEngineService } from '@/lib/reporting/report-engine'
import { ReportExportsService } from '@/lib/reporting/report-exports'

// GET /api/reports/[id]/export - Export report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const format = (searchParams.get('format') || 'pdf') as 'pdf' | 'excel' | 'csv'

    const report = await prisma.customReport.findFirst({
      where: { id: params.id, tenantId },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Execute report
    const config = {
      dataSource: report.reportType as any,
      filters: (report.filters as any) || [],
      columns: (report.columns as any) || [],
      grouping: (report.grouping as any),
      sorting: (report.sorting as any),
    }

    const results = await ReportEngineService.executeReport(tenantId, config)

    // Export report
    const fileUrl = await ReportExportsService.exportReport(
      tenantId,
      params.id,
      results,
      format
    )

    return NextResponse.json({
      success: true,
      data: {
        fileUrl,
        format,
        downloadUrl: fileUrl,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Export report error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export report' },
      { status: 500 }
    )
  }
}
