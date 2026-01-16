import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/license'
import { z } from 'zod'

const updateAppointmentSchema = z.object({
  contactId: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  appointmentDate: z.string().datetime().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  duration: z.number().int().positive().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  isOnline: z.boolean().optional(),
  meetingLink: z.string().url().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  amount: z.number().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED']).optional(),
  cancellationReason: z.string().optional(),
})

/**
 * GET /api/appointments/[id]
 * Get a single appointment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')
    const { id } = await params

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        service: true,
        reminders: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ appointment })
  } catch (error: any) {
    console.error('Get appointment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/appointments/[id]
 * Update an appointment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')
    const { id } = await params

    const body = await request.json()
    const data = updateAppointmentSchema.parse(body)

    // Check if appointment exists
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check for conflicts if time/date/assignedToId is being changed
    if ((data.assignedToId || data.appointmentDate || data.startTime) && existing.status !== 'CANCELLED') {
      const appointmentDate = data.appointmentDate ? new Date(data.appointmentDate) : existing.appointmentDate
      const startTime = data.startTime || existing.startTime
      const assignedToId = data.assignedToId || existing.assignedToId

      if (assignedToId) {
        const [startHour, startMinute] = startTime.split(':').map(Number)
        appointmentDate.setHours(startHour, startMinute, 0, 0)

        const duration = data.duration || existing.duration || 60
        const endTime = new Date(appointmentDate.getTime() + duration * 60000)

        const conflicting = await prisma.appointment.findFirst({
          where: {
            tenantId,
            assignedToId,
            appointmentDate: {
              gte: appointmentDate,
              lt: endTime,
            },
            status: {
              in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
            },
            id: { not: id },
          },
        })

        if (conflicting) {
          return NextResponse.json(
            { error: 'Staff member already has an appointment at this time' },
            { status: 400 }
          )
        }
      }
    }

    // Update contact data if contactId is provided
    const updateData: any = { ...data }
    if (data.contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: data.contactId,
          tenantId,
        },
        select: {
          name: true,
          email: true,
          phone: true,
        },
      })

      if (contact) {
        updateData.contactName = contact.name
        updateData.contactEmail = contact.email || undefined
        updateData.contactPhone = contact.phone || undefined
      }
    }

    // Handle cancellation
    if (data.status === 'CANCELLED' && !existing.cancelledAt) {
      updateData.cancelledAt = new Date()
    }

    // Convert date strings to Date objects
    if (updateData.appointmentDate) {
      updateData.appointmentDate = new Date(updateData.appointmentDate)
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        reminders: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ appointment })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/appointments/[id]
 * Delete an appointment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')
    const { id } = await params

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    await prisma.appointment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete appointment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}

