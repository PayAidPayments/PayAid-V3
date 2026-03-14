import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { maskPIIInText, detectPII } from '@/lib/compliance/pii-detector'
import { z } from 'zod'

const piiMaskSchema = z.object({
  text: z.string().min(1),
  detectOnly: z.boolean().optional().default(false), // If true, only detect, don't mask
})

/**
 * POST /api/compliance/pii-mask
 * Detect and mask PII in text
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = piiMaskSchema.parse(body)

    const detections = detectPII(validated.text)

    if (validated.detectOnly) {
      return NextResponse.json({
        success: true,
        containsPII: detections.length > 0,
        detections,
        original: validated.text,
      })
    }

    const masked = maskPIIInText(validated.text)

    return NextResponse.json({
      success: true,
      containsPII: detections.length > 0,
      detections,
      original: validated.text,
      masked,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('PII mask error:', error)
    return NextResponse.json(
      { error: 'Failed to mask PII', details: String(error) },
      { status: 500 }
    )
  }
}
