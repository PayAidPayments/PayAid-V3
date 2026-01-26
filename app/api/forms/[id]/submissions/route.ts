/**
 * Form Submissions API
 * GET /api/forms/[id]/submissions - Get form submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { FormSubmissionProcessor } from '@/lib/forms/form-submission-processor'

// GET /api/forms/[id]/submissions - Get form submissions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const submissions = await FormSubmissionProcessor.getSubmissions(
      tenantId,
      params.id,
      {
        status,
        limit,
        offset,
      }
    )

    return NextResponse.json({
      success: true,
      data: submissions,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get form submissions error:', error)
    return NextResponse.json(
      { error: 'Failed to get form submissions' },
      { status: 500 }
    )
  }
}
