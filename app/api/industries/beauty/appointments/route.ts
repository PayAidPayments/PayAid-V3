import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createAppointmentSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string(),
  customerPhone: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string(),
  staffId: z.string().optional(),
  appointmentDate: z.string(),
  appointmentTime: z.string().optional(),
  duration: z.number().optional(),
  amount: z.number().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'beauty')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (status) where.status = status
    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      where.appointmentDate = { gte: startDate, lte: endDate }
    }

    const appointments = await prisma.beautyAppointment.findMany({
      where,
      include: { service: true },
      orderBy: { appointmentDate: 'asc' },
      take: limit,
    })

    return NextResponse.json({ appointments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'beauty')
    
    const body = await request.json()
    const data = createAppointmentSchema.parse(body)

    const appointment = await prisma.beautyAppointment.create({
      data: {
        tenantId,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        staffId: data.staffId,
        appointmentDate: new Date(data.appointmentDate),
        appointmentTime: data.appointmentTime,
        duration: data.duration,
        amount: data.amount,
        notes: data.notes,
      },
      include: { service: true },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

