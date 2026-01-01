import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { createRestaurantShift, optimizeRestaurantScheduling, ShiftRequirement } from '@/lib/restaurant/scheduling'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createShiftSchema = z.object({
  employeeId: z.string(),
  shiftType: z.enum(['breakfast', 'lunch', 'dinner', 'night']),
  role: z.enum(['waiter', 'chef', 'manager', 'cashier', 'host', 'bartender']),
  date: z.string().datetime(),
  tableAssignments: z.array(z.string()).optional(),
  kitchenSection: z.string().optional(),
})

const optimizeSchema = z.object({
  date: z.string().datetime(),
  requirements: z.array(z.object({
    shiftType: z.enum(['breakfast', 'lunch', 'dinner', 'night']),
    role: z.enum(['waiter', 'chef', 'manager', 'cashier', 'host', 'bartender']),
    requiredCount: z.number().min(1),
  })),
})

// GET /api/industries/restaurant/schedules - Get restaurant schedules
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'restaurant') {
      return NextResponse.json(
        { error: 'This endpoint is only for restaurant industry' },
        { status: 403 }
      )
    }

    const date = request.nextUrl.searchParams.get('date')
    const shiftType = request.nextUrl.searchParams.get('shiftType')

    // Return schedules (would query from database)
    return NextResponse.json({
      success: true,
      schedules: [],
    })
  } catch (error: any) {
    console.error('Get schedules error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get schedules' },
      { status: 500 }
    )
  }
}

// POST /api/industries/restaurant/schedules - Create or optimize schedule
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'restaurant') {
      return NextResponse.json(
        { error: 'This endpoint is only for restaurant industry' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Check if it's optimization request
    if (body.requirements) {
      const validated = optimizeSchema.parse(body)
      const schedules = await optimizeRestaurantScheduling(
        tenantId,
        new Date(validated.date),
        validated.requirements as ShiftRequirement[]
      )

      return NextResponse.json({
        success: true,
        schedules,
      })
    } else {
      // Create single shift
      const validated = createShiftSchema.parse(body)
      const shift = await createRestaurantShift(
        tenantId,
        validated.employeeId,
        validated.shiftType,
        validated.role,
        new Date(validated.date),
        validated.tableAssignments,
        validated.kitchenSection
      )

      return NextResponse.json({
        success: true,
        shift,
      })
    }
  } catch (error: any) {
    console.error('Schedule creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create schedule' },
      { status: 500 }
    )
  }
}

