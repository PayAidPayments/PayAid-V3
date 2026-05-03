import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { addEmailSendJob } from '@/lib/queue/email-queue'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ campaignId: string }>
}

const retrySchema = z.object({
  limit: z.number().int().positive().max(2000).optional(),
  senderAccountId: z.string().optional(),
  jobIds: z.array(z.string()).max(2000).optional(),
  senderAccountIdByJobId: z.record(z.string(), z.string()).refine(
    (value) => Object.keys(value).length <= 2000,
    { message: 'Too many sender overrides' }
  ).optional(),
})

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'marketing')
    const retryOperationId = randomUUID()
    const { campaignId } = await context.params
    const body = await request.json().catch(() => ({}))
    const input = retrySchema.parse(body)

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
        type: 'email',
      },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    if (input.senderAccountIdByJobId && Object.keys(input.senderAccountIdByJobId).length > 0) {
      if (!input.jobIds || input.jobIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'jobIds are required when senderAccountIdByJobId is provided' },
          { status: 400 }
        )
      }
      const selectedJobIds = new Set(input.jobIds)
      const invalidOverrideJobId = Object.keys(input.senderAccountIdByJobId).find(
        (jobId) => !selectedJobIds.has(jobId)
      )
      if (invalidOverrideJobId) {
        return NextResponse.json(
          { success: false, error: 'senderAccountIdByJobId contains jobIds outside selected jobIds' },
          { status: 400 }
        )
      }
    }

    const senderAccountIdsToValidate = new Set<string>()
    if (input.senderAccountId) {
      senderAccountIdsToValidate.add(input.senderAccountId)
    }
    for (const senderAccountId of Object.values(input.senderAccountIdByJobId || {})) {
      if (senderAccountId) {
        senderAccountIdsToValidate.add(senderAccountId)
      }
    }

    if (senderAccountIdsToValidate.size > 0) {
      const validAccounts = await prisma.emailAccount.findMany({
        where: {
          tenantId,
          isActive: true,
          id: { in: Array.from(senderAccountIdsToValidate) },
        },
        select: { id: true },
      })
      const validAccountIds = new Set(validAccounts.map((account) => account.id))
      const invalidSenderAccountId = Array.from(senderAccountIdsToValidate).find((id) => !validAccountIds.has(id))
      if (invalidSenderAccountId) {
        return NextResponse.json({ success: false, error: 'Invalid sender account' }, { status: 400 })
      }
    }

    const failedJobs = await prisma.emailSendJob.findMany({
      where: {
        tenantId,
        campaignId,
        status: { in: ['failed', 'dead_letter'] },
        ...(input.jobIds && input.jobIds.length > 0
          ? {
              id: { in: input.jobIds },
            }
          : {}),
      },
      orderBy: { updatedAt: 'asc' },
      take: input.limit ?? 500,
    })

    const selectedJobIds = new Set(input.jobIds || [])
    const failedJobIds = new Set(failedJobs.map((job) => job.id))
    const selectedButNotRetriableJobIds =
      selectedJobIds.size > 0
        ? Array.from(selectedJobIds).filter((jobId) => !failedJobIds.has(jobId))
        : []

    if (failedJobs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          retried: 0,
          skipped: true,
          retryOperationId,
          requested: 0,
          skippedNoRecipient: 0,
          selectedButNotRetriableCount: selectedButNotRetriableJobIds.length,
          selectedButNotRetriableJobIds,
          retriedJobIds: [],
          skippedNoRecipientJobIds: [],
        },
      })
    }

    let retried = 0
    let skippedNoRecipient = 0
    let usedRowOverrideCount = 0
    let usedBatchOverrideCount = 0
    let usedOriginalAccountCount = 0
    let usedAutoAccountSelectionCount = 0
    const retriedBySenderAccount: Record<string, number> = {}
    const retriedJobIds: string[] = []
    const skippedNoRecipientJobIds: string[] = []

    for (const row of failedJobs) {
      const to = row.toEmails?.[0]
      if (!to) {
        skippedNoRecipient++
        skippedNoRecipientJobIds.push(row.id)
        continue
      }
      const overrideSenderAccountId = input.senderAccountIdByJobId?.[row.id]
      const resolvedSenderAccountId = overrideSenderAccountId || input.senderAccountId || row.accountId
      if (overrideSenderAccountId) {
        usedRowOverrideCount++
      } else if (input.senderAccountId) {
        usedBatchOverrideCount++
      } else if (row.accountId) {
        usedOriginalAccountCount++
      } else {
        usedAutoAccountSelectionCount++
      }

      await prisma.emailSendJob.update({
        where: { id: row.id },
        data: {
          status: 'pending',
          error: null,
          attempts: 0,
          accountId: resolvedSenderAccountId,
          updatedAt: new Date(),
        },
      })

      await addEmailSendJob(
        {
          tenantId,
          accountId: resolvedSenderAccountId || undefined,
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
          jobId: `email-retry-${campaignId}-${row.id}-${Date.now()}`,
          removeOnComplete: true,
        }
      )

      const senderBucket = resolvedSenderAccountId || 'auto'
      retriedBySenderAccount[senderBucket] = (retriedBySenderAccount[senderBucket] || 0) + 1
      retried++
      retriedJobIds.push(row.id)
    }

    await prisma.campaign.updateMany({
      where: { id: campaignId, tenantId },
      data: { status: 'sending' },
    })

    await writeIntegrationAudit({
      tenantId,
      userId,
      entityType: 'email_campaign',
      entityId: campaignId,
      action: 'email_campaign_retry_batch',
      after: {
        retried,
        requested: failedJobs.length,
        senderAccountId: input.senderAccountId || null,
        selectedJobCount: input.jobIds?.length || null,
        retryOperationId,
        senderAccountOverrideCount: Object.keys(input.senderAccountIdByJobId || {}).length,
        skippedNoRecipient,
        skippedNoRecipientJobIds,
        selectedButNotRetriableCount: selectedButNotRetriableJobIds.length,
        selectedButNotRetriableJobIds,
        retriedJobIds,
        senderRouting: {
          usedRowOverrideCount,
          usedBatchOverrideCount,
          usedOriginalAccountCount,
          usedAutoAccountSelectionCount,
          retriedBySenderAccount,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        retried,
        retryOperationId,
        requested: failedJobs.length,
        skippedNoRecipient,
        skippedNoRecipientJobIds,
        selectedButNotRetriableCount: selectedButNotRetriableJobIds.length,
        selectedButNotRetriableJobIds,
        retriedJobIds,
        senderRouting: {
          usedRowOverrideCount,
          usedBatchOverrideCount,
          usedOriginalAccountCount,
          usedAutoAccountSelectionCount,
          retriedBySenderAccount,
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
    console.error('Retry failed campaign jobs failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to retry campaign jobs' }, { status: 500 })
  }
}
