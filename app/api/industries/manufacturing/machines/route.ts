import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createMachineSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  machineType: z.string().optional(),
  capacityHoursPerDay: z.number().positive().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/industries/manufacturing/machines - List machines
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

    const status = request.nextUrl.searchParams.get('status')

    const where: any = { tenantId }
    if (status) where.status = status

    const machines = await prisma.machine.findMany({
      where,
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ machines })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get machines error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch machines' },
      { status: 500 }
    )
  }
}

// POST /api/industries/manufacturing/machines - Create machine
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
    const validated = createMachineSchema.parse(body)

    // Check if code already exists
    if (validated.code) {
      const existing = await prisma.machine.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: validated.code,
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Machine code already exists' },
          { status: 400 }
        )
      }
    }

    const machine = await prisma.machine.create({
      data: {
        tenantId,
        name: validated.name,
        code: validated.code,
        machineType: validated.machineType,
        capacityHoursPerDay: validated.capacityHoursPerDay
          ? new Decimal(validated.capacityHoursPerDay)
          : null,
        location: validated.location,
        notes: validated.notes,
      },
    })

    return NextResponse.json({ machine }, { status: 201 })
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

    console.error('Create machine error:', error)
    return NextResponse.json(
      { error: 'Failed to create machine' },
      { status: 500 }
    )
  }
}

