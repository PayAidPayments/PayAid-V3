import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getEmployeeForUser } from '@/lib/hr/ess-resolver'

/**
 * GET /api/hr/ess/approvals
 * Mobile ESS: pending items for current user (as manager/approver) - leave requests, reimbursements
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const employee = await getEmployeeForUser(tenantId, userId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })
    }

    const [leaveRequests, expenses] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          employee: { managerId: employee.id },
        },
        include: {
          employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
          leaveType: { select: { name: true } },
        },
        take: 20,
      }),
      prisma.expense.findMany({
        where: {
          tenantId,
          status: 'pending',
          employee: { managerId: employee.id },
        },
        include: {
          employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
        },
        take: 20,
      }),
    ])

    return NextResponse.json({
      leaveRequests: leaveRequests.map((lr) => ({
        id: lr.id,
        type: 'LEAVE',
        employeeName: `${lr.employee.firstName} ${lr.employee.lastName}`,
        employeeCode: lr.employee.employeeCode,
        detail: `${lr.leaveType.name}: ${lr.startDate.toISOString().slice(0, 10)} to ${lr.endDate.toISOString().slice(0, 10)}`,
        days: Number(lr.days),
        createdAt: lr.createdAt.toISOString(),
      })),
      reimbursements: expenses.map((e) => ({
        id: e.id,
        type: 'REIMBURSEMENT',
        employeeName: e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : '',
        employeeCode: e.employee?.employeeCode,
        detail: e.description,
        amount: Number(e.amount),
        createdAt: e.createdAt.toISOString(),
      })),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
