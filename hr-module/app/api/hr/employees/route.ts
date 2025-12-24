import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createEmployeeSchema = z.object({
  // Basic Information
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  officialEmail: z.string().email(),
  personalEmail: z.string().email().optional(),
  mobileCountryCode: z.string().default('+91'),
  mobileNumber: z.string().min(10),
  
  // Employment Details
  joiningDate: z.string().datetime(),
  probationEndDate: z.string().datetime().optional(),
  confirmationDate: z.string().datetime().optional(),
  exitDate: z.string().datetime().optional(),
  exitReason: z.string().optional(),
  status: z.enum(['ACTIVE', 'PROBATION', 'NOTICE', 'EXITED']).default('ACTIVE'),
  
  // Organization Structure
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  managerId: z.string().optional(),
  locationId: z.string().optional(),
  
  // Compensation (all in ₹)
  ctcAnnualInr: z.number().positive().optional(),
  fixedComponentInr: z.number().positive().optional(),
  variableComponentInr: z.number().positive().optional(),
  
  // Bank Details (will be encrypted)
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  accountType: z.enum(['SAVINGS', 'CURRENT']).optional(),
  
  // Government IDs (will be encrypted)
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  esiNumber: z.string().optional(),
  
  // Statutory Applicability
  pfApplicable: z.boolean().default(false),
  esiApplicable: z.boolean().default(false),
  ptApplicable: z.boolean().default(true),
  tdsApplicable: z.boolean().default(true),
})

const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  employeeCode: z.string().min(1).optional(), // Can't change employee code
})

// GET /api/hr/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const departmentId = searchParams.get('departmentId')
    const designationId = searchParams.get('designationId')
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {
      tenantId: tenantId,
    }

    if (departmentId) where.departmentId = departmentId
    if (designationId) where.designationId = designationId
    if (locationId) where.locationId = locationId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { officialEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          designation: {
            select: { id: true, name: true, code: true },
          },
          location: {
            select: { id: true, name: true, city: true, state: true },
          },
          manager: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ])

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get employees error:', error)
    return NextResponse.json(
      { error: 'Failed to get employees' },
      { status: 500 }
    )
  }
}

// POST /api/hr/employees - Create a new employee
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createEmployeeSchema.parse(body)

    // Check for duplicate employee code
    const existingCode = await prisma.employee.findFirst({
      where: {
        tenantId: tenantId,
        employeeCode: validated.employeeCode,
      },
    })

    if (existingCode) {
      return NextResponse.json(
        { error: 'Employee with this code already exists' },
        { status: 400 }
      )
    }

    // Check for duplicate official email
    const existingEmail = await prisma.employee.findFirst({
      where: {
        tenantId: tenantId,
        officialEmail: validated.officialEmail,
      },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Employee with this email already exists' },
        { status: 400 }
      )
    }

    // Generate employee code if not provided (format: EMP-001, EMP-002, etc.)
    let employeeCode = validated.employeeCode
    if (!employeeCode) {
      const count = await prisma.employee.count({
        where: { tenantId: tenantId },
      })
      employeeCode = `EMP-${String(count + 1).padStart(4, '0')}`
    }

    // Prepare data for creation
    const employeeData: any = {
      employeeCode,
      firstName: validated.firstName,
      lastName: validated.lastName,
      officialEmail: validated.officialEmail,
      personalEmail: validated.personalEmail,
      mobileCountryCode: validated.mobileCountryCode,
      mobileNumber: validated.mobileNumber,
      joiningDate: new Date(validated.joiningDate),
      probationEndDate: validated.probationEndDate ? new Date(validated.probationEndDate) : null,
      confirmationDate: validated.confirmationDate ? new Date(validated.confirmationDate) : null,
      exitDate: validated.exitDate ? new Date(validated.exitDate) : null,
      exitReason: validated.exitReason,
      status: validated.status,
      departmentId: validated.departmentId || null,
      designationId: validated.designationId || null,
      managerId: validated.managerId || null,
      locationId: validated.locationId || null,
      ctcAnnualInr: validated.ctcAnnualInr ? new Decimal(validated.ctcAnnualInr.toString()) : null,
      fixedComponentInr: validated.fixedComponentInr ? new Decimal(validated.fixedComponentInr.toString()) : null,
      variableComponentInr: validated.variableComponentInr ? new Decimal(validated.variableComponentInr.toString()) : null,
      bankAccountNumber: validated.bankAccountNumber, // TODO: Encrypt
      ifscCode: validated.ifscCode, // TODO: Encrypt
      bankName: validated.bankName,
      accountType: validated.accountType,
      panNumber: validated.panNumber, // TODO: Encrypt
      aadhaarNumber: validated.aadhaarNumber, // TODO: Encrypt
      uanNumber: validated.uanNumber,
      esiNumber: validated.esiNumber,
      pfApplicable: validated.pfApplicable,
      esiApplicable: validated.esiApplicable,
      ptApplicable: validated.ptApplicable,
      tdsApplicable: validated.tdsApplicable,
      tenantId: tenantId,
      createdBy: userId,
      updatedBy: userId,
    }

    const employee = await prisma.employee.create({
      data: employeeData,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        designation: {
          select: { id: true, name: true, code: true },
        },
        location: {
          select: { id: true, name: true, city: true, state: true },
        },
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
        changeSummary: `Employee created: ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    console.error('Create employee error:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
