import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const shareReportSchema = z.object({
  userIds: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
})

// PATCH /api/reports/[id]/share - Share a report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')
    const resolvedParams = await Promise.resolve(params)
    const reportId = resolvedParams.id

    const body = await request.json()
    const validated = shareReportSchema.parse(body)

    // Verify report ownership
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        tenantId,
        createdById: userId,
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found or access denied' },
        { status: 404 }
      )
    }

    // Update report sharing settings
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        isPublic: validated.isPublic ?? report.isPublic,
      },
    })

    return NextResponse.json({ report: updatedReport })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Share report error:', error)
    return NextResponse.json(
      { error: 'Failed to share report' },
      { status: 500 }
    )
  }
}

