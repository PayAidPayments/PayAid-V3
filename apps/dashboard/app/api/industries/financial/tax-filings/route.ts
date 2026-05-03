import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createTaxFilingSchema = z.object({
  clientId: z.string(),
  financialYear: z.string(),
  assessmentYear: z.string(),
  filingType: z.string(),
  dueDate: z.string(),
  filingDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'financial')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const financialYear = searchParams.get('financialYear')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (financialYear) where.financialYear = financialYear

    const taxFilings = await prisma.financialTaxFiling.findMany({
      where,
      include: { client: true },
      orderBy: { dueDate: 'asc' },
      take: limit,
    })

    return NextResponse.json({ taxFilings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'financial')
    
    const body = await request.json()
    const data = createTaxFilingSchema.parse(body)

    const taxFiling = await prisma.financialTaxFiling.create({
      data: {
        tenantId,
        clientId: data.clientId,
        financialYear: data.financialYear,
        assessmentYear: data.assessmentYear,
        filingType: data.filingType,
        dueDate: new Date(data.dueDate),
        filingDate: data.filingDate ? new Date(data.filingDate) : null,
        notes: data.notes,
      },
      include: { client: true },
    })

    return NextResponse.json(taxFiling, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

