import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createLeadSchema = z.object({
  contactId: z.string().optional(),
  leadType: z.string(),
  propertyType: z.string().optional(),
  budget: z.number().optional(),
  location: z.string().optional(),
  requirements: z.string().optional(),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'real_estate')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const leadType = searchParams.get('leadType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = { tenantId }
    if (status) where.status = status
    if (leadType) where.leadType = leadType

    const [leads, total] = await Promise.all([
      prisma.realEstateLead.findMany({
        where,
        include: { siteVisits: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.realEstateLead.count({ where }),
    ])

    return NextResponse.json({
      leads,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'real_estate')
    
    const body = await request.json()
    const data = createLeadSchema.parse(body)

    const lead = await prisma.realEstateLead.create({
      data: {
        tenantId,
        contactId: data.contactId,
        leadType: data.leadType,
        propertyType: data.propertyType,
        budget: data.budget,
        location: data.location,
        requirements: data.requirements,
        source: data.source,
        assignedTo: data.assignedTo,
        notes: data.notes,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

