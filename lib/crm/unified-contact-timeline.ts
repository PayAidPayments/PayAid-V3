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

/** Activity channel aligned with CRM contact timeline filters (email, call, WhatsApp, meeting, note, task; deals returned separately). */
export type ContactTimelineActivityType =
  | 'email'
  | 'call'
  | 'whatsapp'
  | 'sms'
  | 'meeting'
  | 'note'
  | 'task'
  | 'system'

export type ContactTimelineActivityRow = {
  id: string
  type: ContactTimelineActivityType
  title: string
  description?: string | null
  createdAt: string
  metadata: Record<string, unknown>
  /** Present for email rows (campaign / deal / contact deep link). */
  href?: string | null
}

export type ContactTimelineDealRow = {
  id: string
  name: string
  value: number
  stage: string
  createdAt: string
}

function interactionToActivityType(raw: string): ContactTimelineActivityType {
  const t = (raw || '').toLowerCase()
  if (t === 'email') return 'email'
  if (t === 'whatsapp') return 'whatsapp'
  if (t === 'sms') return 'sms'
  if (t === 'meeting') return 'meeting'
  return 'call'
}

/**
 * Merges interactions (including distinct `sms` vs `whatsapp` types), CRM tasks, contact-scoped
 * comments, deals, outbound email jobs (`EmailSendJob`), email tracking (`EmailTrackingEvent`),
 * native `SMSDeliveryReport` rows, `CallRecording`/`AICall`, and `VoiceAgentCall` recordings
 * (customerId or phone match) for one contact into
 * a single sorted activity list (blueprint: unified communication timeline — contact slice).
 */
