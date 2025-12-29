import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.string().min(1).max(1600).optional(),
  description: z.string().optional(),
  type: z.enum(['GENERAL', 'OTP', 'ALERT', 'MARKETING', 'TRANSACTIONAL']).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/sms/templates/[id] - Get template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')
    const { id } = await params

    const template = await prisma.sMSTemplate.findUnique({
      where: {
        id,
        tenantId,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'SMS template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get SMS template error:', error)
    return NextResponse.json(
      { error: 'Failed to get SMS template' },
      { status: 500 }
    )
  }
}

// PUT /api/sms/templates/[id] - Update template
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

    // Extract variables if content is updated
    if (validated.content) {
      const variableMatches = validated.content.match(/\{\{(\w+)\}\}/g) || []
      const extractedVariables = variableMatches.map((match) => match.replace(/[{}]/g, ''))
      updateData.variables = validated.variables || extractedVariables.length > 0 ? extractedVariables : null
    }

    const template = await prisma.sMSTemplate.update({
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

    console.error('Update SMS template error:', error)
    return NextResponse.json(
      { error: 'Failed to update SMS template' },
      { status: 500 }
    )
  }
}

// DELETE /api/sms/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')
    const { id } = await params

    await prisma.sMSTemplate.delete({
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

    console.error('Delete SMS template error:', error)
    return NextResponse.json(
      { error: 'Failed to delete SMS template' },
      { status: 500 }
    )
  }
}

