import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { EmailAutomationService } from '@/lib/ai/email-automation'
import { z } from 'zod'

const autoResponseSchema = z.object({
  incomingEmail: z.object({
    subject: z.string(),
    body: z.string(),
    from: z.string().email(),
  }),
  context: z.object({
    contactName: z.string().optional(),
    contactEmail: z.string().email(),
    previousEmails: z.array(z.any()).optional(),
    dealStage: z.string().optional(),
    dealValue: z.number().optional(),
    lastInteraction: z.string().optional(),
  }),
})

/**
 * POST /api/email/auto-response
 * Generate automated email response
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { incomingEmail, context } = autoResponseSchema.parse(body)

    const service = new EmailAutomationService()

    // Check if human review is required
    const requiresReview = await service.requiresHumanReview(incomingEmail, context)
    if (requiresReview) {
      return NextResponse.json({
        success: true,
        data: {
          requiresHumanReview: true,
          reason: 'Email contains sensitive keywords or high-value deal',
        },
      })
    }

    // Generate response
    const response = await service.generateResponse(incomingEmail, context)

    return NextResponse.json({
      success: true,
      data: {
        requiresHumanReview: false,
        response,
      },
    })
  } catch (error) {
    console.error('[Auto Email Response] Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(error)
  }
}
