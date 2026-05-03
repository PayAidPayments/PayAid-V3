/**
 * Report Execution API
 * POST /api/reports/[id]/execute - Execute custom report
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { ReportEngineService } from '@/lib/reporting/report-engine'

// POST /api/reports/[id]/execute - Execute report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const report = await prisma.customReport.findFirst({
      where: { id: params.id, tenantId },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Build report config from stored report
    const config = {
      dataSource: report.reportType as any,
      filters: (report.filters as any) || [],
      columns: (report.columns as any) || [],
      grouping: (report.grouping as any),
      sorting: (report.sorting as any),
    }

    const results = await ReportEngineService.executeReport(tenantId, config)

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Execute report error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute report' },
      { status: 500 }
    )
  }
}
