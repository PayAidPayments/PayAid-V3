import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  category: z.string().optional(),
  variables: z.array(z.string()).optional(),
})

// GET /api/email/templates - List email templates
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get email templates error:', error)
    return NextResponse.json(
      { error: 'Failed to get email templates' },
      { status: 500 }
    )
  }
}

// POST /api/email/templates - Create email template
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const body = await request.json()
    const validated = createTemplateSchema.parse(body)

    // Extract variables from HTML content ({{variable}} format)
    const variableMatches = validated.htmlContent.match(/\{\{(\w+)\}\}/g) || []
    const extractedVariables = variableMatches.map((match) => match.replace(/[{}]/g, ''))

    const template = await prisma.emailTemplate.create({
      data: {
        tenantId,
        name: validated.name,
        subject: validated.subject,
        htmlContent: validated.htmlContent,
        textContent: validated.textContent,
        category: validated.category,
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

    console.error('Create email template error:', error)
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    )
  }
}

