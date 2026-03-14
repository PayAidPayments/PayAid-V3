import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createEventSchema = z.object({
  eventName: z.string(),
  eventType: z.string().optional(),
  clientName: z.string(),
  clientPhone: z.string().optional(),
  eventDate: z.string(),
  eventTime: z.string().optional(),
  venue: z.string().optional(),
  numberOfGuests: z.number().optional(),
  budget: z.number().optional(),
  eventManager: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'events')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const eventDate = searchParams.get('eventDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (status) where.status = status
    if (eventDate) {
      const date = new Date(eventDate)
      where.eventDate = { gte: date }
    }

    const events = await prisma.eventManagementEvent.findMany({
      where,
      include: {
        vendors: true,
        guests: true,
        budgets: true,
        checklists: true,
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
    })

    return NextResponse.json({ events })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'events')
    
    const body = await request.json()
    const data = createEventSchema.parse(body)

    const event = await prisma.eventManagementEvent.create({
      data: {
        tenantId,
        eventName: data.eventName,
        eventType: data.eventType,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        eventDate: new Date(data.eventDate),
        eventTime: data.eventTime,
        venue: data.venue,
        numberOfGuests: data.numberOfGuests,
        budget: data.budget,
        eventManager: data.eventManager,
        notes: data.notes,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

