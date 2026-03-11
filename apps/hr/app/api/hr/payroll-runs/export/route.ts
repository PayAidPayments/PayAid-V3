import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/payroll-runs/export?format=csv&cycleId=xxx
 * Export payroll run summary for a cycle (CSV).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const format = request.nextUrl.searchParams.get('format') || 'csv'
    const cycleId = request.nextUrl.searchParams.get('cycleId')

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId required' }, { status: 400 })
    }

    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: cycleId, tenantId },
      include: {
        payrollRuns: {
          include: {
            employee: {
              select: {
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
    }

    if (format === 'csv') {
      const header = 'Employee Code,First Name,Last Name,Gross Earnings,Net Pay,Payout Status\n'
      const rows = cycle.payrollRuns.map(
        (r) =>
          `${r.employee?.employeeCode ?? ''},${r.employee?.firstName ?? ''},${r.employee?.lastName ?? ''},${r.grossEarningsInr},${r.netPayInr},${r.payoutStatus}`
      )
      const csv = header + rows.join('\n')
      const monthName = new Date(cycle.year, cycle.month - 1, 1).toLocaleString('en-IN', { month: 'long' })
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="payroll-${monthName}-${cycle.year}.csv"`,
        },
      })
    }

    return NextResponse.json(cycle)
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
