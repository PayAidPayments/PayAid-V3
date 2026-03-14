import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getEmployeeForUser } from '@/lib/hr/ess-resolver'

const applySchema = {
  startDate: (v: string) => new Date(v),
  endDate: (v: string) => new Date(v),
  leaveTypeId: (v: string) => v,
  reason: (v: string) => (v && v.trim() ? v.trim() : null),
  isHalfDay: (v: boolean) => !!v,
}

/** POST /api/hr/ess/leave/apply - Apply leave as current employee (mobile ESS). Body: startDate, endDate, leaveTypeId, reason, isHalfDay? */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')
    const employee = await getEmployeeForUser(tenantId, userId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const body = await request.json()
    const startDate = body.startDate ? new Date(body.startDate) : null
    const endDate = body.endDate ? new Date(body.endDate) : null
    const leaveTypeId = body.leaveTypeId
    const reason = body.reason && String(body.reason).trim() ? String(body.reason).trim() : null
    const isHalfDay = Boolean(body.isHalfDay)

    if (!startDate || !endDate || !leaveTypeId || !reason) {
      return NextResponse.json(
        { error: 'startDate, endDate, leaveTypeId and reason are required' },
        { status: 400 }
      )
    }
    if (endDate < startDate) {
      return NextResponse.json({ error: 'endDate must be on or after startDate' }, { status: 400 })
    }

    const leaveType = await prisma.leaveType.findFirst({
      where: { id: leaveTypeId, tenantId },
    })
    if (!leaveType) {
      return NextResponse.json({ error: 'Leave type not found' }, { status: 404 })
    }

    const days = isHalfDay ? 0.5 : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: employee.id, leaveTypeId },
      orderBy: { asOfDate: 'desc' },
    })
    if (balance && Number(balance.balance) < days) {
      return NextResponse.json(
        { error: `Insufficient leave balance. Available: ${balance.balance} days` },
        { status: 400 }
      )
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: employee.id,
        leaveTypeId,
        startDate,
        endDate,
        days,
        reason,
        status: 'PENDING',
      },
      include: {
        leaveType: { select: { name: true, code: true } },
      },
    })

    return NextResponse.json({
      id: leaveRequest.id,
      status: leaveRequest.status,
      leaveType: leaveRequest.leaveType.name,
      startDate: leaveRequest.startDate.toISOString().slice(0, 10),
      endDate: leaveRequest.endDate.toISOString().slice(0, 10),
      days: Number(leaveRequest.days),
      message: 'Leave request submitted for approval',
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
