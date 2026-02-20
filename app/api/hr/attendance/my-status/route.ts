import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/hr/attendance/my-status - Get current employee's attendance status for today
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    // Get user's email for fallback lookup
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userEmail = (user.email || '').trim().toLowerCase()
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found. Please contact support.' },
        { status: 400 }
      )
    }

    // 1) Find employee by linked userId (HR can link in Employee edit)
    let employee = await prisma.employee.findFirst({
      where: {
        userId: userId,
        tenantId: tenantId,
        status: { in: ['ACTIVE', 'PROBATION'] },
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
      },
    })

    // 2) Fallback: find by officialEmail (case-insensitive)
    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: {
          tenantId: tenantId,
          status: { in: ['ACTIVE', 'PROBATION'] },
          OR: [
            { officialEmail: { equals: userEmail, mode: 'insensitive' } },
            { personalEmail: { equals: userEmail, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
        },
      })
    }

    if (!employee) {
      return NextResponse.json(
        {
          error: 'Employee record not found. Please contact HR to link your account.',
          hint: 'Ask HR to set your Official Email to your login email, or to link your user account in the Employee record.',
          loginEmail: userEmail,
        },
        { status: 404 }
      )
    }

    // Get today's attendance record
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const attendanceRecord = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    return NextResponse.json({
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: `${employee.firstName} ${employee.lastName}`,
      },
      today: {
        date: today.toISOString(),
        checkInTime: attendanceRecord?.checkInTime?.toISOString() || null,
        checkOutTime: attendanceRecord?.checkOutTime?.toISOString() || null,
        status: attendanceRecord?.status || null,
        workHours: attendanceRecord?.workHours ? parseFloat(attendanceRecord.workHours.toString()) : null,
      },
      canCheckIn: !attendanceRecord?.checkInTime,
      canCheckOut: !!attendanceRecord?.checkInTime && !attendanceRecord?.checkOutTime,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get attendance status error:', error)
    return NextResponse.json(
      { error: 'Failed to get attendance status' },
      { status: 500 }
    )
  }
}
