import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/onboarding/instances
 * Create a new onboarding instance
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { employeeId, templateId, startDate, notes } = body

    // Create onboarding instance
    const onboarding = await prisma.onboardingInstance.create({
      data: {
        tenantId,
        employeeId,
        templateId: templateId || null,
        startDate: new Date(startDate),
        status: 'IN_PROGRESS',
        notes: notes || null,
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

    return NextResponse.json(onboarding, { status: 201 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
