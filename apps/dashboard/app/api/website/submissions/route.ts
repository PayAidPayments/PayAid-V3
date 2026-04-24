import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ingestWebsiteSubmission } from '@/lib/website-builder/repository'

const websiteSubmissionSchema = z.object({
  siteId: z.string().min(1),
  formId: z.string().optional(),
  pageId: z.string().optional(),
  payload: z.record(z.any()),
  attribution: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      content: z.string().optional(),
      term: z.string().optional(),
      referrer: z.string().optional(),
      pageUrl: z.string().optional(),
    })
    .optional(),
  ctaEvent: z
    .object({
      type: z.enum(['form_submit', 'call_now', 'whatsapp_now', 'book_now', 'pay_now', 'download']),
      metadata: z.record(z.any()).optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = websiteSubmissionSchema.parse(body)

    const submission = await ingestWebsiteSubmission({ siteId: validated.siteId })

    if (!submission.site) return NextResponse.json({ error: 'Published website site not found' }, { status: 404 })

    return NextResponse.json(
      {
        success: true,
        status: 'received',
        events: ['website.form.submitted'],
        crmSync: 'queued',
        automation: 'queued',
        compatibility: { mode: submission.mode },
      },
      { status: 202 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Create website submission error:', error)
    return NextResponse.json({ error: 'Failed to process website submission' }, { status: 500 })
  }
}
