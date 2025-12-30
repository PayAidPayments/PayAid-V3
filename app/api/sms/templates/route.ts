import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createTemplateSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1).max(1600),
  description: z.string().optional(),
  type: z.enum(['GENERAL', 'OTP', 'ALERT', 'MARKETING', 'TRANSACTIONAL']).default('GENERAL'),
  variables: z.array(z.string()).optional(),
})

// GET /api/sms/templates - List SMS templates
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const type = request.nextUrl.searchParams.get('type')
    const isActive = request.nextUrl.searchParams.get('isActive')

    const where: any = { tenantId }
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const templates = await prisma.sMSTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get SMS templates error:', error)
    return NextResponse.json(
      { error: 'Failed to get SMS templates' },
      { status: 500 }
    )
  }
}

// POST /api/sms/templates - Create SMS template
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const body = await request.json()
    const validated = createTemplateSchema.parse(body)

    // Extract variables from content ({{variable}} format)
    const variableMatches = validated.content.match(/\{\{(\w+)\}\}/g) || []
    const extractedVariables = variableMatches.map((match) => match.replace(/[{}]/g, ''))

    const template = await prisma.sMSTemplate.create({
      data: {
        tenantId,
        name: validated.name,
        content: validated.content,
        description: validated.description,
        type: validated.type,
        variables: validated.variables || extractedVariables.length > 0 ? extractedVariables : undefined,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create SMS template error:', error)
    return NextResponse.json(
      { error: 'Failed to create SMS template' },
      { status: 500 }
    )
  }
}

