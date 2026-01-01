import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { reviewDocument, updateCRMFromDocument } from '@/lib/workflow/document-reviewer'
import { z } from 'zod'

const reviewDocumentSchema = z.object({
  documentContent: z.string().min(1),
  documentType: z.enum(['contract', 'invoice', 'proposal', 'agreement', 'other']).default('other'),
  updateCRM: z.boolean().default(false),
})

// POST /api/workflow/documents/review - Review document and extract data
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = reviewDocumentSchema.parse(body)

    const reviewResult = await reviewDocument(
      tenantId,
      validated.documentContent,
      validated.documentType
    )

    let crmUpdateResults = null
    if (validated.updateCRM) {
      crmUpdateResults = await updateCRMFromDocument(tenantId, reviewResult)
    }

    return NextResponse.json({
      success: true,
      review: reviewResult,
      crmUpdates: crmUpdateResults,
    })
  } catch (error: any) {
    console.error('Document review error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to review document',
      },
      { status: 500 }
    )
  }
}

