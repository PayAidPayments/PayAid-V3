import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createDepartmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/hr/departments - List all departments
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('isActive')

    const where: any = {
      tenantId: tenantId,
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const departments = await prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    })

    return NextResponse.json({ departments })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get departments error:', error)
    return NextResponse.json(
      { error: 'Failed to get departments' },
      { status: 500 }
    )
  }
}

// POST /api/hr/departments - Create a new department
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = createDepartmentSchema.parse(body)

    // Check for duplicate name
    const existing = await prisma.department.findFirst({
      where: {
        tenantId: tenantId,
        name: validated.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name: validated.name,
        code: validated.code,
        isActive: validated.isActive,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(department, { status: 201 })
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

    console.error('Create department error:', error)
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    )
  }
}
