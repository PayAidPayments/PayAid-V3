import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { FormFieldSuggestionService } from '@/lib/ai/form-field-suggestions'
import { z } from 'zod'

const suggestionRequestSchema = z.object({
  industry: z.string().optional(),
  purpose: z.string().optional(),
  existingFields: z.array(z.any()).optional(),
  companyName: z.string().optional(),
})

/**
 * POST /api/forms/suggestions
 * Get AI-powered form field suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = suggestionRequestSchema.parse(body)

    const service = new FormFieldSuggestionService()
    const suggestions = await service.suggestFields({
      industry: validated.industry,
      purpose: validated.purpose,
      existingFields: validated.existingFields,
      companyName: validated.companyName,
    })

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Form suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}
