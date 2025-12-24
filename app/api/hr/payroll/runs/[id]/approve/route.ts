import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// PUT /api/hr/payroll/runs/[id]/approve - Approve a payroll run
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const payrollRun = await prisma.payrollRun.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        cycle: true,
      },
    })

    if (!payrollRun) {
      return NextResponse.json(
        { error: 'Payroll run not found' },
        { status: 404 }
      )
    }

    if (payrollRun.cycle.status === 'LOCKED' || payrollRun.cycle.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot approve payroll for locked or paid cycle' },
        { status: 400 }
      )
    }

    const updated = await prisma.payrollRun.update({
      where: { id: resolvedParams.id },
      data: {
        approvedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Approve payroll run error:', error)
    return NextResponse.json(
      { error: 'Failed to approve payroll run' },
      { status: 500 }
    )
  }
}
