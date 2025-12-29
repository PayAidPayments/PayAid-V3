import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  category: z.string().optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/email/templates/[id] - Get template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')
    const { id } = await params

    const template = await prisma.emailTemplate.findUnique({
      where: {
        id,
        tenantId,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get email template error:', error)
    return NextResponse.json(
      { error: 'Failed to get email template' },
      { status: 500 }
    )
  }
}

// PUT /api/email/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')
    const { id } = await params

    const body = await request.json()
    const validated = updateTemplateSchema.parse(body)

    const updateData: any = { ...validated }

    // Extract variables if HTML content is updated
    if (validated.htmlContent) {
      const variableMatches = validated.htmlContent.match(/\{\{(\w+)\}\}/g) || []
      const extractedVariables = variableMatches.map((match) => match.replace(/[{}]/g, ''))
      updateData.variables = validated.variables || extractedVariables.length > 0 ? extractedVariables : null
    }

    const template = await prisma.emailTemplate.update({
      where: {
        id,
        tenantId,
      },
      data: updateData,
    })

    return NextResponse.json({ template })
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

    console.error('Update email template error:', error)
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    )
  }
}

// DELETE /api/email/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')
    const { id } = await params

    await prisma.emailTemplate.delete({
      where: {
        id,
        tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete email template error:', error)
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    )
  }
}

