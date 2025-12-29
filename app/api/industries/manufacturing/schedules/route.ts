import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createScheduleSchema = z.object({
  orderId: z.string(),
  scheduledStartDate: z.string().datetime(),
  scheduledEndDate: z.string().datetime(),
  machineId: z.string().optional(),
  machineName: z.string().optional(),
  assignedWorkers: z.array(z.string()).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notes: z.string().optional(),
})

// GET /api/industries/manufacturing/schedules - List production schedules
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

    const orderId = request.nextUrl.searchParams.get('orderId')
    const status = request.nextUrl.searchParams.get('status')
    const startDate = request.nextUrl.searchParams.get('startDate')
    const endDate = request.nextUrl.searchParams.get('endDate')

    const where: any = { tenantId }
    if (orderId) where.orderId = orderId
    if (status) where.status = status
    if (startDate || endDate) {
      where.scheduledStartDate = {}
      if (startDate) where.scheduledStartDate.gte = new Date(startDate)
      if (endDate) where.scheduledStartDate.lte = new Date(endDate)
    }

    const schedules = await prisma.productionSchedules.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            productName: true,
            quantity: true,
            status: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledStartDate: 'asc' },
      ],
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get production schedules error:', error)
    return NextResponse.json(
      { error: 'Failed to get production schedules' },
      { status: 500 }
    )
  }
}

// POST /api/industries/manufacturing/schedules - Create production schedule
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
    const validated = createScheduleSchema.parse(body)

    // Verify order exists
    const order = await prisma.manufacturingOrder.findUnique({
      where: {
        id: validated.orderId,
        tenantId,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Manufacturing order not found' },
        { status: 404 }
      )
    }

    const schedule = await prisma.productionSchedules.create({
      data: {
        tenantId,
        orderId: validated.orderId,
        scheduledStartDate: new Date(validated.scheduledStartDate),
        scheduledEndDate: new Date(validated.scheduledEndDate),
        machineId: validated.machineId,
        machineName: validated.machineName,
        assignedWorkers: validated.assignedWorkers || null,
        priority: validated.priority,
        notes: validated.notes,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            productName: true,
            quantity: true,
          },
        },
      },
    })

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create production schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to create production schedule' },
      { status: 500 }
    )
  }
}

