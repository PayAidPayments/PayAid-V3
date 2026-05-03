import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ campaignId: string }>
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { campaignId } = await context.params
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10) || 20))

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

    const rows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'email_campaign',
        entityId: campaignId,
        changeSummary: { in: ['email_campaign_retry_batch', 'email_campaign_retry_single'] },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        changedBy: true,
        changeSummary: true,
        afterSnapshot: true,
        timestamp: true,
      },
    })

    const items = rows.map((row) => {
      const after =
        row.afterSnapshot && typeof row.afterSnapshot === 'object'
          ? (row.afterSnapshot as Record<string, unknown>)
          : {}

      const senderRouting =
        after.senderRouting && typeof after.senderRouting === 'object'
          ? (after.senderRouting as Record<string, unknown>)
          : {}

      return {
        id: row.id,
        action: row.changeSummary,
        changedBy: row.changedBy,
        timestamp: row.timestamp,
        retryOperationId: toStringValue(after.retryOperationId),
        retried: toNumber(after.retried),
        requested: toNumber(after.requested),
        skippedNoRecipient: toNumber(after.skippedNoRecipient),
        selectedButNotRetriableCount: toNumber(after.selectedButNotRetriableCount),
        retriedJobIds: toStringArray(after.retriedJobIds),
        skippedNoRecipientJobIds: toStringArray(after.skippedNoRecipientJobIds),
        selectedButNotRetriableJobIds: toStringArray(after.selectedButNotRetriableJobIds),
        senderRouting: {
          usedRowOverrideCount: toNumber(senderRouting.usedRowOverrideCount),
          usedBatchOverrideCount: toNumber(senderRouting.usedBatchOverrideCount),
          usedOriginalAccountCount: toNumber(senderRouting.usedOriginalAccountCount),
          usedAutoAccountSelectionCount: toNumber(senderRouting.usedAutoAccountSelectionCount),
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        items,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('List campaign retry history failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to load retry history' }, { status: 500 })
  }
}
