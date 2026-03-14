import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { optimizeSchedule } from '@/lib/manufacturing/scheduling'
import { z } from 'zod'

const optimizeSchema = z.object({
  orderIds: z.array(z.string()).min(1),
})

// POST /api/industries/manufacturing/schedules/optimize - Optimize production schedule
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
    const validated = optimizeSchema.parse(body)

    const optimizations = await optimizeSchedule(tenantId, validated.orderIds)

    return NextResponse.json({ optimizations })
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

    console.error('Optimize schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to optimize schedule' },
      { status: 500 }
    )
  }
}

