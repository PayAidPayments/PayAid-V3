import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/offboarding/instances
 * Create a new offboarding instance
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { employeeId, exitType, lastWorkingDay, noticePeriod, reason, notes } = body

    // Create offboarding instance
    const offboarding = await prisma.offboardingInstance.create({
      data: {
        tenantId,
        employeeId,
        exitType,
        lastWorkingDay: new Date(lastWorkingDay),
        noticePeriod: noticePeriod || 30,
        reason,
        notes: notes || null,
        status: 'IN_PROGRESS',
        createdBy: userId,
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
    })

    return NextResponse.json(offboarding, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
