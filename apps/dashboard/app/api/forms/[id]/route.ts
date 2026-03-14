/**
 * Form API Route
 * GET /api/forms/[id] - Get form
 * PUT /api/forms/[id] - Update form
 * DELETE /api/forms/[id] - Delete form
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { FormBuilderService } from '@/lib/forms/form-builder'
import { z } from 'zod'

const updateFormSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  settings: z.object({
    gdprConsent: z.boolean().optional(),
    redirectUrl: z.string().url().optional(),
    successMessage: z.string().optional(),
    notifyEmail: z.string().email().optional(),
    autoCreateContact: z.boolean().optional(),
    autoAssignRep: z.boolean().optional(),
  }).optional(),
})

// GET /api/forms/[id] - Get form
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const form = await FormBuilderService.getFormById(tenantId, params.id)

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: form,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get form error:', error)
    return NextResponse.json(
      { error: 'Failed to get form' },
      { status: 500 }
    )
  }
}

// PUT /api/forms/[id] - Update form
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = updateFormSchema.parse(body)

    const form = await FormBuilderService.updateForm(tenantId, params.id, validated)

    return NextResponse.json({
      success: true,
      data: form,
    })
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

    console.error('Update form error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update form' },
      { status: 500 }
    )
  }
}

// DELETE /api/forms/[id] - Delete form
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    await FormBuilderService.deleteForm(tenantId, params.id)

    return NextResponse.json({
      success: true,
      message: 'Form deleted successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete form error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete form' },
      { status: 500 }
    )
  }
}
