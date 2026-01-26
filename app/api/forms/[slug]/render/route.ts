/**
 * Public Form Render API
 * GET /api/forms/[slug]/render - Render form for embedding (public, no auth required)
 */

import { NextRequest, NextResponse } from 'next/server'
import { FormRendererService } from '@/lib/forms/form-renderer'
import { FormAnalyticsService } from '@/lib/forms/form-analytics'

// GET /api/forms/[slug]/render - Render form
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const form = await FormRendererService.renderForm(params.slug)

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found or inactive' },
        { status: 404 }
      )
    }

    // Track form view for analytics
    await FormAnalyticsService.trackFormView(form.id, {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: form,
    })
  } catch (error) {
    console.error('Render form error:', error)
    return NextResponse.json(
      { error: 'Failed to render form' },
      { status: 500 }
    )
  }
}
