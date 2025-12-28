import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateEmployeeSchema = z.object({
  // Basic Information
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  officialEmail: z.string().email().optional(),
  personalEmail: z.string().email().optional(),
  mobileCountryCode: z.string().optional(),
  mobileNumber: z.string().min(10).optional(),
  
  // Employment Details
  joiningDate: z.string().datetime().optional(),
  probationEndDate: z.string().datetime().optional().nullable(),
  confirmationDate: z.string().datetime().optional().nullable(),
  exitDate: z.string().datetime().optional().nullable(),
  exitReason: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'PROBATION', 'NOTICE', 'EXITED']).optional(),
  
  // Organization Structure
  departmentId: z.string().optional().nullable(),
  designationId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  
  // Compensation
  ctcAnnualInr: z.number().positive().optional().nullable(),
  fixedComponentInr: z.number().positive().optional().nullable(),
  variableComponentInr: z.number().positive().optional().nullable(),
  
  // Bank Details
  bankAccountNumber: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountType: z.enum(['SAVINGS', 'CURRENT']).optional().nullable(),
  
  // Government IDs
  panNumber: z.string().optional().nullable(),
  aadhaarNumber: z.string().optional().nullable(),
  uanNumber: z.string().optional().nullable(),
  esiNumber: z.string().optional().nullable(),
  
  // Statutory Applicability
  pfApplicable: z.boolean().optional(),
  esiApplicable: z.boolean().optional(),
  ptApplicable: z.boolean().optional(),
  tdsApplicable: z.boolean().optional(),
})

// GET /api/hr/employees/[id] - Get a single employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        department: true,
        designation: true,
        location: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        reports: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(employee)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get employee error:', error)
    return NextResponse.json(
      { error: 'Failed to get employee' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/employees/[id] - Update an employee
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    // Check if employee exists
    const existing = await prisma.employee.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateEmployeeSchema.parse(body)

    // Check for duplicate email if email is being updated
    if (validated.officialEmail && validated.officialEmail !== existing.officialEmail) {
      const emailExists = await prisma.employee.findFirst({
        where: {
          tenantId: tenantId,
          officialEmail: validated.officialEmail,
          id: { not: params.id },
        },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Employee with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: userId,
    }

    if (validated.firstName !== undefined) updateData.firstName = validated.firstName
    if (validated.lastName !== undefined) updateData.lastName = validated.lastName
    if (validated.officialEmail !== undefined) updateData.officialEmail = validated.officialEmail
    if (validated.personalEmail !== undefined) updateData.personalEmail = validated.personalEmail
    if (validated.mobileCountryCode !== undefined) updateData.mobileCountryCode = validated.mobileCountryCode
    if (validated.mobileNumber !== undefined) updateData.mobileNumber = validated.mobileNumber
    if (validated.joiningDate !== undefined) updateData.joiningDate = new Date(validated.joiningDate)
    if (validated.probationEndDate !== undefined) updateData.probationEndDate = validated.probationEndDate ? new Date(validated.probationEndDate) : null
    if (validated.confirmationDate !== undefined) updateData.confirmationDate = validated.confirmationDate ? new Date(validated.confirmationDate) : null
    if (validated.exitDate !== undefined) updateData.exitDate = validated.exitDate ? new Date(validated.exitDate) : null
    if (validated.exitReason !== undefined) updateData.exitReason = validated.exitReason
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.departmentId !== undefined) updateData.departmentId = validated.departmentId
    if (validated.designationId !== undefined) updateData.designationId = validated.designationId
    if (validated.managerId !== undefined) updateData.managerId = validated.managerId
    if (validated.locationId !== undefined) updateData.locationId = validated.locationId
    if (validated.ctcAnnualInr !== undefined) updateData.ctcAnnualInr = validated.ctcAnnualInr ? new Decimal(validated.ctcAnnualInr.toString()) : null
    if (validated.fixedComponentInr !== undefined) updateData.fixedComponentInr = validated.fixedComponentInr ? new Decimal(validated.fixedComponentInr.toString()) : null
    if (validated.variableComponentInr !== undefined) updateData.variableComponentInr = validated.variableComponentInr ? new Decimal(validated.variableComponentInr.toString()) : null
    if (validated.bankAccountNumber !== undefined) updateData.bankAccountNumber = validated.bankAccountNumber // TODO: Encrypt
    if (validated.ifscCode !== undefined) updateData.ifscCode = validated.ifscCode // TODO: Encrypt
    if (validated.bankName !== undefined) updateData.bankName = validated.bankName
    if (validated.accountType !== undefined) updateData.accountType = validated.accountType
    if (validated.panNumber !== undefined) updateData.panNumber = validated.panNumber // TODO: Encrypt
    if (validated.aadhaarNumber !== undefined) updateData.aadhaarNumber = validated.aadhaarNumber // TODO: Encrypt
    if (validated.uanNumber !== undefined) updateData.uanNumber = validated.uanNumber
    if (validated.esiNumber !== undefined) updateData.esiNumber = validated.esiNumber
    if (validated.pfApplicable !== undefined) updateData.pfApplicable = validated.pfApplicable
    if (validated.esiApplicable !== undefined) updateData.esiApplicable = validated.esiApplicable
    if (validated.ptApplicable !== undefined) updateData.ptApplicable = validated.ptApplicable
    if (validated.tdsApplicable !== undefined) updateData.tdsApplicable = validated.tdsApplicable

    // Get before snapshot for audit
    const beforeSnapshot = JSON.stringify(existing)

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: updateData,
      include: {
        department: true,
        designation: true,
        location: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Employee',
        entityId: employee.id,
        changedBy: userId,
        changeSummary: `Employee updated: ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
        beforeSnapshot,
        afterSnapshot: JSON.stringify(employee),
        tenantId: tenantId,
      },
    })

    return NextResponse.json(employee)
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

    console.error('Update employee error:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

// DELETE /api/hr/employees/[id] - Delete an employee (soft delete by setting status to EXITED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Soft delete: Set status to EXITED
    const updated = await prisma.employee.update({
      where: { id: params.id },
      data: {
        status: 'EXITED',
        exitDate: new Date(),
        updatedBy: userId,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Employee',
        entityId: employee.id,
        changedBy: userId,
        changeSummary: `Employee deleted (soft): ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
