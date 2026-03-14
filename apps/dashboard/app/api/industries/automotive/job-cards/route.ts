import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createJobCardSchema = z.object({
  vehicleId: z.string(),
  jobCardNumber: z.string(),
  customerName: z.string(),
  vehicleNumber: z.string(),
  serviceType: z.string(),
  issues: z.string().optional(),
  workDescription: z.string().optional(),
  estimatedCost: z.number().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'automotive')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const vehicleId = searchParams.get('vehicleId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (status) where.status = status
    if (vehicleId) where.vehicleId = vehicleId

    const jobCards = await prisma.automotiveJobCard.findMany({
      where,
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ jobCards })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'automotive')
    
    const body = await request.json()
    const data = createJobCardSchema.parse(body)

    const jobCard = await prisma.automotiveJobCard.create({
      data: {
        tenantId,
        vehicleId: data.vehicleId,
        jobCardNumber: data.jobCardNumber,
        customerName: data.customerName,
        vehicleNumber: data.vehicleNumber,
        serviceType: data.serviceType,
        issues: data.issues,
        workDescription: data.workDescription,
        estimatedCost: data.estimatedCost,
        assignedTo: data.assignedTo,
        notes: data.notes,
      },
      include: { vehicle: true },
    })

    return NextResponse.json(jobCard, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

