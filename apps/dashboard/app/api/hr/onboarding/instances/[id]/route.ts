import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/**
 * GET /api/hr/onboarding/instances/[id]
 * Get a single onboarding instance with employee, template, and instance tasks.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params

    const instance = await prisma.onboardingInstance.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            joiningDate: true,
            probationEndDate: true,
            ctcAnnualInr: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            manager: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        template: { select: { id: true, name: true } },
        tasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                assignedToRole: true,
                dueDaysRelative: true,
                order: true,
              },
            },
          },
          orderBy: { task: { order: 'asc' } },
        },
      },
    })

    if (!instance) {
      return NextResponse.json({ error: 'Onboarding instance not found' }, { status: 404 })
    }

    return NextResponse.json(instance)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get onboarding instance error:', error)
    return NextResponse.json(
      { error: 'Failed to get onboarding instance' },
      { status: 500 }
    )
  }
}
