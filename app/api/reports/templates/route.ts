import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['sales', 'marketing', 'finance', 'hr', 'custom']),
  config: z.record(z.any()),
  isPublic: z.boolean().optional(),
})

// GET /api/reports/templates - List report templates
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const includeSystem = searchParams.get('includeSystem') === 'true'

    const where: any = {
      OR: [
        { tenantId: null, isSystem: true }, // System templates
        { tenantId, isPublic: true }, // Public tenant templates
        { tenantId }, // Own templates
      ],
    }

    if (category) {
      where.category = category
    }

    if (!includeSystem) {
      where.isSystem = false
    }

    const templates = await prisma.reportTemplate.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: {
            reports: true,
          },
        },
      },
    })

    return NextResponse.json({ templates })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get templates error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/reports/templates - Create report template
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const validated = createTemplateSchema.parse(body)

    const template = await prisma.reportTemplate.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        config: validated.config,
        isPublic: validated.isPublic || false,
        isSystem: false,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

