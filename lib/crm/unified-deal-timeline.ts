// @ts-nocheck — Interaction include/select vs Prisma schema (timeline contracts tracked separately).
import 'server-only'

import { hrefForEmailTimelineDetail } from '@/lib/crm/email-timeline-href'
import { hrefForCallRecordingTimeline } from '@/lib/crm/recording-timeline-href'
import { hrefForSmsDeliveryTimelineDetail } from '@/lib/crm/sms-timeline-href'
import { titleForSmsDeliveryReport } from '@/lib/crm/sms-timeline-shared'
import { hrefForWhatsappTimelineDetail } from '@/lib/crm/whatsapp-timeline-href'
import {
  descriptionLineForEmailSendJob,
  descriptionLineForEmailTrackingEvent,
  titleForEmailSendJob,
  titleForEmailTrackingEvent,
} from '@/lib/crm/email-timeline-shared'
import { resolveVoiceAgentRecordingUrl } from '@/lib/crm/voice-agent-timeline'
import { prisma } from '@/lib/db/prisma'

/** Mirrors `DealTimeline` client `TimelineEvent` + optional `href`. */
export type DealTimelineEventRow = {
  id: string
  type: string
  title: string
  description?: string | null
  createdAt: string
  metadata?: Record<string, unknown>
  href?: string | null
}

function interactionToCommType(raw: string): 'email' | 'call' | 'whatsapp' | 'sms' | 'meeting' {
  const t = (raw || '').toLowerCase()
  if (t === 'email') return 'email'
  if (t === 'whatsapp') return 'whatsapp'
  if (t === 'sms') return 'sms'
  if (t === 'meeting') return 'meeting'
  return 'call'
}

function interactionTitle(i: { type: string; subject?: string | null; notes?: string | null }): string {
  const type = interactionToCommType(i.type)
  if (type === 'call') return 'Call logged'
  if (type === 'meeting') return 'Meeting' + (i.subject ? `: ${i.subject}` : '')
  if (type === 'email') return i.subject?.trim() || 'Email'
  if (type === 'whatsapp') return i.subject?.trim() || 'WhatsApp'
  if (type === 'sms') return i.subject?.trim() || 'SMS'
  return i.subject || i.type || 'Activity'
}

/**
 * Deal timeline: milestones, quote, proposals, deal-scoped comments, deal-scoped email jobs
 * plus tracking for those sends, `CallRecording`/`AICall` on this deal, `VoiceAgentCall` recordings
 * for the linked contact (customerId + phone match), native `SMSDeliveryReport` rows for that
 * contact, and (when linked) full contact communication surface (interactions, tasks, contact
 * comments) merged and sorted.
 */
