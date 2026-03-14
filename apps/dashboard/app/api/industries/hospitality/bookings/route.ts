import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createBookingSchema = z.object({
  roomId: z.string(),
  guestId: z.string().optional(),
  guestName: z.string(),
  guestPhone: z.string().optional(),
  guestEmail: z.string().optional(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  numberOfGuests: z.number().default(1),
  roomRate: z.number(),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hospitality')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const checkInDate = searchParams.get('checkInDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (status) where.status = status
    if (checkInDate) {
      const date = new Date(checkInDate)
      where.checkInDate = { gte: date }
    }

    const bookings = await prisma.hospitalityBooking.findMany({
      where,
      include: {
        room: true,
        checkIns: true,
      },
      orderBy: { checkInDate: 'asc' },
      take: limit,
    })

    return NextResponse.json({ bookings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hospitality')
    
    const body = await request.json()
    const data = createBookingSchema.parse(body)

    const checkIn = new Date(data.checkInDate)
    const checkOut = new Date(data.checkOutDate)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    const booking = await prisma.hospitalityBooking.create({
      data: {
        tenantId,
        roomId: data.roomId,
        guestId: data.guestId,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: data.numberOfGuests,
        totalNights: nights,
        roomRate: data.roomRate,
        totalAmount: nights * data.roomRate,
        specialRequests: data.specialRequests,
        notes: data.notes,
      },
      include: { room: true },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

