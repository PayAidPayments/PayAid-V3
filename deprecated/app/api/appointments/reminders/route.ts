import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/license'
import { z } from 'zod'

const createReminderSchema = z.object({
  appointmentId: z.string(),
  type: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PUSH']),
  scheduledAt: z.string().datetime(),
  message: z.string().optional(),
})

/**
 * POST /api/appointments/reminders
 * Create a reminder for an appointment
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')

    const body = await request.json()
    const data = createReminderSchema.parse(body)

    // Verify appointment exists and belongs to tenant
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: data.appointmentId,
        tenantId,
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const reminder = await prisma.appointmentReminder.create({
      data: {
        tenantId,
        appointmentId: data.appointmentId,
        type: data.type,
        scheduledAt: new Date(data.scheduledAt),
        message: data.message,
      },
    })

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create reminder error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create reminder' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/appointments/reminders
 * Get pending reminders (for cron job)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'PENDING'
    const before = searchParams.get('before') // Get reminders scheduled before this time

    const where: any = {
      tenantId,
      status,
    }

    if (before) {
      where.scheduledAt = {
        lte: new Date(before),
      }
    }

    const reminders = await prisma.appointmentReminder.findMany({
      where,
      include: {
        appointment: {
          select: {
            id: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            appointmentDate: true,
            startTime: true,
            location: true,
            meetingLink: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 100, // Limit for batch processing
    })

    return NextResponse.json({ reminders })
  } catch (error: any) {
    console.error('Get reminders error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

