import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createShipmentSchema = z.object({
  shipmentNumber: z.string(),
  orderId: z.string().optional(),
  customerName: z.string(),
  customerPhone: z.string().optional(),
  customerAddress: z.string(),
  pickupAddress: z.string(),
  deliveryAddress: z.string(),
  shipmentType: z.string(),
  weight: z.number().optional(),
  volume: z.number().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  routeId: z.string().optional(),
  pickupDate: z.string().optional(),
  charges: z.number().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'logistics')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const trackingNumber = searchParams.get('trackingNumber')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = { tenantId }
    if (status) where.status = status
    if (trackingNumber) where.trackingNumber = trackingNumber

    const [shipments, total] = await Promise.all([
      prisma.logisticsShipment.findMany({
        where,
        include: {
          deliveries: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.logisticsShipment.count({ where }),
    ])

    return NextResponse.json({
      shipments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'logistics')
    
    const body = await request.json()
    const data = createShipmentSchema.parse(body)

    const shipment = await prisma.logisticsShipment.create({
      data: {
        tenantId,
        shipmentNumber: data.shipmentNumber,
        orderId: data.orderId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        shipmentType: data.shipmentType,
        weight: data.weight,
        volume: data.volume,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        routeId: data.routeId,
        pickupDate: data.pickupDate ? new Date(data.pickupDate) : null,
        charges: data.charges,
        notes: data.notes,
      },
    })

    return NextResponse.json(shipment, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'logistics')
    
    const body = await request.json()
    const { id, status, deliveryDate, deliveryProof } = body

    const shipment = await prisma.logisticsShipment.update({
      where: { id, tenantId },
      data: {
        status,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryProof,
      },
    })

    return NextResponse.json(shipment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

