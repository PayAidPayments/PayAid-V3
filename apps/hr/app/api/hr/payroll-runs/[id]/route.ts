import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/payroll-runs/[id]
 * Get a payroll cycle by id (with runs summary) or a single PayrollRun.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await context.params

    const cycle = await prisma.payrollCycle.findFirst({
      where: { id, tenantId },
      include: {
        payrollRuns: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                department: { select: { name: true } },
                designation: { select: { name: true } },
              },
            },
          },
          orderBy: { employee: { firstName: 'asc' } },
        },
        _count: { select: { payrollRuns: true } },
      },
    })

    if (cycle) {
      const totalNet = cycle.payrollRuns.reduce((sum, r) => sum + Number(r.netPayInr || 0), 0)
      const totalGross = cycle.payrollRuns.reduce((sum, r) => sum + Number(r.grossEarningsInr || 0), 0)
      const monthName = new Date(cycle.year, cycle.month - 1, 1).toLocaleString('en-IN', { month: 'long' })
      return NextResponse.json({
        id: cycle.id,
        cycleName: `${monthName} ${cycle.year}`,
        month: cycle.month,
        year: cycle.year,
        status: cycle.status,
        runType: cycle.runType,
        employeeCount: cycle._count.payrollRuns,
        totalNetPayInr: totalNet,
        totalGrossEarningsInr: totalGross,
        payrollRuns: cycle.payrollRuns,
        createdAt: cycle.createdAt,
        updatedAt: cycle.updatedAt,
      })
    }

    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
        cycle: true,
      },
    })

    if (run) return NextResponse.json(run)
    return NextResponse.json({ error: 'Payroll run or cycle not found' }, { status: 404 })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