export async function buildUnifiedDealTimeline(params: {
  tenantId: string
  dealId: string
  limit?: number
}): Promise<{ events: DealTimelineEventRow[] } | null> {
  const maxOut = Math.min(Math.max(params.limit ?? 150, 1), 300)
  const perSource = Math.min(60, maxOut)

  const deal = await prisma.deal.findFirst({
    where: { id: params.dealId, tenantId: params.tenantId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      stage: true,
      actualCloseDate: true,
      wonReason: true,
      lostReason: true,
      contactId: true,
    },
  })

  if (!deal) return null

  const emailJobSelect = {
    id: true,
    subject: true,
    status: true,
    error: true,
    toEmails: true,
    sentAt: true,
    createdAt: true,
    campaignId: true,
    dealId: true,
    contactId: true,
    trackingId: true,
    eventType: true,
  } as const

  const [quote, proposals, dealComments, emailJobsForDeal] = await Promise.all([
    prisma.quote.findFirst({
      where: { dealId: deal.id, tenantId: params.tenantId },
    }),
    prisma.proposal.findMany({
      where: { dealId: deal.id, tenantId: params.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.comment.findMany({
      where: {
        tenantId: params.tenantId,
        entityType: 'deal',
        entityId: deal.id,
      },
      orderBy: { createdAt: 'desc' },
      take: perSource,
    }),
    prisma.emailSendJob.findMany({
      where: { tenantId: params.tenantId, dealId: deal.id },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      select: emailJobSelect,
    }),
  ])

  const trackingIds = [...new Set(emailJobsForDeal.map((j) => j.trackingId).filter(Boolean))] as string[]
  const emailTrackForDeal =
    trackingIds.length === 0
      ? []
      : await prisma.emailTrackingEvent.findMany({
          where: { tenantId: params.tenantId, trackingId: { in: trackingIds } },
          orderBy: { occurredAt: 'desc' },
          take: perSource,
          select: {
            id: true,
            eventType: true,
            occurredAt: true,
            trackingId: true,
            campaignId: true,
            contactId: true,
            messageId: true,
            eventData: true,
            ipAddress: true,
            userAgent: true,
            referer: true,
          },
        })

  const callRecordingSelect = {
    id: true,
    recordingUrl: true,
    duration: true,
    createdAt: true,
    call: {
      select: {
        id: true,
        phoneNumber: true,
        direction: true,
        status: true,
        contactId: true,
        dealId: true,
      },
    },
  } as const

  const callRecordingsForDeal = await prisma.callRecording.findMany({
    where: {
      tenantId: params.tenantId,
      call: { dealId: deal.id },
    },
    orderBy: { createdAt: 'desc' },
    take: perSource,
    select: callRecordingSelect,
  })

  let voiceAgentCallsForDeal: Awaited<ReturnType<typeof prisma.voiceAgentCall.findMany>> = []
  let whatsappMessagesForDeal: Array<{
    id: string
    conversationId: string
    direction: string
    messageType: string
    text: string | null
    mediaUrl: string | null
    mediaCaption: string | null
    status: string | null
    fromNumber: string
    toNumber: string
    sentAt: Date | null
    deliveredAt: Date | null
    readAt: Date | null
    createdAt: Date
  }> = []
  let smsDeliveryReportsForDeal: Array<{
    id: string
    message: string
    messageId: string
    status: string
    phoneNumber: string
    sentAt: Date | null
    deliveredAt: Date | null
    failedAt: Date | null
    createdAt: Date
    campaignId: string | null
    contactId: string | null
  }> = []
  if (deal.contactId) {
    const dealContact = await prisma.contact.findFirst({
      where: { id: deal.contactId, tenantId: params.tenantId },
      select: { phone: true },
    })
    const p = dealContact?.phone?.trim() || ''
    const voiceOr: Array<
      { customerId: string } | { phone: string } | { from: string } | { to: string }
    > = [{ customerId: deal.contactId }]
    if (p) {
      voiceOr.push({ phone: p }, { from: p }, { to: p })
    }
    const [voiceRows, waRows, smsRows] = await Promise.all([
      prisma.voiceAgentCall.findMany({
        where: {
          tenantId: params.tenantId,
          OR: voiceOr,
          AND: {
            OR: [
              { recordingUrl: { not: null } },
              { metadata: { is: { recordingUrl: { not: null } } } },
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: perSource,
        include: {
          metadata: { select: { recordingUrl: true, recordingDuration: true } },
        },
      }),
      prisma.whatsappMessage.findMany({
        where: {
          conversation: {
            contactId: deal.contactId,
            account: { tenantId: params.tenantId },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: perSource,
        select: {
          id: true,
          conversationId: true,
          direction: true,
          messageType: true,
          text: true,
          mediaUrl: true,
          mediaCaption: true,
          status: true,
          fromNumber: true,
          toNumber: true,
          sentAt: true,
          deliveredAt: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.sMSDeliveryReport.findMany({
        where: { tenantId: params.tenantId, contactId: deal.contactId },
        orderBy: { createdAt: 'desc' },
        take: perSource,
        select: {
          id: true,
          message: true,
          messageId: true,
          status: true,
          phoneNumber: true,
          sentAt: true,
          deliveredAt: true,
          failedAt: true,
          createdAt: true,
          campaignId: true,
          contactId: true,
        },
      }),
    ])
    voiceAgentCallsForDeal = voiceRows
    whatsappMessagesForDeal = waRows
    smsDeliveryReportsForDeal = smsRows
  }

  const events: DealTimelineEventRow[] = []

  events.push({
    id: 'deal-created',
    type: 'deal_created',
    title: 'Deal created',
    description: deal.name || undefined,
    createdAt: deal.createdAt.toISOString(),
    metadata: { dealId: deal.id, dealName: deal.name },
  })

  if (deal.stage === 'won' && deal.actualCloseDate) {
    events.push({
      id: 'deal-won',
      type: 'deal_won',
      title: 'Deal won',
      description: deal.wonReason || undefined,
      createdAt: deal.actualCloseDate.toISOString(),
      metadata: {},
    })
  } else if (deal.stage === 'lost' && deal.actualCloseDate) {
    events.push({
      id: 'deal-lost',
      type: 'deal_lost',
      title: 'Deal lost',
      description: deal.lostReason || undefined,
      createdAt: deal.actualCloseDate.toISOString(),
      metadata: {},
    })
  }

  if (quote) {
    events.push({
      id: `quote-${quote.id}`,
      type: 'quote',
      title: `Quote ${quote.quoteNumber || quote.id.slice(0, 8)} created`,
      description: quote.status ? `Status: ${quote.status}` : undefined,
      createdAt: quote.createdAt.toISOString(),
      href: `/crm/${params.tenantId}/Quotes/${quote.id}`,
      metadata: { quoteId: quote.id, status: quote.status },
    })
  }

  for (const p of proposals) {
    const ts = p.sentAt || p.createdAt
    events.push({
      id: `proposal-${p.id}`,
      type: 'proposal',
      title: p.title ? `Proposal: ${p.title}` : 'Proposal sent',
      description: p.status ? `Status: ${p.status}` : undefined,
      createdAt: ts.toISOString(),
      href: `/crm/${params.tenantId}/Proposals/${p.id}`,
      metadata: { proposalId: p.id, status: p.status },
    })
  }

  for (const c of dealComments) {
    events.push({
      id: `deal-comment:${c.id}`,
      type: 'comment',
      title: 'Deal comment',
      description: c.content,
      createdAt: c.createdAt.toISOString(),
      metadata: { source: 'comment', commentId: c.id },
    })
  }

  for (const j of emailJobsForDeal) {
    const ts = j.sentAt ?? j.createdAt
    events.push({
      id: `email-job:${j.id}`,
      type: 'email',
      title: titleForEmailSendJob(j.subject, j.status),
      description: descriptionLineForEmailSendJob(j) ?? undefined,
      createdAt: ts.toISOString(),
      href: hrefForEmailTimelineDetail(params.tenantId, {
        campaignId: j.campaignId,
        dealId: j.dealId ?? deal.id,
        contactId: j.contactId ?? deal.contactId ?? undefined,
        emailSendJobId: j.campaignId ? j.id : undefined,
      }),
      metadata: {
        source: 'email_send_job',
        emailSendJobId: j.id,
        status: j.status,
        campaignId: j.campaignId,
        dealId: j.dealId,
        contactId: j.contactId,
        trackingId: j.trackingId,
        eventType: j.eventType,
      },
    })
  }

  for (const ev of emailTrackForDeal) {
    events.push({
      id: `email-track:${ev.id}`,
      type: 'email',
      title: titleForEmailTrackingEvent(ev.eventType),
      description:
        descriptionLineForEmailTrackingEvent(ev.eventType, ev.eventData, {
          ipAddress: ev.ipAddress,
          referer: ev.referer,
          userAgent: ev.userAgent,
          messageId: ev.messageId,
        }) ?? undefined,
      createdAt: ev.occurredAt.toISOString(),
      href: hrefForEmailTimelineDetail(params.tenantId, {
        campaignId: ev.campaignId,
        dealId: deal.id,
        contactId: ev.contactId ?? deal.contactId ?? undefined,
        emailTrackingEventId: ev.campaignId ? ev.id : undefined,
      }),
      metadata: {
        source: 'email_tracking_event',
        emailTrackingEventId: ev.id,
        eventType: ev.eventType,
        trackingId: ev.trackingId,
        campaignId: ev.campaignId,
        contactId: ev.contactId,
        messageId: ev.messageId,
        eventData: ev.eventData,
        ipAddress: ev.ipAddress,
        referer: ev.referer,
      },
    })
  }

  for (const w of whatsappMessagesForDeal) {
    const ts = w.sentAt || w.deliveredAt || w.readAt || w.createdAt
    events.push({
      id: `wa:${w.id}`,
      type: 'whatsapp',
      title: w.direction === 'inbound' ? 'WhatsApp received' : 'WhatsApp sent',
      description: w.text || w.mediaCaption || w.messageType || undefined,
      createdAt: ts.toISOString(),
      href: hrefForWhatsappTimelineDetail(w.conversationId, w.mediaUrl),
      metadata: {
        source: 'whatsapp_message',
        whatsappMessageId: w.id,
        conversationId: w.conversationId,
        direction: w.direction,
        messageType: w.messageType,
        status: w.status,
        mediaUrl: w.mediaUrl,
        fromNumber: w.fromNumber,
        toNumber: w.toNumber,
        contactId: deal.contactId,
      },
    })
  }

  for (const s of smsDeliveryReportsForDeal) {
    const ts = s.sentAt ?? s.deliveredAt ?? s.failedAt ?? s.createdAt
    const raw = s.message?.trim()
    const preview =
      raw && raw.length > 160 ? `${raw.slice(0, 157)}…` : raw || undefined
    events.push({
      id: `sms:${s.id}`,
      type: 'sms',
      title: titleForSmsDeliveryReport(s.status),
      description: preview || `${s.phoneNumber} · ${s.status}`,
      createdAt: ts.toISOString(),
      href: hrefForSmsDeliveryTimelineDetail(params.tenantId, {
        campaignId: s.campaignId,
        contactId: s.contactId ?? deal.contactId ?? undefined,
        smsDeliveryReportId: s.campaignId ? s.id : undefined,
      }),
      metadata: {
        source: 'sms_delivery_report',
        smsDeliveryReportId: s.id,
        campaignId: s.campaignId,
        contactId: s.contactId ?? deal.contactId ?? undefined,
        phoneNumber: s.phoneNumber,
        status: s.status,
        messageId: s.messageId,
      },
    })
  }

  for (const r of callRecordingsForDeal) {
    const call = r.call
    events.push({
      id: `call-rec:${r.id}`,
      type: 'call',
      title: `Recording · ${call.phoneNumber}`,
      description: `${call.direction} · ${call.status}${r.duration != null ? ` · ${r.duration}s` : ''}`,
      createdAt: r.createdAt.toISOString(),
      href: hrefForCallRecordingTimeline(params.tenantId, {
        recordingUrl: r.recordingUrl,
        contactId: call.contactId ?? deal.contactId ?? undefined,
        dealId: call.dealId ?? deal.id,
        callId: call.id,
      }),
      metadata: {
        source: 'ai_call_recording',
        recordingId: r.id,
        callId: call.id,
        recordingUrl: r.recordingUrl,
        durationSeconds: r.duration,
        contactId: call.contactId,
        dealId: call.dealId,
        phoneNumber: call.phoneNumber,
        direction: call.direction,
      },
    })
  }

  for (const v of voiceAgentCallsForDeal) {
    const recUrl = resolveVoiceAgentRecordingUrl({
      recordingUrl: v.recordingUrl,
      metadata: v.metadata,
    })
    if (!recUrl) continue
    const label = v.phone || v.from || v.to || 'Voice agent'
    const dur = v.durationSeconds ?? v.metadata?.recordingDuration ?? null
    const descParts = [
      v.status,
      v.inbound ? 'Inbound' : 'Outbound',
      dur != null ? `${dur}s` : null,
    ].filter(Boolean)
    events.push({
      id: `voice-agent:${v.id}`,
      type: 'call',
      title: `Voice recording · ${label}`,
      description: descParts.join(' · ') || undefined,
      createdAt: (v.endTime || v.startTime || v.createdAt).toISOString(),
      href: hrefForCallRecordingTimeline(params.tenantId, {
        recordingUrl: recUrl,
        contactId: v.customerId ?? deal.contactId ?? undefined,
        dealId: deal.id,
      }),
      metadata: {
        source: 'voice_agent_call',
        voiceAgentCallId: v.id,
        recordingUrl: recUrl,
        contactId: v.customerId ?? deal.contactId,
        dealId: deal.id,
        phone: v.phone,
        from: v.from,
        to: v.to,
        status: v.status,
        inbound: v.inbound,
        durationSeconds: v.durationSeconds ?? v.metadata?.recordingDuration ?? null,
      },
    })
  }

  if (deal.contactId) {
    const [interactions, tasks, contactComments, contactPublic] = await Promise.all([
      prisma.interaction.findMany({
        where: { contactId: deal.contactId, contact: { tenantId: params.tenantId } },
        orderBy: { createdAt: 'desc' },
        take: perSource,
        include: { contact: { select: { id: true, name: true } } },
      }),
      prisma.task.findMany({
        where: { tenantId: params.tenantId, contactId: deal.contactId },
        orderBy: { createdAt: 'desc' },
        take: perSource,
      }),
      prisma.comment.findMany({
        where: {
          tenantId: params.tenantId,
          entityType: 'contact',
          entityId: deal.contactId,
        },
        orderBy: { createdAt: 'desc' },
        take: perSource,
      }),
      prisma.contact.findFirst({
        where: { id: deal.contactId, tenantId: params.tenantId },
        select: { notes: true, updatedAt: true },
      }),
    ])

    for (const i of interactions) {
      const t = interactionToCommType(i.type)
      events.push({
        id: `int-${i.id}`,
        type: t,
        title: interactionTitle(i),
        description: i.notes || undefined,
        createdAt: i.createdAt.toISOString(),
        href:
          t === 'email'
            ? hrefForEmailTimelineDetail(params.tenantId, {
                campaignId: i.campaignId,
                contactId: deal.contactId ?? undefined,
                dealId: deal.id,
                emailSendJobId: i.emailSendJobId,
              })
            : null,
        metadata: {
          source: 'interaction',
          id: i.id,
          campaignId: i.campaignId,
          contactId: deal.contactId,
          dealId: deal.id,
          emailSendJobId: i.emailSendJobId,
        },
      })
    }

    for (const t of tasks) {
      events.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        description: t.description || undefined,
        createdAt: (t.completedAt || t.createdAt || t.dueDate || new Date()).toISOString(),
        metadata: { source: 'task', taskId: t.id },
      })
    }

    for (const c of contactComments) {
      events.push({
        id: `contact-comment:${c.id}`,
        type: 'comment',
        title: 'Contact comment',
        description: c.content,
        createdAt: c.createdAt.toISOString(),
        metadata: { source: 'comment', commentId: c.id, contactId: deal.contactId },
      })
    }

    const pub = contactPublic?.notes?.trim()
    if (pub) {
      events.push({
        id: `contact:${deal.contactId}:public-notes`,
        type: 'note',
        title: 'Contact notes',
        description: pub,
        createdAt: contactPublic!.updatedAt.toISOString(),
        metadata: { source: 'contact_notes' },
      })
    }
  }

  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return { events: events.slice(0, maxOut) }
}
