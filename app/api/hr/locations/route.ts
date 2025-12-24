import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createLocationSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  isActive: z.boolean().default(true),
})

// GET /api/hr/locations - List all locations
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('isActive')
    const state = searchParams.get('state')

    const where: any = {
      tenantId: tenantId,
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    if (state) {
      where.state = state
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    })

    return NextResponse.json({ locations })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get locations error:', error)
    return NextResponse.json(
      { error: 'Failed to get locations' },
      { status: 500 }
    )
  }
}

// POST /api/hr/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createLocationSchema.parse(body)

    // Check for duplicate name
    const existing = await prisma.location.findFirst({
      where: {
        tenantId: tenantId,
        name: validated.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Location with this name already exists' },
        { status: 400 }
      )
    }

    const location = await prisma.location.create({
      data: {
        name: validated.name,
        code: validated.code,
        city: validated.city,
        state: validated.state,
        country: validated.country,
        isActive: validated.isActive,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(location, { status: 201 })
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

    console.error('Create location error:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
