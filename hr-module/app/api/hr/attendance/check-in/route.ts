import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const checkInSchema = z.object({
  employeeId: z.string(),
  checkInTime: z.string().datetime().optional(),
  checkInLatitude: z.number().optional(),
  checkInLongitude: z.number().optional(),
  remarks: z.string().optional(),
  source: z.enum(['WEB', 'MOBILE', 'BIOMETRIC']).default('WEB'),
})

// POST /api/hr/attendance/check-in - Check in an employee
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = checkInSchema.parse(body)

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

    // Check if already checked in today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: validated.employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (existingRecord && existingRecord.checkInTime) {
      return NextResponse.json(
        { error: 'Employee already checked in today' },
        { status: 400 }
      )
    }

    const checkInTime = validated.checkInTime ? new Date(validated.checkInTime) : new Date()

    // Create or update attendance record
    let attendanceRecord
    if (existingRecord) {
      attendanceRecord = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          checkInTime,
          checkInLatitude: validated.checkInLatitude,
          checkInLongitude: validated.checkInLongitude,
          remarks: validated.remarks,
          source: validated.source,
          status: 'PRESENT',
        },
      })
    } else {
      attendanceRecord = await prisma.attendanceRecord.create({
        data: {
          employeeId: validated.employeeId,
          date: today,
          checkInTime,
          checkInLatitude: validated.checkInLatitude,
          checkInLongitude: validated.checkInLongitude,
          remarks: validated.remarks,
          source: validated.source,
          status: 'PRESENT',
          tenantId: tenantId,
        },
      })
    }

    return NextResponse.json(attendanceRecord, { status: 201 })
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

    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to check in' },
      { status: 500 }
    )
  }
}
