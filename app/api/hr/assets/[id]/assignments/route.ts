import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/assets/[id]/assignments
 * Get assignment history for an asset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params

    const assignments = await prisma.assetAssignment.findMany({
      where: {
        assetId: id,
        tenantId,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { assignedDate: 'desc' },
    })

    return NextResponse.json({ assignments })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
