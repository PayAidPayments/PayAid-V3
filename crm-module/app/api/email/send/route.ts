import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { addEmailSendJob } from '@/lib/queue/email-queue'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

const sendEmailSchema = z.object({
  accountId: z.string().optional(),
  fromEmail: z.string().email(),
  toEmails: z.array(z.string().email()).min(1),
  ccEmails: z.array(z.string().email()).optional(),
  bccEmails: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
  contactId: z.string().optional(),
  campaignId: z.string().optional(),
  dealId: z.string().optional(),
  trackingId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const input = sendEmailSchema.parse(body)
    const trackingId = input.trackingId || randomUUID()

    const persisted = await prisma.emailSendJob.create({
      data: {
        tenantId,
        accountId: input.accountId,
        fromEmail: input.fromEmail,
        toEmails: input.toEmails,
        ccEmails: input.ccEmails ?? [],
        bccEmails: input.bccEmails ?? [],
        subject: input.subject,
        htmlBody: input.htmlBody,
        textBody: input.textBody,
        contactId: input.contactId,
        campaignId: input.campaignId,
        dealId: input.dealId,
        trackingId,
        eventType: 'send',
        createdByUserId: userId,
        status: 'pending',
      },
      select: { id: true, status: true, createdAt: true },
    })

    await addEmailSendJob({
      tenantId,
      accountId: input.accountId,
      fromEmail: input.fromEmail,
      toEmails: input.toEmails,
      ccEmails: input.ccEmails,
      bccEmails: input.bccEmails,
      subject: input.subject,
      htmlBody: input.htmlBody,
      textBody: input.textBody,
      contactId: input.contactId,
      campaignId: input.campaignId,
      dealId: input.dealId,
      trackingId,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: persisted.id,
          status: persisted.status,
        },
      },
      { status: 202 }
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Queue send email failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to queue email send' }, { status: 500 })
  }
}
