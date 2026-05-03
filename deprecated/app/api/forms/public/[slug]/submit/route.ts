/**
 * Public Form Submission API
 * POST /api/forms/public/[slug]/submit - Submit form (public, no auth required)
 */

import { NextRequest, NextResponse } from 'next/server'
import { FormSubmissionProcessor } from '@/lib/forms/form-submission-processor'
import { z } from 'zod'

const submitFormSchema = z.object({
  data: z.record(z.any()), // Form field responses
})

// POST /api/forms/public/[slug]/submit - Submit form
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json()
    const validated = submitFormSchema.parse(body)

    // Get metadata from request
    const metadata = {
      source: request.headers.get('referer') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || undefined,
    }

    const result = await FormSubmissionProcessor.processSubmission(
      params.slug,
      validated.data,
      metadata
    )

    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        submissionId: result.submission.id,
        contactId: result.contactId,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Submit form error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit form' },
      { status: 500 }
    )
  }
}
