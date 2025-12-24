import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import * as XLSX from 'xlsx'

const employeeRowSchema = z.object({
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  officialEmail: z.string().email(),
  personalEmail: z.string().email().optional(),
  mobileCountryCode: z.string().default('+91'),
  mobileNumber: z.string().min(10),
  joiningDate: z.string(),
  department: z.string().optional(),
  designation: z.string().optional(),
  location: z.string().optional(),
  managerCode: z.string().optional(),
  ctcAnnualInr: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'PROBATION', 'NOTICE', 'EXITED']).default('ACTIVE'),
})

// POST /api/hr/employees/bulk-import - Bulk import employees from Excel/CSV
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireHRAccess(request)

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

    // Validate and process rows
    const results = {
      success: [] as any[],
      errors: [] as Array<{ row: number; error: string }>,
    }

    // Get master data for lookup
    const [departments, designations, locations, employees] = await Promise.all([
      prisma.department.findMany({ where: { tenantId: tenantId } }),
      prisma.designation.findMany({ where: { tenantId: tenantId } }),
      prisma.location.findMany({ where: { tenantId: tenantId } }),
      prisma.employee.findMany({ where: { tenantId: tenantId } }),
    ])

    const departmentMap = new Map(departments.map(d => [d.name.toLowerCase(), d.id]))
    const designationMap = new Map(designations.map(d => [d.name.toLowerCase(), d.id]))
    const locationMap = new Map(locations.map(l => [l.name.toLowerCase(), l.id]))
    const employeeMap = new Map(employees.map(e => [e.employeeCode, e.id]))

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any
      const rowNumber = i + 2 // +2 because Excel rows start at 1 and we have header

      try {
        // Normalize row data
        const normalizedRow = {
          employeeCode: String(row.employeeCode || row['Employee Code'] || '').trim(),
          firstName: String(row.firstName || row['First Name'] || '').trim(),
          lastName: String(row.lastName || row['Last Name'] || '').trim(),
          officialEmail: String(row.officialEmail || row['Official Email'] || row.email || '').trim(),
          personalEmail: row.personalEmail || row['Personal Email'] || null,
          mobileCountryCode: row.mobileCountryCode || row['Mobile Country Code'] || '+91',
          mobileNumber: String(row.mobileNumber || row['Mobile Number'] || row.phone || '').trim(),
          joiningDate: row.joiningDate || row['Joining Date'] || new Date().toISOString(),
          department: row.department || row['Department'] || null,
          designation: row.designation || row['Designation'] || null,
          location: row.location || row['Location'] || null,
          managerCode: row.managerCode || row['Manager Code'] || null,
          ctcAnnualInr: row.ctcAnnualInr || row['CTC (INR)'] || null,
          status: row.status || row['Status'] || 'ACTIVE',
        }

        // Validate row
        const validated = employeeRowSchema.parse(normalizedRow)

        // Check for duplicate employee code
        const existingCode = await prisma.employee.findFirst({
          where: {
            tenantId: tenantId,
            employeeCode: validated.employeeCode,
          },
        })

        if (existingCode) {
          results.errors.push({
            row: rowNumber,
            error: `Employee code ${validated.employeeCode} already exists`,
          })
          continue
        }

        // Check for duplicate email
        const existingEmail = await prisma.employee.findFirst({
          where: {
            tenantId: tenantId,
            officialEmail: validated.officialEmail,
          },
        })

        if (existingEmail) {
          results.errors.push({
            row: rowNumber,
            error: `Email ${validated.officialEmail} already exists`,
          })
          continue
        }

        // Resolve master data IDs
        const departmentId = validated.department
          ? departmentMap.get(validated.department.toLowerCase())
          : null
        const designationId = validated.designation
          ? designationMap.get(validated.designation.toLowerCase())
          : null
        const locationId = validated.location
          ? locationMap.get(validated.location.toLowerCase())
          : null
        const managerId = validated.managerCode
          ? employeeMap.get(validated.managerCode)
          : null

        // Create employee
        const employee = await prisma.employee.create({
          data: {
            employeeCode: validated.employeeCode,
            firstName: validated.firstName,
            lastName: validated.lastName,
            officialEmail: validated.officialEmail,
            personalEmail: validated.personalEmail,
            mobileCountryCode: validated.mobileCountryCode,
            mobileNumber: validated.mobileNumber,
            joiningDate: new Date(validated.joiningDate),
            departmentId,
            designationId,
            locationId,
            managerId,
            ctcAnnualInr: validated.ctcAnnualInr ? new Decimal(validated.ctcAnnualInr.toString()) : null,
            status: validated.status,
            tenantId: tenantId,
            createdBy: userId,
            updatedBy: userId,
          },
        })

        // Create audit log
        await prisma.auditLog.create({
          data: {
            entityType: 'Employee',
            entityId: employee.id,
            changedBy: userId,
            changeSummary: `Employee imported: ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
            tenantId: tenantId,
          },
        })

        results.success.push({
          row: rowNumber,
          employeeCode: employee.employeeCode,
          name: `${employee.firstName} ${employee.lastName}`,
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          results.errors.push({
            row: rowNumber,
            error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
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
      message: `Imported ${results.success.length} employees`,
      success: results.success.length,
      errors: results.errors.length,
      details: results,
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Failed to import employees' },
      { status: 500 }
    )
  }
}
