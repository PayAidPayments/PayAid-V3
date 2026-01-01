import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { mapFormFields, validateFilledForm, FormData } from '@/lib/workflow/form-filler'
import { z } from 'zod'

const fillFormSchema = z.object({
  formData: z.object({
    fields: z.array(z.object({
      name: z.string(),
      type: z.enum(['text', 'email', 'phone', 'number', 'date', 'select', 'textarea']),
      label: z.string().optional(),
      required: z.boolean().optional(),
      options: z.array(z.string()).optional(),
    })),
    formType: z.enum(['government', 'vendor', 'customer', 'other']).optional(),
  }),
  contactId: z.string().optional(),
})

// POST /api/workflow/forms/fill - Auto-fill form from CRM data
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = fillFormSchema.parse(body)

    const filledForm = await mapFormFields(
      tenantId,
      validated.formData as FormData,
      validated.contactId
    )

    const validation = validateFilledForm(validated.formData as FormData, filledForm)

    return NextResponse.json({
      success: true,
      filledForm,
      validation,
    })
  } catch (error: any) {
    console.error('Form filling error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fill form',
      },
      { status: 500 }
    )
  }
}

