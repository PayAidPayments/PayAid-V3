import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { addEmailSendJob } from '@/lib/queue/email-queue'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

const replySchema = z.object({
  accountId: z.string().optional(),
  fromEmail: z.string().email(),
  body: z.string().min(1),
  htmlBody: z.string().optional(),
})

type RouteContext = {
  params: Promise<{ messageId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const { messageId } = await context.params
    const body = await request.json()
    const input = replySchema.parse(body)

    const original = await prisma.emailMessage.findFirst({
      where: {
        id: messageId,
        account: { tenantId },
      },
      select: {
        id: true,
        subject: true,
        fromEmail: true,
        threadId: true,
      },
    })

    if (!original) {
      return NextResponse.json({ success: false, error: 'Original message not found' }, { status: 404 })
    }

    const subject = original.subject.startsWith('Re:') ? original.subject : `Re: ${original.subject}`
    const trackingId = randomUUID()

    const persisted = await prisma.emailSendJob.create({
      data: {
        tenantId,
        accountId: input.accountId,
        fromEmail: input.fromEmail,
        toEmails: [original.fromEmail],
        ccEmails: [],
        bccEmails: [],
        subject,
        htmlBody: input.htmlBody,
        textBody: input.body,
        eventType: 'reply',
        metadata: {
          replyToMessageId: original.id,
          threadId: original.threadId,
        },
        createdByUserId: userId,
        trackingId,
      },
      select: { id: true, status: true },
    })

    await addEmailSendJob({
      tenantId,
      accountId: input.accountId,
      fromEmail: input.fromEmail,
      toEmails: [original.fromEmail],
      subject,
      htmlBody: input.htmlBody,
      textBody: input.body,
      trackingId,
      replyToMessageId: original.id,
    })

    return NextResponse.json({ success: true, data: { jobId: persisted.id, status: persisted.status } }, { status: 202 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Queue reply email failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to queue email reply' }, { status: 500 })
  }
}
