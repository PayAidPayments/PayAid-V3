import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const reportConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dataSource: z.enum(['EMPLOYEES', 'PAYROLL', 'ATTENDANCE', 'LEAVES', 'REIMBURSEMENTS', 'PERFORMANCE']),
  filters: z.record(z.any()).optional(),
  columns: z.array(z.string()).min(1),
  calculations: z.array(z.object({
    field: z.string(),
    formula: z.string(),
    label: z.string(),
  })).optional(),
  groupBy: z.array(z.string()).optional(),
  sortBy: z.array(z.object({
    field: z.string(),
    direction: z.enum(['ASC', 'DESC']),
  })).optional(),
  format: z.enum(['TABLE', 'CHART', 'BOTH']).default('TABLE'),
  chartType: z.enum(['BAR', 'LINE', 'PIE', 'AREA']).optional(),
})

/**
 * POST /api/hr/reports/builder
 * Create a custom report
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = reportConfigSchema.parse(body)

    // Create report configuration
    const report = await prisma.customReport.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description || null,
        reportType: validated.dataSource,
        filters: validated.filters || {},
        columns: validated.columns,
        grouping: validated.groupBy || null,
        sorting: validated.sortBy || null,
      },
    })

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid report configuration', details: error.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(error)
  }
}

/**
 * GET /api/hr/reports/builder
 * List custom reports
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const dataSource = searchParams.get('dataSource')

    const where: any = { tenantId }
    if (dataSource) where.dataSource = dataSource

    const [reports, total] = await Promise.all([
      prisma.customReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customReport.count({ where }),
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
