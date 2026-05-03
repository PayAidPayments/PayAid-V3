// @ts-nocheck — references Prisma models not yet in schema (marketing channel stack).
import { prisma } from '@/lib/db/prisma'

const DEMO_SEGMENT_LABELS: Record<string, string> = {
  'segment-1': 'High Value Customers',
  'segment-2': 'Active Leads',
  'segment-3': 'Proposal Stage',
  'segment-4': 'Inactive Customers',
}

export type CampaignEventRow = {
  id: string
  at: string
  title: string
  message: string
  kind: 'info' | 'success' | 'warning' | 'error'
  actor: 'system' | 'user'
}

export type RecipientSampleRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string
}

export type CampaignDetailPayload = {
  campaign: {
    id: string
    name: string
    type: string
    status: string
    subject: string | null
    content: string
    segmentId: string | null
    contactIds: string[]
    recipientCount: number
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
    createdAt: string
    updatedAt: string
    scheduledFor: string | null
    sentAt: string | null
  }
  summary: {
    audienceCount: number
    processedCount: number
    sentCount: number
    deliveredCount: number
    failedCount: number
    pendingCount: number
    primaryMetricLabel: string
    primaryMetricValue: number
    primaryMetricHint?: string
  }
  template: {
    id: string | null
    name: string
    version: string | null
    channel: string
    lastEditedBy: string | null
    updatedAt: string | null
  }
  contentPreview: {
    subject: string | null
    body: string
    previewText: string | null
  }
  variables: string[]
  audience: {
    sourceType: 'segment' | 'list' | 'manual'
    sourceName: string
    filters: Record<string, string>
    excludedCount: number
    validCount: number
    invalidCount: number
  }
  recipientsSample: RecipientSampleRow[]
  performance: {
    metrics: Record<string, number>
    trend: { t: string; sent: number; opened: number; clicked: number }[]
    failures: { reason: string; count: number }[]
    topLinks: { url: string; clicks: number; ctr: number }[]
    conversions: { label: string; value: number }[]
  }
  providerStats: {
    smsByStatus: Record<string, number>
    emailBounceRecords: number
    emailOptOutRecords: number
  }
  activityLog: CampaignEventRow[]
  warnings: string[]
  analytics:
    | {
        sent: number
        delivered: number
        opened: number
        clicked: number
        bounced: number
        unsubscribed: number
        openRate: number
        clickRate: number
        clickThroughRate: number
      }
    | null
}

function extractVariables(content: string): string[] {
  const re = /\{\{\s*([^}]+?)\s*\}\}/g
  const out = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    out.add(`{{${m[1].trim()}}}`)
  }
  return [...out]
}

function primaryMetricForChannel(type: string, c: { opened: number; delivered: number; clicked: number }): {
  label: string
  value: number
  hint?: string
} {
  const t = type.toLowerCase()
  if (t === 'email') return { label: 'Opens', value: c.opened, hint: 'Unique opens' }
  if (t === 'whatsapp' || t === 'sms') return { label: 'Delivered', value: c.delivered, hint: 'Provider-confirmed' }
  if (t === 'ads' || t === 'social') return { label: 'Clicks', value: c.clicked, hint: 'Attributed clicks (if tracked)' }
  return { label: 'Engagement', value: c.opened + c.clicked, hint: 'Opens + clicks' }
}

