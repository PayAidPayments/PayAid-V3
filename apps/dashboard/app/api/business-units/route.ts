import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createBusinessUnitSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  industryPacks: z.array(z.string()).optional(),
})

// GET /api/business-units - List all business units
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const units = await prisma.businessUnit.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ units })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get business units error:', error)
    return NextResponse.json(
      { error: 'Failed to get business units', units: [] },
      { status: 500 }
    )
  }
}

// POST /api/business-units - Create a new business unit
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createBusinessUnitSchema.parse(body)

    const unit = await prisma.businessUnit.create({
      data: {
        tenantId,
        name: validated.name,
        location: validated.location,
        industryPacks: validated.industryPacks || [],
        isActive: true,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create business unit error:', error)
    return NextResponse.json(
      { error: 'Failed to create business unit' },
      { status: 500 }
    )
  }
}

