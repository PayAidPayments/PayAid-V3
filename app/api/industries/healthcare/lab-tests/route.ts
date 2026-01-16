import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createLabTestSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  testName: z.string(),
  testType: z.string().optional(),
  sampleDate: z.string().optional(),
  labName: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'healthcare')
    
    const searchParams = request.nextUrl.searchParams
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (patientId) where.patientId = patientId
    if (status) where.status = status

    const labTests = await prisma.healthcareLabTest.findMany({
      where,
      include: { patient: true },
      orderBy: { orderedDate: 'desc' },
      take: limit,
    })

    return NextResponse.json({ labTests })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'healthcare')
    
    const body = await request.json()
    const data = createLabTestSchema.parse(body)

    const labTest = await prisma.healthcareLabTest.create({
      data: {
        tenantId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        testName: data.testName,
        testType: data.testType,
        sampleDate: data.sampleDate ? new Date(data.sampleDate) : null,
        labName: data.labName,
        notes: data.notes,
      },
      include: { patient: true },
    })

    return NextResponse.json(labTest, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'healthcare')
    
    const body = await request.json()
    const { id, results, status, resultDate } = body

    const labTest = await prisma.healthcareLabTest.update({
      where: { id, tenantId },
      data: {
        results,
        status,
        resultDate: resultDate ? new Date(resultDate) : null,
      },
      include: { patient: true },
    })

    return NextResponse.json(labTest)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

