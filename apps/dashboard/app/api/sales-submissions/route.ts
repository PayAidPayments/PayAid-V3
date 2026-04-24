import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'

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

// Public ingestion endpoint for published sales pages.
// NOTE: Bridge mode persists telemetry on LandingPage until canonical sales_submission tables are introduced.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = submissionSchema.parse(body)

    const pageItem = await prisma.landingPage.findFirst({
      where: { id: validated.salesPageId, status: 'PUBLISHED' },
      select: { id: true, tenantId: true, slug: true },
    })

    if (!pageItem) {
      return NextResponse.json({ error: 'Published sales page not found' }, { status: 404 })
    }

    // Bridge behavior: increment conversion metrics on landing page.
    await prisma.landingPage.update({
      where: { id: pageItem.id },
      data: { conversions: { increment: 1 } },
    })

    // Placeholder response that callers can already integrate against.
    return NextResponse.json(
      {
        success: true,
        status: 'received',
        events: ['sales_submission.received'],
        crmSync: 'queued',
        automation: 'queued',
        compatibility: { mode: 'landing-page-bridge' },
      },
      { status: 202 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Create sales submission error:', error)
    return NextResponse.json({ error: 'Failed to process sales submission' }, { status: 500 })
  }
}
