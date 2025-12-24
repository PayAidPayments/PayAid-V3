import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/hr/attendance/calendar - Get attendance calendar
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    endDate.setHours(23, 59, 59, 999)

    // Get attendance records for the month
    const records = await prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    })

    // Get holidays for the month
    const holidays = await prisma.holidayCalendar.findMany({
      where: {
        tenantId: tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Build calendar data
    const calendar: Record<string, any> = {}
    const daysInMonth = endDate.getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dateStr = date.toISOString().split('T')[0]

      const record = records.find((r) => {
        const recordDate = new Date(r.date)
        return recordDate.getDate() === day
      })

      const holiday = holidays.find((h) => {
        const holidayDate = new Date(h.date)
        return holidayDate.getDate() === day
      })

      calendar[dateStr] = {
        date: dateStr,
        day,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        isOptional: holiday?.isOptional || false,
        attendance: record
          ? {
              status: record.status,
              checkInTime: record.checkInTime?.toISOString(),
              checkOutTime: record.checkOutTime?.toISOString(),
              workHours: record.workHours,
            }
          : null,
      }
    }

    // Calculate statistics
    const presentDays = records.filter((r) => r.status === 'PRESENT').length
    const absentDays = records.filter((r) => r.status === 'ABSENT').length
    const halfDays = records.filter((r) => r.status === 'HALF_DAY').length
    const totalWorkingDays = daysInMonth - holidays.filter((h) => !h.isOptional).length
    const totalWorkHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0)

    return NextResponse.json({
      calendar,
      statistics: {
        presentDays,
        absentDays,
        halfDays,
        totalWorkingDays,
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        holidays: holidays.filter((h) => !h.isOptional).length,
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get attendance calendar error:', error)
    return NextResponse.json(
      { error: 'Failed to get attendance calendar' },
      { status: 500 }
    )
  }
}
