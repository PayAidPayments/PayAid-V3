import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getEmployeeForUser } from '@/lib/hr/ess-resolver'

/** GET /api/hr/ess/attendance?days=30 - Last N days attendance for current employee (mobile ESS) */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')
    const employee = await getEmployeeForUser(tenantId, userId)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const daysParam = request.nextUrl.searchParams.get('days') || '30'
    const days = Math.min(90, Math.max(1, parseInt(daysParam, 10)))
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    start.setHours(0, 0, 0, 0)

    const records = await prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        employeeId: employee.id,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({
      attendance: records.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
        checkInTime: r.checkInTime?.toISOString() ?? null,
        checkOutTime: r.checkOutTime?.toISOString() ?? null,
      })),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
