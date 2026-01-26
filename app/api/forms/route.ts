/**
 * Forms API Route
 * POST /api/forms - Create form
 * GET /api/forms - List forms
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { FormBuilderService } from '@/lib/forms/form-builder'
import { z } from 'zod'

const createFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  fields: z.array(z.object({
    label: z.string(),
    type: z.enum(['text', 'email', 'phone', 'select', 'checkbox', 'radio', 'textarea', 'number', 'date']),
    placeholder: z.string().optional(),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
    conditionalLogic: z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains']),
      value: z.string(),
      show: z.boolean(),
    }).optional(),
    order: z.number().default(0),
    validation: z.object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  })),
  settings: z.object({
    gdprConsent: z.boolean().default(true),
    redirectUrl: z.string().url().optional(),
    successMessage: z.string().optional(),
    notifyEmail: z.string().email().optional(),
    autoCreateContact: z.boolean().default(true),
    autoAssignRep: z.boolean().default(false),
  }).optional(),
})

// POST /api/forms - Create form
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createFormSchema.parse(body)

    const form = await FormBuilderService.createForm(tenantId, {
      name: validated.name,
      description: validated.description,
      slug: validated.slug,
      fields: validated.fields,
      settings: validated.settings,
    })

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

    console.error('Create form error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create form' },
      { status: 500 }
    )
  }
}

// GET /api/forms - List forms
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') as 'draft' | 'active' | 'archived' | null

    const forms = await FormBuilderService.listForms(tenantId, {
      ...(status && { status }),
    })

    return NextResponse.json({
      success: true,
      data: forms,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('List forms error:', error)
    return NextResponse.json(
      { error: 'Failed to list forms' },
      { status: 500 }
    )
  }
}
