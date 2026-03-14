import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getEmployeeForUser } from '@/lib/hr/ess-resolver'

/**
 * GET /api/approvals
 * Aggregated pending items for the current user: expenses, leave requests, purchase orders.
 * Reuses existing "pending approval" data; used by Approvals hub UI.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'finance')
    const employee = await getEmployeeForUser(tenantId, userId)

    const [expenses, leaveRequests, purchaseOrders] = await Promise.all([
      prisma.expense.findMany({
        where: {
          tenantId,
          status: 'pending',
          ...(employee ? { employee: { managerId: employee.id } } : {}),
        },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      employee
        ? prisma.leaveRequest.findMany({
            where: {
              tenantId,
              status: 'PENDING',
              employee: { managerId: employee.id },
            },
            include: {
              employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
              leaveType: { select: { name: true } },
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
          })
        : [],
      prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          status: 'PENDING_APPROVAL',
        },
        include: {
          vendor: { select: { id: true, name: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      expenses: expenses.map((e) => ({
        id: e.id,
        type: 'expense',
        title: e.description,
        amount: Number(e.amount),
        requester: e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : '',
        createdAt: e.createdAt.toISOString(),
      })),
      leaveRequests: leaveRequests.map((lr) => ({
        id: lr.id,
        type: 'leave',
        title: `${lr.leaveType?.name ?? 'Leave'}: ${lr.startDate.toISOString().slice(0, 10)} - ${lr.endDate.toISOString().slice(0, 10)}`,
        days: Number(lr.days),
        requester: `${lr.employee.firstName} ${lr.employee.lastName}`,
        createdAt: lr.createdAt.toISOString(),
      })),
      purchaseOrders: purchaseOrders.map((po) => ({
        id: po.id,
        type: 'purchase_order',
        title: `PO ${po.poNumber ?? po.id.slice(0, 8)} - ${po.vendor?.name ?? 'Vendor'}`,
        total: Number(po.total ?? 0),
        createdAt: po.createdAt.toISOString(),
      })),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
