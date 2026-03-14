import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createPrescriptionSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  doctorName: z.string(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
  })),
  instructions: z.string().optional(),
  followUpDate: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'healthcare')
    
    const searchParams = request.nextUrl.searchParams
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = { tenantId }
    if (patientId) where.patientId = patientId
    if (status) where.status = status

    const [prescriptions, total] = await Promise.all([
      prisma.healthcarePrescription.findMany({
        where,
        include: { patient: true },
        orderBy: { prescriptionDate: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.healthcarePrescription.count({ where }),
    ])

    return NextResponse.json({
      prescriptions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'healthcare')
    
    const body = await request.json()
    const data = createPrescriptionSchema.parse(body)

    const prescription = await prisma.healthcarePrescription.create({
      data: {
        tenantId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        doctorName: data.doctorName,
        medications: data.medications,
        instructions: data.instructions,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      },
      include: { patient: true },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

