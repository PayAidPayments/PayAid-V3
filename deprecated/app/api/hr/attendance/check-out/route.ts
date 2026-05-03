import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const checkOutSchema = z.object({
  employeeId: z.string(),
  checkOutTime: z.string().datetime().optional(),
  remarks: z.string().optional(),
})

// POST /api/hr/attendance/check-out - Check out an employee
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = checkOutSchema.parse(body)

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: {
        id: validated.employeeId,
        tenantId: tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Find today's attendance record
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const attendanceRecord = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: validated.employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (!attendanceRecord) {
      return NextResponse.json(
        { error: 'No check-in record found for today' },
        { status: 400 }
      )
    }

    if (attendanceRecord.checkOutTime) {
      return NextResponse.json(
        { error: 'Employee already checked out today' },
        { status: 400 }
      )
    }

    const checkOutTime = validated.checkOutTime ? new Date(validated.checkOutTime) : new Date()

    // Calculate work hours
    const checkInTime = attendanceRecord.checkInTime
    if (!checkInTime) {
      return NextResponse.json(
        { error: 'Invalid check-in time' },
        { status: 400 }
      )
    }

    const workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60) // Convert to hours

    // Update attendance record
    const updated = await prisma.attendanceRecord.update({
      where: { id: attendanceRecord.id },
      data: {
        checkOutTime,
        workHours,
        remarks: validated.remarks || attendanceRecord.remarks,
        status: workHours >= 8 ? 'PRESENT' : workHours >= 4 ? 'HALF_DAY' : 'ABSENT',
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Check-out error:', error)
    return NextResponse.json(
      { error: 'Failed to check out' },
      { status: 500 }
    )
  }
}
