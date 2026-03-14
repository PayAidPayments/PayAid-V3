import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createShiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
  breakDuration: z.number().int().min(0).optional(),
})

// GET /api/industries/manufacturing/shifts - List shifts
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'manufacturing') {
      return NextResponse.json(
        { error: 'This endpoint is only for manufacturing industry' },
        { status: 403 }
      )
    }

    const shifts = await prisma.shift.findMany({
      where: { tenantId },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get shifts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}

// POST /api/industries/manufacturing/shifts - Create shift
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'manufacturing') {
      return NextResponse.json(
        { error: 'This endpoint is only for manufacturing industry' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createShiftSchema.parse(body)

    // Check if shift name already exists
    const existing = await prisma.shift.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: validated.name,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Shift name already exists' },
        { status: 400 }
      )
    }

    const shift = await prisma.shift.create({
      data: {
        tenantId,
        name: validated.name,
        startTime: validated.startTime,
        endTime: validated.endTime,
        breakDuration: validated.breakDuration,
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create shift error:', error)
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    )
  }
}

