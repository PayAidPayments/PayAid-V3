import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/license'
import { z } from 'zod'

const createAppointmentSchema = z.object({
  contactId: z.string().optional(),
  contactName: z.string().min(1),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  appointmentDate: z.string().datetime(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  duration: z.number().int().positive().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  isOnline: z.boolean().optional(),
  meetingLink: z.string().url().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  amount: z.number().optional(),
})

const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED']).optional(),
  cancellationReason: z.string().optional(),
})

/**
 * GET /api/appointments
 * Get all appointments with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const contactId = searchParams.get('contactId')
    const assignedToId = searchParams.get('assignedToId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }

    if (status) where.status = status
    if (contactId) where.contactId = contactId
    if (assignedToId) where.assignedToId = assignedToId

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      where.appointmentDate = { gte: startOfDay, lte: endOfDay }
    } else if (startDate || endDate) {
      where.appointmentDate = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        where.appointmentDate.gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.appointmentDate.lte = end
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        reminders: {
          where: { status: 'PENDING' },
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' },
      ],
      take: limit,
    })

    return NextResponse.json({ appointments })
  } catch (error: any) {
    console.error('Get appointments error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')

    const body = await request.json()
    const data = createAppointmentSchema.parse(body)

    // Check for conflicts if assignedToId is provided
    if (data.assignedToId && data.appointmentDate && data.startTime) {
      const appointmentDate = new Date(data.appointmentDate)
      const [startHour, startMinute] = data.startTime.split(':').map(Number)
      appointmentDate.setHours(startHour, startMinute, 0, 0)

      const duration = data.duration || 60 // Default 60 minutes
      const endTime = new Date(appointmentDate.getTime() + duration * 60000)

      const conflicting = await prisma.appointment.findFirst({
        where: {
          tenantId,
          assignedToId: data.assignedToId,
          appointmentDate: {
            gte: appointmentDate,
            lt: endTime,
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      })

      if (conflicting) {
        return NextResponse.json(
          { error: 'Staff member already has an appointment at this time' },
          { status: 400 }
        )
      }
    }

    // If contactId is provided, fetch contact details from CRM
    let contactData = {
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
    }

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
        contactData = {
          contactName: contact.name,
          contactEmail: contact.email || undefined,
          contactPhone: contact.phone || undefined,
        }
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        contactId: data.contactId,
        ...contactData,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        assignedToId: data.assignedToId,
        assignedToName: data.assignedToName,
        appointmentDate: new Date(data.appointmentDate),
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        type: data.type,
        location: data.location,
        isOnline: data.isOnline || false,
        meetingLink: data.meetingLink,
        notes: data.notes,
        internalNotes: data.internalNotes,
        amount: data.amount,
      },
      include: {
        service: true,
      },
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