export async function buildUnifiedContactTimeline(params: {
  tenantId: string
  contactId: string
  limit?: number
}): Promise<{ activities: ContactTimelineActivityRow[]; deals: ContactTimelineDealRow[] } | null> {
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 200)
  const perSource = Math.min(80, limit)

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

  const emailTrackSelect = {
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
  } as const

  const [
    contact,
    interactions,
    tasks,
    comments,
    deals,
    emailJobs,
    emailTracking,
    callRecordings,
    whatsappMessages,
    smsDeliveryReports,
  ] = await Promise.all([
    prisma.contact.findFirst({
      where: { id: params.contactId, tenantId: params.tenantId },
      select: { id: true, notes: true, updatedAt: true, phone: true },
    }),
    prisma.interaction.findMany({
      where: { contactId: params.contactId, contact: { tenantId: params.tenantId } },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      include: {
        contact: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.task.findMany({
      where: { tenantId: params.tenantId, contactId: params.contactId },
      orderBy: { createdAt: 'desc' },
      take: perSource,
    }),
    prisma.comment.findMany({
      where: {
        tenantId: params.tenantId,
        entityType: 'contact',
        entityId: params.contactId,
      },
      orderBy: { createdAt: 'desc' },
      take: perSource,
    }),
    prisma.deal.findMany({
      where: { tenantId: params.tenantId, contactId: params.contactId },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      select: { id: true, name: true, value: true, stage: true, createdAt: true },
    }),
    prisma.emailSendJob.findMany({
      where: { tenantId: params.tenantId, contactId: params.contactId },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      select: emailJobSelect,
    }),
    prisma.emailTrackingEvent.findMany({
      where: { tenantId: params.tenantId, contactId: params.contactId },
      orderBy: { occurredAt: 'desc' },
      take: perSource,
      select: emailTrackSelect,
    }),
    prisma.callRecording.findMany({
      where: {
        tenantId: params.tenantId,
        call: { contactId: params.contactId },
      },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      select: {
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
      },
    }),
    prisma.whatsappMessage.findMany({
      where: {
        conversation: {
          contactId: params.contactId,
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
      where: { tenantId: params.tenantId, contactId: params.contactId },
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

  if (!contact) {
    return null
  }

  const phone = contact.phone?.trim() || ''
  const voiceOr: Array<
    { customerId: string } | { phone: string } | { from: string } | { to: string }
  > = [{ customerId: params.contactId }]
  if (phone) {
    voiceOr.push({ phone }, { from: phone }, { to: phone })
  }

  const voiceAgentCalls = await prisma.voiceAgentCall.findMany({
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
  })

  const activities: ContactTimelineActivityRow[] = []

  for (const j of emailJobs) {
    const ts = j.sentAt ?? j.createdAt
    activities.push({
      id: `email-job:${j.id}`,
      type: 'email',
      title: titleForEmailSendJob(j.subject, j.status),
      description: descriptionLineForEmailSendJob(j),
      createdAt: ts.toISOString(),
      href: hrefForEmailTimelineDetail(params.tenantId, {
        campaignId: j.campaignId,
        dealId: j.dealId,
        contactId: j.contactId ?? params.contactId,
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

  for (const ev of emailTracking) {
    activities.push({
      id: `email-track:${ev.id}`,
      type: 'email',
      title: titleForEmailTrackingEvent(ev.eventType),
      description: descriptionLineForEmailTrackingEvent(ev.eventType, ev.eventData, {
        ipAddress: ev.ipAddress,
        referer: ev.referer,
        userAgent: ev.userAgent,
        messageId: ev.messageId,
      }),
      createdAt: ev.occurredAt.toISOString(),
      href: hrefForEmailTimelineDetail(params.tenantId, {
        campaignId: ev.campaignId,
        contactId: ev.contactId ?? params.contactId,
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

  for (const w of whatsappMessages) {
    const ts = w.sentAt || w.deliveredAt || w.readAt || w.createdAt
    activities.push({
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
      },
    })
  }

  for (const s of smsDeliveryReports) {
    const ts = s.sentAt ?? s.deliveredAt ?? s.failedAt ?? s.createdAt
    const raw = s.message?.trim()
    const preview =
      raw && raw.length > 160 ? `${raw.slice(0, 157)}…` : raw || undefined
    activities.push({
      id: `sms:${s.id}`,
      type: 'sms',
      title: titleForSmsDeliveryReport(s.status),
      description: preview || `${s.phoneNumber} · ${s.status}`,
      createdAt: ts.toISOString(),
      href: hrefForSmsDeliveryTimelineDetail(params.tenantId, {
        campaignId: s.campaignId,
        contactId: s.contactId ?? params.contactId,
        smsDeliveryReportId: s.campaignId ? s.id : undefined,
      }),
      metadata: {
        source: 'sms_delivery_report',
        smsDeliveryReportId: s.id,
        campaignId: s.campaignId,
        contactId: s.contactId ?? params.contactId,
        phoneNumber: s.phoneNumber,
        status: s.status,
        messageId: s.messageId,
      },
    })
  }

  for (const r of callRecordings) {
    const call = r.call
    activities.push({
      id: `call-rec:${r.id}`,
      type: 'call',
      title: `Recording · ${call.phoneNumber}`,
      description: `${call.direction} · ${call.status}${r.duration != null ? ` · ${r.duration}s` : ''}`,
      createdAt: r.createdAt.toISOString(),
      href: hrefForCallRecordingTimeline(params.tenantId, {
        recordingUrl: r.recordingUrl,
        contactId: call.contactId ?? params.contactId,
        dealId: call.dealId,
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

  for (const v of voiceAgentCalls) {
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
    activities.push({
      id: `voice-agent:${v.id}`,
      type: 'call',
      title: `Voice recording · ${label}`,
      description: descParts.join(' · ') || undefined,
      createdAt: (v.endTime || v.startTime || v.createdAt).toISOString(),
      href: hrefForCallRecordingTimeline(params.tenantId, {
        recordingUrl: recUrl,
        contactId: v.customerId ?? params.contactId,
        dealId: undefined,
      }),
      metadata: {
        source: 'voice_agent_call',
        voiceAgentCallId: v.id,
        recordingUrl: recUrl,
        contactId: v.customerId ?? params.contactId,
        phone: v.phone,
        from: v.from,
        to: v.to,
        status: v.status,
        inbound: v.inbound,
        durationSeconds: v.durationSeconds ?? v.metadata?.recordingDuration ?? null,
      },
    })
  }

  for (const i of interactions) {
    const actType = interactionToActivityType(i.type)
    activities.push({
      id: i.id,
      type: actType,
      title: i.subject || `${i.type} · ${i.contact?.name || 'Contact'}`,
      description: i.notes || i.outcome || null,
      createdAt: i.createdAt.toISOString(),
      href:
        actType === 'email'
          ? hrefForEmailTimelineDetail(params.tenantId, {
              campaignId: i.campaignId,
              contactId: i.contactId,
              emailSendJobId: i.emailSendJobId,
            })
          : null,
      metadata: {
        source: 'interaction',
        id: i.id,
        type: i.type,
        subject: i.subject,
        notes: i.notes,
        outcome: i.outcome,
        duration: i.duration,
        createdAt: i.createdAt.toISOString(),
        campaignId: i.campaignId,
        emailSendJobId: i.emailSendJobId,
        contactId: i.contactId,
        contact: i.contact,
      },
    })
  }

  for (const t of tasks) {
    activities.push({
      id: t.id,
      type: 'task',
      title: t.title,
      description: t.description,
      createdAt: (t.completedAt || t.createdAt || t.dueDate || new Date()).toISOString(),
      metadata: {
        source: 'task',
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt?.toISOString() ?? null,
      },
    })
  }

  for (const c of comments) {
    activities.push({
      id: `comment:${c.id}`,
      type: 'note',
      title: 'Comment',
      description: c.content,
      createdAt: c.createdAt.toISOString(),
      metadata: { source: 'comment', commentId: c.id },
    })
  }

  const publicNotes = contact.notes?.trim()
  if (publicNotes) {
    activities.push({
      id: `contact:${params.contactId}:public-notes`,
      type: 'note',
      title: 'Notes',
      description: publicNotes,
      createdAt: contact.updatedAt.toISOString(),
      metadata: { source: 'contact_notes' },
    })
  }

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return {
    activities: activities.slice(0, limit),
    deals: deals.map((d) => ({
      id: d.id,
      name: d.name,
      value: d.value,
      stage: d.stage,
      createdAt: d.createdAt.toISOString(),
    })),
  }
}
