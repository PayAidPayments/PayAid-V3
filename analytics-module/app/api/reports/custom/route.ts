import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  reportType: z.enum(['sales', 'marketing', 'finance', 'hr', 'custom']),
  filters: z.record(z.any()),
  columns: z.array(z.string()),
  grouping: z.record(z.any()).optional(),
  sorting: z.record(z.any()).optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  scheduleDay: z.number().optional(),
  scheduleTime: z.string().optional(),
  recipients: z.array(z.string().email()).optional(),
  exportFormats: z.array(z.enum(['csv', 'pdf', 'excel'])).optional(),
})

// GET /api/reports/custom - List custom reports
export async function GET(request: NextRequest) {
  try {
    // Check analytics module license
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get('reportType')

    const where: any = {
      tenantId: tenantId,
    }

    if (reportType) where.reportType = reportType

    const reports = await prisma.customReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Get custom reports error:', error)
    return NextResponse.json(
      { error: 'Failed to get custom reports' },
      { status: 500 }
    )
  }
}

// POST /api/reports/custom - Create custom report
export async function POST(request: NextRequest) {
  try {
    // Check analytics module license
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const validated = createReportSchema.parse(body)

    const report = await prisma.customReport.create({
      data: {
        name: validated.name,
        description: validated.description,
        reportType: validated.reportType,
        filters: validated.filters,
        columns: validated.columns,
        grouping: validated.grouping || {},
        sorting: validated.sorting || {},
        scheduleEnabled: validated.scheduleEnabled ?? false,
        scheduleFrequency: validated.scheduleFrequency,
        scheduleDay: validated.scheduleDay,
        scheduleTime: validated.scheduleTime,
        recipients: validated.recipients || [],
        exportFormats: validated.exportFormats || ['csv'],
        tenantId: tenantId,
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create custom report error:', error)
    return NextResponse.json(
      { error: 'Failed to create custom report' },
      { status: 500 }
    )
  }
}
