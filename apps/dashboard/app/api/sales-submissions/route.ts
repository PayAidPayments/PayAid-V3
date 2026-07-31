import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import {
  listSalesPageSubmissions,
  processSalesPageSubmission,
  retrySalesPageSubmission,
} from '@/lib/sales-pages/landing-page-submission-bridge'

const submissionSchema = z.object({
  salesPageId: z.string().min(1),
  formId: z.string().optional(),
  payload: z.record(z.any()),
  attribution: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      content: z.string().optional(),
      term: z.string().optional(),
      referrer: z.string().optional(),
      landingPageUrl: z.string().optional(),
    })
    .optional(),
  ctaEvent: z
    .object({
      type: z.enum(['form_submit', 'call_now', 'whatsapp_now', 'book_appointment', 'pay_now', 'download']),
      metadata: z.record(z.any()).optional(),
    })
    .optional(),
})

const retrySchema = z.object({
  action: z.literal('retry'),
  entryId: z.string().min(1),
})

// Public ingestion endpoint for published sales pages (dashboard twin).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body?.action === 'retry') {
      const { tenantId } = await requireModuleAccess(request, 'sales')
      const validated = retrySchema.parse(body)
      const result = await retrySalesPageSubmission(tenantId, validated.entryId)
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }
      return NextResponse.json(
        {
          success: true,
          status: 'retried',
          contactId: result.contactId,
          entry: result.entry,
          events: ['sales_submission.received', 'sales_submission.crm_synced'],
          compatibility: { mode: 'landing-page-bridge-v2' },
        },
        { status: 202 }
      )
    }

    const validated = submissionSchema.parse(body)
    const result = await processSalesPageSubmission({
      salesPageId: validated.salesPageId,
      formId: validated.formId,
      payload: validated.payload,
      attribution: validated.attribution,
      ctaEvent: validated.ctaEvent,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(
      {
        success: true,
        status: 'received',
        contactId: result.contactId,
        entryId: result.entry.id,
        crmSyncStatus: result.entry.crmSyncStatus,
        events: ['sales_submission.received'],
        attributionPersisted: result.attributionPersisted,
        compatibility: { mode: 'landing-page-bridge-v2' },
      },
      { status: 202 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create sales submission error:', error)
    return NextResponse.json({ error: 'Failed to process sales submission' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const { searchParams } = request.nextUrl
    const pageId = searchParams.get('pageId') || undefined
    const limit = Number(searchParams.get('limit') || '50')
    const submissions = await listSalesPageSubmissions(tenantId, { pageId, limit })
    return NextResponse.json({ submissions })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('List sales submissions error:', error)
    return NextResponse.json({ error: 'Failed to list sales submissions' }, { status: 500 })
  }
}
