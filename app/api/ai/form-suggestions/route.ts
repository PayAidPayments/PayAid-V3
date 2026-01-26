import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { FormFieldSuggestionService } from '@/lib/ai/form-field-suggestions'
import { z } from 'zod'

const suggestionSchema = z.object({
  industry: z.string().min(1),
  purpose: z.string().min(1),
  existingFields: z.array(z.any()).optional(),
})

/**
 * POST /api/ai/form-suggestions
 * Get AI-powered form field suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { industry, purpose, existingFields } = suggestionSchema.parse(body)

    const service = new FormFieldSuggestionService()
    const suggestions = await service.suggestFields(industry, purpose, existingFields)

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    console.error('[Form Suggestions] Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(error)
  }
}
