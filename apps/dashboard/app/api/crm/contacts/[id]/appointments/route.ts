import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError, LicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/crm/contacts/[id]/appointments
 * Slim-safe CRM customer-record listing for P2 Appointments slice.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id: contactId } = await params

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId },
      select: { id: true, name: true },
    })
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const upcomingRows = await prisma.appointment.findMany({
      where: {
        tenantId,
        contactId,
        appointmentDate: { gte: now },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      take: 50,
    })

    const recent = await prisma.appointment.findMany({
      where: {
        tenantId,
        contactId,
        status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] },
      },
      orderBy: { appointmentDate: 'desc' },
      take: 20,
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        status: true,
        contactName: true,
        notes: true,
      },
    })

    const upcoming = upcomingRows.map((r) => ({
      id: r.id,
      contactId: r.contactId,
      contactName: r.contactName,
      appointmentDate: r.appointmentDate,
      startTime: r.startTime,
      status:
        r.status === 'SCHEDULED'
          ? 'pending'
          : r.status === 'CONFIRMED'
            ? 'confirmed'
            : r.status === 'COMPLETED'
              ? 'completed'
              : r.status === 'CANCELLED'
                ? 'cancelled'
                : String(r.status).toLowerCase(),
      dbStatus: r.status,
    }))

    return NextResponse.json({ ok: true, contact, upcoming, recent })
  } catch (error: unknown) {
    if (error instanceof LicenseError) return handleLicenseError(error)
    const message = error instanceof Error ? error.message : 'Failed to list contact appointments'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
