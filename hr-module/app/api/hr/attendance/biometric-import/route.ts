import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import * as XLSX from 'xlsx'
import { z } from 'zod'

const biometricRowSchema = z.object({
  employeeCode: z.string(),
  date: z.string(),
  checkInTime: z.string(),
  checkOutTime: z.string().optional(),
})

// POST /api/hr/attendance/biometric-import - Import attendance from biometric system
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    const results = {
      success: [] as any[],
      errors: [] as Array<{ row: number; error: string }>,
    }

    // Get all employees for lookup
    const employees = await prisma.employee.findMany({
      where: { tenantId: tenantId },
      select: { id: true, employeeCode: true },
    })

    const employeeMap = new Map(employees.map((e) => [e.employeeCode, e.id]))

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any
      const rowNumber = i + 2

      try {
        // Normalize row data
        const normalizedRow = {
          employeeCode: String(row.employeeCode || row['Employee Code'] || '').trim(),
          date: row.date || row['Date'] || row.Date || '',
          checkInTime: row.checkInTime || row['Check In'] || row['Check-In'] || '',
          checkOutTime: row.checkOutTime || row['Check Out'] || row['Check-Out'] || null,
        }

        // Validate row
        const validated = biometricRowSchema.parse(normalizedRow)

        // Find employee
        const employeeId = employeeMap.get(validated.employeeCode)
        if (!employeeId) {
          results.errors.push({
            row: rowNumber,
            error: `Employee code ${validated.employeeCode} not found`,
          })
          continue
        }

        // Parse date and times
        const date = new Date(validated.date)
        date.setHours(0, 0, 0, 0)

        // Parse check-in time (format: HH:MM or HH:MM:SS)
        const checkInParts = validated.checkInTime.split(':')
        const checkInTime = new Date(date)
        checkInTime.setHours(
          parseInt(checkInParts[0]),
          parseInt(checkInParts[1] || '0'),
          parseInt(checkInParts[2] || '0')
        )

        let checkOutTime: Date | null = null
        let workHours: number | null = null

        if (validated.checkOutTime) {
          const checkOutParts = validated.checkOutTime.split(':')
          checkOutTime = new Date(date)
          checkOutTime.setHours(
            parseInt(checkOutParts[0]),
            parseInt(checkOutParts[1] || '0'),
            parseInt(checkOutParts[2] || '0')
          )
          workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
        }

        // Determine status
        let status = 'PRESENT'
        if (workHours !== null) {
          if (workHours >= 8) {
            status = 'PRESENT'
          } else if (workHours >= 4) {
            status = 'HALF_DAY'
          } else {
            status = 'ABSENT'
          }
        }

        // Check if record exists
        const existingRecord = await prisma.attendanceRecord.findFirst({
          where: {
            employeeId,
            date,
            tenantId: tenantId,
          },
        })

        // Create or update attendance record
        let attendanceRecord
        if (existingRecord) {
          attendanceRecord = await prisma.attendanceRecord.update({
            where: { id: existingRecord.id },
            data: {
              checkInTime,
              checkOutTime,
              workHours,
              status,
            },
          })
        } else {
          attendanceRecord = await prisma.attendanceRecord.create({
            data: {
              employeeId,
              date,
              checkInTime,
              checkOutTime,
              workHours,
              status,
              source: 'BIOMETRIC',
              tenantId: tenantId,
            },
          })
        }

        results.success.push({
          row: rowNumber,
          employeeCode: validated.employeeCode,
          date: date.toISOString().split('T')[0],
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          results.errors.push({
            row: rowNumber,
            error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
          })
        } else {
          results.errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    return NextResponse.json({
      message: `Imported ${results.success.length} attendance records`,
      success: results.success.length,
      errors: results.errors.length,
      details: results,
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Biometric import error:', error)
    return NextResponse.json(
      { error: 'Failed to import attendance' },
      { status: 500 }
    )
  }
}
