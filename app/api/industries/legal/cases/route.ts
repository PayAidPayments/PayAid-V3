import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createCaseSchema = z.object({
  caseNumber: z.string(),
  clientId: z.string().optional(),
  clientName: z.string(),
  caseTitle: z.string(),
  caseType: z.string().optional(),
  courtName: z.string().optional(),
  filingDate: z.string().optional(),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'legal')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const cases = await prisma.legalCase.findMany({
      where,
      include: {
        courtDates: true,
        matters: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ cases })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'legal')
    
    const body = await request.json()
    const data = createCaseSchema.parse(body)

    const legalCase = await prisma.legalCase.create({
      data: {
        tenantId,
        caseNumber: data.caseNumber,
        clientId: data.clientId,
        clientName: data.clientName,
        caseTitle: data.caseTitle,
        caseType: data.caseType,
        courtName: data.courtName,
        filingDate: data.filingDate ? new Date(data.filingDate) : null,
        assignedTo: data.assignedTo,
        description: data.description,
        notes: data.notes,
      },
    })

    return NextResponse.json(legalCase, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

