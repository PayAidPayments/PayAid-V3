import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/license'

/**
 * GET /api/appointments/calendar
 * Get appointments for calendar view (month/week/day)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')

    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'month' // month, week, day
    const date = searchParams.get('date') || new Date().toISOString()
    const assignedToId = searchParams.get('assignedToId')

    const selectedDate = new Date(date)
    let startDate: Date
    let endDate: Date

    switch (view) {
      case 'day':
        startDate = new Date(selectedDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(selectedDate)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'week':
        const dayOfWeek = selectedDate.getDay()
        startDate = new Date(selectedDate)
        startDate.setDate(selectedDate.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'month':
      default:
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break
    }

    const where: any = {
      tenantId,
      appointmentDate: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (assignedToId) {
      where.assignedToId = assignedToId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            color: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' },
      ],
    })

    // Group appointments by date for easier calendar rendering
    const grouped = appointments.reduce((acc: any, apt) => {
      const dateKey = apt.appointmentDate.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(apt)
      return acc
    }, {})

    return NextResponse.json({
      appointments,
      grouped,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      view,
    })
  } catch (error: any) {
    console.error('Get calendar error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/appointments/availability
 * Check availability for a time slot
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'appointments')

    const body = await request.json()
    const { date, startTime, duration, assignedToId } = body

    if (!date || !startTime || !duration) {
      return NextResponse.json(
        { error: 'date, startTime, and duration are required' },
        { status: 400 }
      )
    }

    const appointmentDate = new Date(date)
    const [startHour, startMinute] = startTime.split(':').map(Number)
    appointmentDate.setHours(startHour, startMinute, 0, 0)

    const endTime = new Date(appointmentDate.getTime() + duration * 60000)

    const where: any = {
      tenantId,
      appointmentDate: {
        gte: appointmentDate,
        lt: endTime,
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
      },
    }

    if (assignedToId) {
      where.assignedToId = assignedToId
    }

    const conflicting = await prisma.appointment.findFirst({
      where,
    })

    return NextResponse.json({
      available: !conflicting,
      conflictingAppointment: conflicting ? {
        id: conflicting.id,
        startTime: conflicting.startTime,
        endTime: conflicting.endTime,
        contactName: conflicting.contactName,
      } : null,
    })
  } catch (error: any) {
    console.error('Check availability error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check availability' },
      { status: 500 }
    )
  }
}

