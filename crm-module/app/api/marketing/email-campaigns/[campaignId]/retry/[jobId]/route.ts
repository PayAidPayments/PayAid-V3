import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { addEmailSendJob } from '@/lib/queue/email-queue'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ campaignId: string; jobId: string }>
}

const retryJobSchema = z.object({
  senderAccountId: z.string().optional(),
})

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'marketing')
    const retryOperationId = randomUUID()
    const { campaignId, jobId } = await context.params
    const body = await request.json().catch(() => ({}))
    const input = retryJobSchema.parse(body)

    const row = await prisma.emailSendJob.findFirst({
      where: {
        id: jobId,
        tenantId,
        campaignId,
      },
    })

    if (!row) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    if (!['failed', 'dead_letter'].includes(row.status)) {
      return NextResponse.json({ success: false, error: 'Only failed/dead-letter jobs can be retried' }, { status: 400 })
    }

    if (input.senderAccountId) {
      const account = await prisma.emailAccount.findFirst({
        where: {
          id: input.senderAccountId,
          tenantId,
          isActive: true,
        },
        select: { id: true },
      })
      if (!account) {
        return NextResponse.json({ success: false, error: 'Invalid sender account' }, { status: 400 })
      }
    }

    await prisma.emailSendJob.update({
      where: { id: row.id },
      data: {
        status: 'pending',
        error: null,
        attempts: 0,
        accountId: input.senderAccountId || row.accountId,
        updatedAt: new Date(),
      },
    })

    await addEmailSendJob(
      {
        tenantId,
        accountId: input.senderAccountId || row.accountId || undefined,
        fromEmail: row.fromEmail,
        toEmails: row.toEmails,
        ccEmails: row.ccEmails,
        bccEmails: row.bccEmails,
        subject: row.subject,
        htmlBody: row.htmlBody || undefined,
        textBody: row.textBody || undefined,
        campaignId: row.campaignId || undefined,
        contactId: row.contactId || undefined,
        dealId: row.dealId || undefined,
        trackingId: row.trackingId || row.id,
      },
      {
        jobId: `email-retry-single-${campaignId}-${row.id}-${Date.now()}`,
        removeOnComplete: true,
      }
    )

    await prisma.campaign.updateMany({
      where: { id: campaignId, tenantId },
      data: { status: 'sending' },
    })

    await writeIntegrationAudit({
      tenantId,
      userId,
      entityType: 'email_campaign',
      entityId: campaignId,
      action: 'email_campaign_retry_single',
      after: {
        retried: 1,
        requested: 1,
        retriedJobId: row.id,
        retriedJobIds: [row.id],
        skippedNoRecipient: 0,
        skippedNoRecipientJobIds: [],
        selectedButNotRetriableCount: 0,
        selectedButNotRetriableJobIds: [],
        retryOperationId,
        senderAccountId: input.senderAccountId || row.accountId || null,
        senderRouting: {
          usedRowOverrideCount: input.senderAccountId ? 1 : 0,
          usedBatchOverrideCount: 0,
          usedOriginalAccountCount: input.senderAccountId ? 0 : row.accountId ? 1 : 0,
          usedAutoAccountSelectionCount: input.senderAccountId || row.accountId ? 0 : 1,
          retriedBySenderAccount: {
            [input.senderAccountId || row.accountId || 'auto']: 1,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        retried: 1,
        retryOperationId,
        requested: 1,
        retriedJobId: row.id,
        retriedJobIds: [row.id],
        skippedNoRecipient: 0,
        skippedNoRecipientJobIds: [],
        selectedButNotRetriableCount: 0,
        selectedButNotRetriableJobIds: [],
        senderRouting: {
          usedRowOverrideCount: input.senderAccountId ? 1 : 0,
          usedBatchOverrideCount: 0,
          usedOriginalAccountCount: input.senderAccountId ? 0 : row.accountId ? 1 : 0,
          usedAutoAccountSelectionCount: input.senderAccountId || row.accountId ? 0 : 1,
          retriedBySenderAccount: {
            [input.senderAccountId || row.accountId || 'auto']: 1,
          },
        },
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Retry single campaign job failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to retry job' }, { status: 500 })
  }
}
