import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// PUT /api/hr/payroll/cycles/[id]/lock - Lock payroll cycle (prevent further changes)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const cycle = await prisma.payrollCycle.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: { payrollRuns: true },
        },
      },
    })

    if (!cycle) {
      return NextResponse.json(
        { error: 'Payroll cycle not found' },
        { status: 404 }
      )
    }

    if (cycle._count.payrollRuns === 0) {
      return NextResponse.json(
        { error: 'Cannot lock cycle with no payroll runs' },
        { status: 400 }
      )
    }

    const updated = await prisma.payrollCycle.update({
      where: { id: params.id },
      data: {
        status: 'LOCKED',
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Lock payroll cycle error:', error)
    return NextResponse.json(
      { error: 'Failed to lock payroll cycle' },
      { status: 500 }
    )
  }
}
