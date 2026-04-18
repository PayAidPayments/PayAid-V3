import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { parseExcelToRows } from '@/lib/utils/parseExcel'
import { z } from 'zod'

const biometricRowSchema = z.object({
  employeeCode: z.string(),
  date: z.string(),
  checkInTime: z.string(),
  checkOutTime: z.string().optional(),
})

interface PreparedAttendanceRow {
  rowNumber: number
  employeeCode: string
  employeeId: string
  date: Date
  checkInTime: Date
  checkOutTime: Date | null
  workHours: number | null
  status: 'PRESENT' | 'HALF_DAY' | 'ABSENT'
}

const buildAttendanceKey = (employeeId: string, date: Date) => `${employeeId}::${date.getTime()}`

const parseTimeParts = (timeValue: string, fieldName: string) => {
  const parts = String(timeValue || '')
    .trim()
    .split(':')
    .map((part) => Number.parseInt(part, 10))

  if (parts.length < 2 || parts.length > 3 || parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Invalid ${fieldName} format. Expected HH:MM or HH:MM:SS`)
  }

  const [hours, minutes, seconds = 0] = parts
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    throw new Error(`Invalid ${fieldName} value`)
  }

  return { hours, minutes, seconds }
}

// POST /api/hr/attendance/biometric-import - Import attendance from biometric system
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const deviceId = formData.get('deviceId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file
    const buffer = await file.arrayBuffer()
    const rows = (await parseExcelToRows(buffer)) as any[]

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

    const preparedRows: PreparedAttendanceRow[] = []

    // Validate + normalize each row once
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
        if (Number.isNaN(date.getTime())) {
          throw new Error('Invalid date value')
        }
        date.setHours(0, 0, 0, 0)

        // Parse check-in time (format: HH:MM or HH:MM:SS)
        const checkInParts = parseTimeParts(validated.checkInTime, 'check-in time')
        const checkInTime = new Date(date)
        checkInTime.setHours(
          checkInParts.hours,
          checkInParts.minutes,
          checkInParts.seconds
        )

        let checkOutTime: Date | null = null
        let workHours: number | null = null

        if (validated.checkOutTime) {
          const checkOutParts = parseTimeParts(validated.checkOutTime, 'check-out time')
          checkOutTime = new Date(date)
          checkOutTime.setHours(
            checkOutParts.hours,
            checkOutParts.minutes,
            checkOutParts.seconds
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

        preparedRows.push({
          rowNumber,
          employeeCode: validated.employeeCode,
          employeeId,
          date,
          checkInTime,
          checkOutTime,
          workHours,
          status: status as PreparedAttendanceRow['status'],
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

    // Prefetch all existing attendance records once to avoid per-row read queries.
    if (preparedRows.length > 0) {
      const employeeIds = Array.from(new Set(preparedRows.map((row) => row.employeeId)))
      const allDates = preparedRows.map((row) => row.date.getTime())
      const minDate = new Date(Math.min(...allDates))
      const maxDate = new Date(Math.max(...allDates))

      const existingRecords = await prisma.attendanceRecord.findMany({
        where: {
          tenantId,
          employeeId: { in: employeeIds },
          date: { gte: minDate, lte: maxDate },
        },
        select: {
          id: true,
          employeeId: true,
          date: true,
        },
      })

      const existingRecordMap = new Map(
        existingRecords.map((record) => [buildAttendanceKey(record.employeeId, record.date), record.id])
      )

      for (const row of preparedRows) {
        const key = buildAttendanceKey(row.employeeId, row.date)

        try {
          const existingId = existingRecordMap.get(key)
          if (existingId) {
            await prisma.attendanceRecord.update({
              where: { id: existingId },
              data: {
                checkInTime: row.checkInTime,
                checkOutTime: row.checkOutTime,
                workHours: row.workHours,
                status: row.status,
              },
            })
          } else {
            const createdRecord = await prisma.attendanceRecord.create({
              data: {
                employeeId: row.employeeId,
                date: row.date,
                checkInTime: row.checkInTime,
                checkOutTime: row.checkOutTime,
                workHours: row.workHours,
                status: row.status,
                source: 'BIOMETRIC',
                tenantId,
              },
              select: { id: true },
            })
            existingRecordMap.set(key, createdRecord.id)
          }

          results.success.push({
            row: row.rowNumber,
            employeeCode: row.employeeCode,
            date: row.date.toISOString().split('T')[0],
          })
        } catch (error) {
          results.errors.push({
            row: row.rowNumber,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    if (deviceId && results.success.length > 0) {
      await prisma.biometricDevice.updateMany({
        where: { id: deviceId, tenantId },
        data: { lastSyncAt: new Date(), lastRecordCount: results.success.length },
      })
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
