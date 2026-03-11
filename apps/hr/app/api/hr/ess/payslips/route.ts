import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getEmployeeForUser } from '@/lib/hr/ess-resolver'

/** GET /api/hr/ess/payslips - List last 12 payslips for current employee (mobile ESS). Authorization: only the linked employee. */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')
    const employee = await getEmployeeForUser(tenantId, userId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found. Link your account to an employee to view payslips.' }, { status: 403 })
    }

    const runs = await prisma.payrollRun.findMany({
      where: { tenantId, employeeId: employee.id },
      include: { cycle: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })

    return NextResponse.json({
      payslips: runs.map((r) => ({
        id: r.id,
        month: r.cycle.month,
        year: r.cycle.year,
        grossEarningsInr: Number(r.grossEarningsInr),
        netPayInr: Number(r.netPayInr),
        payoutStatus: r.payoutStatus,
      })),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