export async function buildCampaignDetailPayload(
  campaignId: string,
  tenantId: string
): Promise<CampaignDetailPayload | null> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, tenantId },
  })
  if (!campaign) return null

  const channel = campaign.type.toLowerCase()
  const isBroadcastChannel = channel === 'email' || channel === 'whatsapp' || channel === 'sms'

  const segment =
    campaign.segmentId != null
      ? await prisma.segment.findFirst({
          where: { id: campaign.segmentId, tenantId },
          select: { id: true, name: true, criteria: true },
        })
      : null

  const sampleIds = campaign.contactIds.slice(0, 50)
  const [recipientsSample, smsReports, emailBounceRecords, emailOptOutRecords] = await Promise.all([
    sampleIds.length
      ? prisma.contact.findMany({
          where: { tenantId, id: { in: sampleIds } },
          select: { id: true, name: true, email: true, phone: true, status: true },
          take: 50,
        })
      : [],
    prisma.sMSDeliveryReport.findMany({
      where: { tenantId, campaignId },
      select: { status: true },
    }),
    prisma.emailBounce.count({ where: { tenantId, campaignId } }),
    prisma.emailOptOut.count({ where: { tenantId, campaignId } }),
  ])

  const recipientCount = campaign.recipientCount
  const sent = campaign.sent
  const delivered = campaign.delivered
  const opened = campaign.opened
  const clicked = campaign.clicked
  const bounced = campaign.bounced

  const smsByStatus: Record<string, number> = {}
  let smsFailed = 0
  for (const r of smsReports) {
    smsByStatus[r.status] = (smsByStatus[r.status] ?? 0) + 1
    const st = r.status.toUpperCase()
    if (st.includes('FAIL') || st === 'FAILED' || st === 'UNDELIVERED') smsFailed += 1
  }

  const failedCount = bounced + smsFailed
  const pendingCount = Math.max(0, recipientCount - sent)

  let sourceType: 'segment' | 'list' | 'manual' = 'manual'
  let sourceName = 'Manual selection'
  if (campaign.segmentId) {
    sourceType = 'segment'
    sourceName = segment?.name ?? DEMO_SEGMENT_LABELS[campaign.segmentId] ?? campaign.segmentId
  } else if (campaign.contactIds.length > 0) {
    sourceType = 'list'
    sourceName = `Selected contacts (${campaign.contactIds.length})`
  } else if (recipientCount > 0) {
    sourceName = 'Active contacts (default audience)'
  }

  const filters: Record<string, string> = {}
  if (segment?.criteria) filters.criteria = segment.criteria

  const primary = primaryMetricForChannel(campaign.type, { opened, delivered, clicked })

  const analytics =
    sent > 0
      ? {
          sent,
          delivered,
          opened,
          clicked,
          bounced,
          unsubscribed: campaign.unsubscribed,
          openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
          clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
          clickThroughRate: opened > 0 ? (clicked / opened) * 100 : 0,
        }
      : null

  const warnings: string[] = []
  const st = campaign.status.toLowerCase()
  if (isBroadcastChannel && (st === 'completed' || st === 'sent') && sent === 0 && recipientCount > 0) {
    warnings.push(
      'This campaign is marked completed, but no sends were recorded. Check the activity log, provider connection, or whether stats have synced.'
    )
  }
  if (isBroadcastChannel && st === 'completed' && sent === 0 && recipientCount === 0) {
    warnings.push('No recipients were attached to this campaign when it completed.')
  }
  if (isBroadcastChannel && sent > 0 && delivered === 0) {
    warnings.push('Sends are recorded but delivery confirmations are still zero — provider webhooks may be pending.')
  }

  const events: CampaignEventRow[] = [
    {
      id: 'ev-created',
      at: campaign.createdAt.toISOString(),
      title: 'Campaign created',
      message: `Campaign "${campaign.name}" was created.`,
      kind: 'info',
      actor: 'system',
    },
  ]
  if (campaign.scheduledFor) {
    events.push({
      id: 'ev-scheduled',
      at: campaign.scheduledFor.toISOString(),
      title: 'Scheduled',
      message: `Send window: ${campaign.scheduledFor.toISOString()}`,
      kind: 'info',
      actor: 'system',
    })
  }
  if (campaign.sentAt) {
    events.push({
      id: 'ev-sent',
      at: campaign.sentAt.toISOString(),
      title: 'Dispatch recorded',
      message: `Last dispatch timestamp recorded (${sent} sends in aggregate).`,
      kind: 'success',
      actor: 'system',
    })
  }
  events.push({
    id: 'ev-status',
    at: campaign.updatedAt.toISOString(),
    title: `Status: ${campaign.status}`,
    message: 'Latest lifecycle state on the campaign record.',
    kind: st === 'failed' || st === 'cancelled' ? 'warning' : 'info',
    actor: 'system',
  })

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  const body = campaign.content ?? ''
  const previewText =
    body.length > 160 ? `${body.slice(0, 157).trim()}…` : body.trim() || null

  const trend =
    sent > 0 || delivered > 0
      ? [
          {
            t: campaign.sentAt?.toISOString() ?? campaign.updatedAt.toISOString(),
            sent,
            opened,
            clicked,
          },
        ]
      : []

  const failureReasons: { reason: string; count: number }[] = []
  if (bounced > 0) failureReasons.push({ reason: 'Bounced / invalid address', count: bounced })
  if (smsFailed > 0) failureReasons.push({ reason: 'SMS provider failure', count: smsFailed })
  if (emailBounceRecords > 0) failureReasons.push({ reason: 'Email bounce records', count: emailBounceRecords })

  const payload: CampaignDetailPayload = {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      subject: campaign.subject,
      content: campaign.content,
      segmentId: campaign.segmentId,
      contactIds: campaign.contactIds,
      recipientCount,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      unsubscribed: campaign.unsubscribed,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      scheduledFor: campaign.scheduledFor?.toISOString() ?? null,
      sentAt: campaign.sentAt?.toISOString() ?? null,
    },
    summary: {
      audienceCount: recipientCount,
      processedCount: sent,
      sentCount: sent,
      deliveredCount: delivered,
      failedCount,
      pendingCount,
      primaryMetricLabel: primary.label,
      primaryMetricValue: primary.value,
      primaryMetricHint: primary.hint,
    },
    template: {
      id: null,
      name: 'Inline message',
      version: null,
      channel: campaign.type,
      lastEditedBy: null,
      updatedAt: campaign.updatedAt.toISOString(),
    },
    contentPreview: {
      subject: campaign.subject,
      body: campaign.content,
      previewText,
    },
    variables: extractVariables(campaign.content ?? ''),
    audience: {
      sourceType,
      sourceName,
      filters,
      excludedCount: 0,
      validCount: recipientCount,
      invalidCount: 0,
    },
    recipientsSample: recipientsSample.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      status: r.status,
    })),
    performance: {
      metrics: {
        openRate: analytics?.openRate ?? 0,
        clickRate: analytics?.clickRate ?? 0,
        ctr: analytics?.clickThroughRate ?? 0,
        bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
        unsubscribeRate: sent > 0 ? (campaign.unsubscribed / sent) * 100 : 0,
      },
      trend,
      failures: failureReasons,
      topLinks: [],
      conversions: [],
    },
    providerStats: {
      smsByStatus,
      emailBounceRecords,
      emailOptOutRecords,
    },
    activityLog: events,
    warnings,
    analytics,
  }

  return payload
}
