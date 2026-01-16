import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/license'
import { z } from 'zod'

const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  duration: z.number().int().positive(),
  price: z.number().optional(),
  color: z.string().optional(),
})

/**
 * GET /api/appointments/services
 * Get all appointment services
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const where: any = { tenantId }

    if (category) where.category = category
    if (isActive !== null) where.isActive = isActive === 'true'

    const services = await prisma.appointmentService.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ services })
  } catch (error: any) {
    console.error('Get services error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointments/services
 * Create a new service
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')

    const body = await request.json()
    const data = createServiceSchema.parse(body)

    const service = await prisma.appointmentService.create({
      data: {
        tenantId,
        ...data,
      },
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create service error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create service' },
      { status: 500 }
    )
  }
}

