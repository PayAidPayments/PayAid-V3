import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/license'
import { z } from 'zod'

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  duration: z.number().int().positive().optional(),
  price: z.number().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
})

/**
 * PATCH /api/appointments/services/[id]
 * Update a service
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')
    const { id } = await params

    const body = await request.json()
    const data = updateServiceSchema.parse(body)

    const service = await prisma.appointmentService.update({
      where: { id },
      data,
    })

    return NextResponse.json({ service })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update service error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update service' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/appointments/services/[id]
 * Delete a service
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')
    const { id } = await params

    await prisma.appointmentService.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete service error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete service' },
      { status: 500 }
    )
  }
}

