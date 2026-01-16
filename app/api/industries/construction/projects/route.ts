import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createProjectSchema = z.object({
  projectName: z.string(),
  projectType: z.string().optional(),
  clientName: z.string(),
  clientPhone: z.string().optional(),
  location: z.string(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  budget: z.number().optional(),
  projectManager: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'construction')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const where: any = { tenantId }
    if (status) where.status = status

    const projects = await prisma.constructionProject.findMany({
      where,
      include: {
        materials: true,
        milestones: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ projects })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'construction')
    
    const body = await request.json()
    const data = createProjectSchema.parse(body)

    const project = await prisma.constructionProject.create({
      data: {
        tenantId,
        projectName: data.projectName,
        projectType: data.projectType,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        location: data.location,
        startDate: data.startDate ? new Date(data.startDate) : null,
        expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
        budget: data.budget,
        projectManager: data.projectManager,
        notes: data.notes,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

