import { NextRequest, NextResponse } from 'next/server'
import {
  requireAnyModuleAccess,
  handleLicenseError,
  LicenseError,
} from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * P2 Appointments smallest slice — slim-deploy safe (no outbox/event imports).
 * Draft-first reminder: AppointmentReminder PENDING only; never sends.
 */

const PRODUCT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const
type ProductStatus = (typeof PRODUCT_STATUSES)[number]

const DB_STATUS = {
  pending: 'SCHEDULED',
  confirmed: 'CONFIRMED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
} as const

const DB_TO_PRODUCT: Record<string, ProductStatus> = {
  SCHEDULED: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  IN_PROGRESS: 'confirmed',
  NO_SHOW: 'cancelled',
}

const ALLOWED: Record<ProductStatus, ProductStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

function toProduct(db: string): ProductStatus {
  return DB_TO_PRODUCT[db] || 'pending'
}

function assertTransition(fromDb: string, to: ProductStatus) {
  const from = toProduct(fromDb)
  if (from === to) return
  if (!ALLOWED[from].includes(to)) throw new Error(`Invalid status transition: ${from} → ${to}`)
}

const createSchema = z.object({
  contactId: z.string().optional(),
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  appointmentDate: z.string().datetime(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  duration: z.number().int().positive().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  serviceName: z.string().optional(),
  reminderMinutesBefore: z.number().int().positive().optional(),
})

const statusSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(PRODUCT_STATUSES),
  cancellationReason: z.string().optional(),
})

async function requireAppointmentsAccess(request: NextRequest) {
  return requireAnyModuleAccess(request, ['crm', 'appointments'])
}

function view(row: any, reminder?: any, crmInteractionId: string | null = null) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    contactId: row.contactId,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    appointmentDate: row.appointmentDate,
    startTime: row.startTime,
    endTime: row.endTime,
    status: toProduct(row.status),
    dbStatus: row.status,
    notes: row.notes,
    reminder: reminder
      ? {
          id: reminder.id,
          status: reminder.status,
          scheduledAt: reminder.scheduledAt,
          type: reminder.type,
        }
      : null,
    crmInteractionId,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireAppointmentsAccess(request)
    const contactId = request.nextUrl.searchParams.get('contactId') || undefined
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const rows = await prisma.appointment.findMany({
      where: {
        tenantId,
        ...(contactId ? { contactId } : {}),
        appointmentDate: { gte: now },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      include: {
        reminders: { where: { status: 'PENDING' }, orderBy: { scheduledAt: 'asc' }, take: 1 },
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      take: limit,
    })
    return NextResponse.json({
      ok: true,
      slice: 'p2-appointments-smallest',
      appointments: rows.map((r) => view(r, r.reminders?.[0] || null)),
    })
  } catch (error: unknown) {
    if (error instanceof LicenseError) return handleLicenseError(error)
    const message = error instanceof Error ? error.message : 'Failed to list appointments'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireAppointmentsAccess(request)
    const body = await request.json()

    if (body?.action === 'status') {
      const data = statusSchema.parse(body)
      const existing = await prisma.appointment.findFirst({
        where: { id: data.appointmentId, tenantId },
      })
      if (!existing) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      assertTransition(existing.status, data.status)
      const nextDb = DB_STATUS[data.status]
      const appointment = await prisma.appointment.update({
        where: { id: existing.id },
        data: {
          status: nextDb,
          ...(data.status === 'cancelled'
            ? {
                cancelledAt: existing.cancelledAt || new Date(),
                cancellationReason: data.cancellationReason || existing.cancellationReason,
              }
            : {}),
        },
        include: {
          reminders: { where: { status: 'PENDING' }, orderBy: { scheduledAt: 'asc' }, take: 1 },
        },
      })
      if (data.status === 'cancelled' || data.status === 'completed') {
        await prisma.appointmentReminder.updateMany({
          where: { appointmentId: appointment.id, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        })
      }
      if (appointment.contactId) {
        await prisma.interaction.create({
          data: {
            contactId: appointment.contactId,
            type: 'appointment',
            subject: `Appointment ${data.status}`,
            notes: JSON.stringify({
              appointmentId: appointment.id,
              status: data.status,
              source: 'p2-appointments-slice',
            }),
            outcome: data.status,
          },
        })
      }
      return NextResponse.json({ ok: true, appointment: view(appointment, appointment.reminders?.[0]) })
    }

    const data = createSchema.parse(body)
    if (!data.contactId && !data.contactName) {
      return NextResponse.json({ error: 'contactId or contactName is required' }, { status: 400 })
    }

    let contactId = data.contactId || null
    let contactName = (data.contactName || '').trim()
    let contactEmail = data.contactEmail || null
    let contactPhone = data.contactPhone || null

    if (contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: contactId, tenantId },
        select: { id: true, name: true, email: true, phone: true },
      })
      if (!contact) return NextResponse.json({ error: 'CRM contact not found for tenant' }, { status: 400 })
      contactName = contact.name
      contactEmail = contact.email || contactEmail
      contactPhone = contact.phone || contactPhone
    } else {
      const created = await prisma.contact.create({
        data: {
          tenantId,
          name: contactName,
          email: contactEmail || undefined,
          phone: contactPhone || undefined,
          source: 'appointment_request',
          tags: [],
        },
        select: { id: true, name: true, email: true, phone: true },
      })
      contactId = created.id
      contactName = created.name
      contactEmail = created.email
      contactPhone = created.phone
    }

    const appointmentDate = new Date(data.appointmentDate)
    const duration = data.duration || 60
    let endTime = data.endTime
    if (!endTime) {
      const [h, m] = data.startTime.split(':').map(Number)
      const end = new Date(appointmentDate)
      end.setHours(h, m, 0, 0)
      end.setMinutes(end.getMinutes() + duration)
      endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        contactId,
        contactName,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        appointmentDate,
        startTime: data.startTime,
        endTime,
        duration,
        status: DB_STATUS.pending,
        type: data.type || 'CONSULTATION',
        location: data.location,
        notes: data.notes,
        serviceName: data.serviceName || 'Appointment request',
      },
    })

    const interaction = await prisma.interaction.create({
      data: {
        contactId: contactId!,
        type: 'appointment',
        subject: `Appointment request ${data.startTime} ${appointmentDate.toISOString().slice(0, 10)}`,
        notes: JSON.stringify({
          appointmentId: appointment.id,
          status: 'pending',
          source: 'p2-appointments-slice',
        }),
        outcome: 'requested',
      },
    })

    const minutesBefore = data.reminderMinutesBefore ?? 60
    const scheduledAt = new Date(appointmentDate)
    const [rh, rm] = data.startTime.split(':').map(Number)
    scheduledAt.setHours(rh || 0, rm || 0, 0, 0)
    scheduledAt.setMinutes(scheduledAt.getMinutes() - minutesBefore)
    const reminder = await prisma.appointmentReminder.create({
      data: {
        tenantId,
        appointmentId: appointment.id,
        type: contactEmail ? 'EMAIL' : contactPhone ? 'SMS' : 'PUSH',
        scheduledAt,
        status: 'PENDING',
        message: `Reminder: appointment at ${data.startTime} (draft-first; not sent)`,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        appointment: view(appointment, reminder, interaction.id),
        reminderHook: { created: true, status: reminder.status, sent: false },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    if (error instanceof LicenseError) return handleLicenseError(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Failed to process appointment slice'
    const status = /not found|Invalid status|required/i.test(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
