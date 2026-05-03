import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getEmployeeForUser } from '@/lib/hr/ess-resolver'

/**
 * GET /api/hr/ess/me
 * Mobile ESS: summary for current employee (leave balance summary, today's attendance, recent payslip)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const employee = await getEmployeeForUser(tenantId, userId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found for this user' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [leaveBalances, attendanceToday, lastPayslip] = await Promise.all([
      prisma.leaveBalance.findMany({
        where: { employeeId: employee.id },
        include: { leaveType: { select: { name: true, code: true } } },
      }),
      prisma.attendanceRecord.findFirst({
        where: { employeeId: employee.id, date: today, tenantId },
      }),
      prisma.payrollRun.findFirst({
        where: { employeeId: employee.id, tenantId },
        include: { cycle: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department?.name,
        designation: employee.designation?.name,
      },
      leaveSummary: leaveBalances.map((b) => ({
        type: b.leaveType.name,
        code: b.leaveType.code,
        balance: Number(b.balance),
      })),
      attendanceToday: attendanceToday
        ? {
            status: attendanceToday.status,
            checkIn: attendanceToday.checkInTime?.toISOString() ?? null,
            checkOut: attendanceToday.checkOutTime?.toISOString() ?? null,
          }
        : null,
      lastPayslip: lastPayslip
        ? {
            month: lastPayslip.cycle.month,
            year: lastPayslip.cycle.year,
            netPayInr: Number(lastPayslip.netPayInr),
          }
        : null,
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
