import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createDesignationSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/hr/designations - List all designations
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('isActive')

    const where: any = {
      tenantId: tenantId,
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const designations = await prisma.designation.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    })

    return NextResponse.json({ designations })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get designations error:', error)
    return NextResponse.json(
      { error: 'Failed to get designations' },
      { status: 500 }
    )
  }
}

// POST /api/hr/designations - Create a new designation
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createDesignationSchema.parse(body)

    // Check for duplicate name
    const existing = await prisma.designation.findFirst({
      where: {
        tenantId: tenantId,
        name: validated.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Designation with this name already exists' },
        { status: 400 }
      )
    }

    const designation = await prisma.designation.create({
      data: {
        name: validated.name,
        code: validated.code,
        isActive: validated.isActive,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(designation, { status: 201 })
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

    console.error('Create designation error:', error)
    return NextResponse.json(
      { error: 'Failed to create designation' },
      { status: 500 }
    )
  }
}
