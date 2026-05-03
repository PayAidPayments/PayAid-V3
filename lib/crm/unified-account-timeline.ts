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

/** Normalized row for account-level activity timeline. */
export type AccountTimelineActivityRow = {
  id: string
  type: string
  title: string
  description?: string | null
  createdAt: string
  metadata: Record<string, unknown>
  href?: string | null
}

function interactionChannel(raw: string): string {
  const t = (raw || '').toLowerCase()
  if (t === 'email') return 'email'
  if (t === 'whatsapp') return 'whatsapp'
  if (t === 'sms') return 'sms'
  if (t === 'meeting') return 'meeting'
  return 'call'
}

function interactionTitle(
  i: { type: string; subject?: string | null; notes?: string | null },
  contactName: string | null
): string {
  const ch = interactionChannel(i.type)
  const who = contactName ? `${contactName}: ` : ''
  if (ch === 'call') return `${who}Call logged`
  if (ch === 'meeting') return `${who}Meeting` + (i.subject ? `: ${i.subject}` : '')
  if (ch === 'email') return `${who}${i.subject?.trim() || 'Email'}`
  if (ch === 'whatsapp') return `${who}${i.subject?.trim() || 'WhatsApp'}`
  if (ch === 'sms') return `${who}${i.subject?.trim() || 'SMS'}`
  return `${who}${i.subject || i.type || 'Activity'}`
}

/** Breadth-first: root account + descendant accounts (`parentAccountId` chain). Capped against pathological trees. */
export async function collectAccountTreeIds(
  tenantId: string,
  rootAccountId: string,
  opts?: { maxDepth?: number; maxIds?: number }
): Promise<string[]> {
  const maxDepth = opts?.maxDepth ?? 8
  const maxIds = opts?.maxIds ?? 128
  const ids = new Set<string>([rootAccountId])
  let frontier = [rootAccountId]

  for (let depth = 0; depth < maxDepth && frontier.length > 0 && ids.size < maxIds; depth += 1) {
    const budget = Math.min(100, maxIds - ids.size)
    if (budget <= 0) break

    const children = await prisma.account.findMany({
      where: { tenantId, parentAccountId: { in: frontier } },
      select: { id: true },
      take: budget,
    })

    frontier = []
    for (const c of children) {
      if (!ids.has(c.id)) {
        ids.add(c.id)
        frontier.push(c.id)
      }
      if (ids.size >= maxIds) break
    }
    if (!frontier.length || ids.size >= maxIds) break
  }

  return [...ids]
}

/**
 * Account roll-up across all contacts linked to this account (+ optional child-account roll-ups):
 * interactions, tasks, deals, quotes (via deal), proposals (via contact),
 * contact + account-scoped comments, public notes on contacts (surface as note rows),
 * email send jobs / tracking events scoped by account, linked contacts, or deals on those contacts,
 * native `SMSDeliveryReport` rows for rolled-up contacts, AI `CallRecording`/`AICall` rows, and
 * `VoiceAgentCall` recordings linked by `customerId` or bounded contact-phone OR matching
 * (`phone`/`from`/`to`).
 */
export async function buildUnifiedAccountTimeline(params: {
  tenantId: string
  accountId: string
  limit?: number
}): Promise<{ activities: AccountTimelineActivityRow[] } | null> {
  const maxOut = Math.min(Math.max(params.limit ?? 200, 1), 400)
  const perSource = Math.min(120, maxOut)

  const account = await prisma.account.findFirst({
    where: { id: params.accountId, tenantId: params.tenantId },
    select: { id: true, name: true },
  })

  if (!account) return null

  const accountIds = await collectAccountTreeIds(params.tenantId, params.accountId)
  const cWhere = {
    tenantId: params.tenantId,
    accountId: { in: accountIds },
  }

  const accountNameById =
    accountIds.length > 0
      ? new Map(
          (
            await prisma.account.findMany({
              where: { tenantId: params.tenantId, id: { in: accountIds } },
              select: { id: true, name: true },
            })
          ).map((a) => [a.id, a.name])
        )
      : new Map<string, string>()

  const contacts = await prisma.contact.findMany({
    where: cWhere,
    select: { id: true, name: true, phone: true, notes: true, updatedAt: true },
    take: 200,
  })
  const contactIds = contacts.map((c) => c.id)
  const contactPhones = [...new Set(contacts.map((c) => c.phone?.trim()).filter((p): p is string => Boolean(p)))].slice(
    0,
    60
  )

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
    accountId: true,
    trackingId: true,
    eventType: true,
  } as const

  const [
    interactions,
    tasks,
    contactComments,
    accountComments,
    deals,
    quotes,
    proposals,
  ] = await Promise.all([
    prisma.interaction.findMany({
      where: { contact: cWhere },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      include: { contact: { select: { id: true, name: true } } },
    }),
    prisma.task.findMany({
      where: { tenantId: params.tenantId, contact: cWhere },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      include: { contact: { select: { id: true, name: true } } },
    }),
    contactIds.length === 0
      ? Promise.resolve([])
      : prisma.comment.findMany({
          where: {
            tenantId: params.tenantId,
            entityType: 'contact',
            entityId: { in: contactIds },
          },
          orderBy: { createdAt: 'desc' },
          take: 80,
        }),
    prisma.comment.findMany({
      where: {
        tenantId: params.tenantId,
        entityType: 'account',
        entityId: { in: accountIds },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(80, perSource),
    }),
    prisma.deal.findMany({
      where: { tenantId: params.tenantId, contact: cWhere },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      include: { contact: { select: { id: true, name: true } } },
    }),
    prisma.quote.findMany({
      where: {
        tenantId: params.tenantId,
        deal: { contact: cWhere },
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: { deal: { select: { id: true, name: true } } },
    }),
    prisma.proposal.findMany({
      where: { tenantId: params.tenantId, contact: cWhere },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
  ])

  const dealIdsForAccount = deals.map((d) => d.id)
  const emailSendOrClause: Array<
    | { accountId: { in: string[] } }
    | { contactId: { in: string[] } }
    | { dealId: { in: string[] } }
  > = [{ accountId: { in: accountIds } }]
  if (contactIds.length > 0) {
    emailSendOrClause.push({ contactId: { in: contactIds } })
  }
  if (dealIdsForAccount.length > 0) {
    emailSendOrClause.push({ dealId: { in: dealIdsForAccount } })
  }

  const callRecOr: Array<{ call: { contactId?: { in: string[] }; dealId?: { in: string[] } } }> = []
  if (contactIds.length > 0) {
    callRecOr.push({ call: { contactId: { in: contactIds } } })
  }
  if (dealIdsForAccount.length > 0) {
    callRecOr.push({ call: { dealId: { in: dealIdsForAccount } } })
  }

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

  const voiceAgentOr: Array<{ customerId: { in: string[] } } | { phone: { in: string[] } } | { from: { in: string[] } } | { to: { in: string[] } }> = []
  if (contactIds.length > 0) {
    voiceAgentOr.push({ customerId: { in: contactIds } })
  }
  if (contactPhones.length > 0) {
    voiceAgentOr.push({ phone: { in: contactPhones } }, { from: { in: contactPhones } }, { to: { in: contactPhones } })
  }

  const [
    emailJobsForAccount,
    emailTrackForAccount,
    callRecordingsForAccount,
    voiceAgentCallsForAccount,
    whatsappMessagesForAccount,
    smsDeliveryReportsForAccount,
  ] = await Promise.all([
      prisma.emailSendJob.findMany({
        where: { tenantId: params.tenantId, OR: emailSendOrClause },
        orderBy: { createdAt: 'desc' },
        take: perSource,
        select: emailJobSelect,
      }),
      contactIds.length === 0
        ? Promise.resolve([])
        : prisma.emailTrackingEvent.findMany({
            where: { tenantId: params.tenantId, contactId: { in: contactIds } },
            orderBy: { occurredAt: 'desc' },
            take: Math.min(80, perSource),
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
          }),
      callRecOr.length === 0
        ? Promise.resolve([])
        : prisma.callRecording.findMany({
            where: { tenantId: params.tenantId, OR: callRecOr },
            orderBy: { createdAt: 'desc' },
            take: perSource,
            select: callRecordingSelect,
          }),
      voiceAgentOr.length === 0
        ? Promise.resolve([])
        : prisma.voiceAgentCall.findMany({
            where: {
              tenantId: params.tenantId,
              OR: voiceAgentOr,
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
      contactIds.length === 0
        ? Promise.resolve([])
        : prisma.whatsappMessage.findMany({
            where: {
              conversation: {
                contactId: { in: contactIds },
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
              conversation: { select: { contactId: true } },
            },
          }),
      contactIds.length === 0
        ? Promise.resolve([])
        : prisma.sMSDeliveryReport.findMany({
            where: { tenantId: params.tenantId, contactId: { in: contactIds } },
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

  const rows: AccountTimelineActivityRow[] = []

  for (const i of interactions) {
    const cn = i.contact?.name ?? null
    const ch = interactionChannel(i.type)
    const cid = i.contact?.id ?? i.contactId
    rows.push({
      id: `int-${i.id}`,
      type: ch,
      title: interactionTitle(i, cn),
      description: i.notes ?? i.outcome ?? null,
      createdAt: i.createdAt.toISOString(),
      href:
        ch === 'email'
          ? hrefForEmailTimelineDetail(params.tenantId, {
              campaignId: i.campaignId,
              contactId: cid,
              emailSendJobId: i.emailSendJobId,
            })
          : null,
      metadata: {
        source: 'interaction',
        interactionId: i.id,
        campaignId: i.campaignId,
        contactId: cid,
        contactName: cn,
        emailSendJobId: i.emailSendJobId,
      },
    })
  }

  for (const t of tasks) {
    const cn = t.contact?.name ?? null
    rows.push({
      id: `task-${t.id}`,
      type: 'task',
      title: cn ? `${cn}: ${t.title}` : t.title,
      description: t.description,
      createdAt: (t.completedAt || t.createdAt || t.dueDate || new Date()).toISOString(),
      metadata: { source: 'task', taskId: t.id, contactId: t.contact?.id ?? t.contactId },
    })
  }

  const contactById = new Map(contacts.map((c) => [c.id, c]))
  const contactNameByPhone = new Map(
    contacts
      .map((c) => [c.phone?.trim(), c.name] as const)
      .filter((x): x is [string, string] => Boolean(x[0]) && Boolean(x[1]))
  )

  for (const j of emailJobsForAccount) {
    const cn = j.contactId ? contactById.get(j.contactId)?.name ?? null : null
    const baseTitle = titleForEmailSendJob(j.subject, j.status)
    const ts = j.sentAt ?? j.createdAt
    rows.push({
      id: `email-job:${j.id}`,
      type: 'email',
      title: cn ? `${cn}: ${baseTitle}` : baseTitle,
      description: descriptionLineForEmailSendJob(j),
      createdAt: ts.toISOString(),
      href: hrefForEmailTimelineDetail(params.tenantId, {
        campaignId: j.campaignId,
        dealId: j.dealId,
        contactId: j.contactId,
        emailSendJobId: j.campaignId ? j.id : undefined,
      }),
      metadata: {
        source: 'email_send_job',
        emailSendJobId: j.id,
        status: j.status,
        campaignId: j.campaignId,
        dealId: j.dealId,
        contactId: j.contactId,
        accountId: j.accountId,
        trackingId: j.trackingId,
        eventType: j.eventType,
      },
    })
  }

  for (const ev of emailTrackForAccount) {
    const cn = ev.contactId ? contactById.get(ev.contactId)?.name ?? null : null
    const baseTitle = titleForEmailTrackingEvent(ev.eventType)
    rows.push({
      id: `email-track:${ev.id}`,
      type: 'email',
      title: cn ? `${cn}: ${baseTitle}` : baseTitle,
      description: descriptionLineForEmailTrackingEvent(ev.eventType, ev.eventData, {
        ipAddress: ev.ipAddress,
        referer: ev.referer,
        userAgent: ev.userAgent,
        messageId: ev.messageId,
      }),
      createdAt: ev.occurredAt.toISOString(),
      href: hrefForEmailTimelineDetail(params.tenantId, {
        campaignId: ev.campaignId,
        contactId: ev.contactId,
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

  for (const w of whatsappMessagesForAccount) {
    const cn = contactById.get(w.conversation.contactId)?.name ?? null
    const ts = w.sentAt || w.deliveredAt || w.readAt || w.createdAt
    const baseTitle = w.direction === 'inbound' ? 'WhatsApp received' : 'WhatsApp sent'
    rows.push({
      id: `wa:${w.id}`,
      type: 'whatsapp',
      title: cn ? `${cn}: ${baseTitle}` : baseTitle,
      description: w.text || w.mediaCaption || w.messageType || undefined,
      createdAt: ts.toISOString(),
      href:
        hrefForWhatsappTimelineDetail(w.conversationId, w.mediaUrl) ||
        `/crm/${params.tenantId}/Contacts/${w.conversation.contactId}`,
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
        contactId: w.conversation.contactId,
      },
    })
  }

  for (const s of smsDeliveryReportsForAccount) {
    const cn = s.contactId ? contactById.get(s.contactId)?.name ?? null : null
    const ts = s.sentAt ?? s.deliveredAt ?? s.failedAt ?? s.createdAt
    const baseTitle = titleForSmsDeliveryReport(s.status)
    const raw = s.message?.trim()
    const preview =
      raw && raw.length > 160 ? `${raw.slice(0, 157)}…` : raw || undefined
    rows.push({
      id: `sms:${s.id}`,
      type: 'sms',
      title: cn ? `${cn}: ${baseTitle}` : baseTitle,
      description: preview || `${s.phoneNumber} · ${s.status}`,
      createdAt: ts.toISOString(),
      href:
        hrefForSmsDeliveryTimelineDetail(params.tenantId, {
          campaignId: s.campaignId,
          contactId: s.contactId ?? undefined,
          smsDeliveryReportId: s.campaignId ? s.id : undefined,
        }) || (s.contactId ? `/crm/${params.tenantId}/Contacts/${encodeURIComponent(s.contactId)}` : null),
      metadata: {
        source: 'sms_delivery_report',
        smsDeliveryReportId: s.id,
        campaignId: s.campaignId,
        contactId: s.contactId,
        phoneNumber: s.phoneNumber,
        status: s.status,
        messageId: s.messageId,
      },
    })
  }

  for (const r of callRecordingsForAccount) {
    const call = r.call
    const cn = call.contactId ? contactById.get(call.contactId)?.name ?? null : null
    const baseTitle = `Recording · ${call.phoneNumber}`
    rows.push({
      id: `call-rec:${r.id}`,
      type: 'call',
      title: cn ? `${cn}: ${baseTitle}` : baseTitle,
      description: `${call.direction} · ${call.status}${r.duration != null ? ` · ${r.duration}s` : ''}`,
      createdAt: r.createdAt.toISOString(),
      href: hrefForCallRecordingTimeline(params.tenantId, {
        recordingUrl: r.recordingUrl,
        contactId: call.contactId,
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

  for (const v of voiceAgentCallsForAccount) {
    const recUrl = resolveVoiceAgentRecordingUrl({
      recordingUrl: v.recordingUrl,
      metadata: v.metadata,
    })
    if (!recUrl) continue
    const cn =
      (v.customerId ? contactById.get(v.customerId)?.name ?? null : null) ||
      (v.phone ? contactNameByPhone.get(v.phone.trim()) ?? null : null) ||
      (v.from ? contactNameByPhone.get(v.from.trim()) ?? null : null) ||
      (v.to ? contactNameByPhone.get(v.to.trim()) ?? null : null)
    const label = v.phone || v.from || v.to || 'Voice agent'
    const baseTitle = `Voice recording · ${label}`
    const dur = v.durationSeconds ?? v.metadata?.recordingDuration ?? null
    const descParts = [
      v.status,
      v.inbound ? 'Inbound' : 'Outbound',
      dur != null ? `${dur}s` : null,
    ].filter(Boolean)
    rows.push({
      id: `voice-agent:${v.id}`,
      type: 'call',
      title: cn ? `${cn}: ${baseTitle}` : baseTitle,
      description: descParts.join(' · ') || undefined,
      createdAt: (v.endTime || v.startTime || v.createdAt).toISOString(),
      href: hrefForCallRecordingTimeline(params.tenantId, {
        recordingUrl: recUrl,
        contactId: v.customerId ?? undefined,
        dealId: undefined,
      }),
      metadata: {
        source: 'voice_agent_call',
        voiceAgentCallId: v.id,
        recordingUrl: recUrl,
        contactId: v.customerId,
        phone: v.phone,
        from: v.from,
        to: v.to,
        status: v.status,
        inbound: v.inbound,
        durationSeconds: v.durationSeconds ?? v.metadata?.recordingDuration ?? null,
      },
    })
  }

  for (const c of contactComments) {
    rows.push({
      id: `ccomment-${c.id}`,
      type: 'comment',
      title: `${contactById.get(c.entityId)?.name ?? 'Contact'} comment`,
      description: c.content,
      createdAt: c.createdAt.toISOString(),
      metadata: {
        source: 'comment',
        scope: 'contact',
        commentId: c.id,
        contactId: c.entityId,
      },
    })
  }

  for (const c of accountComments) {
    const an =
      accountNameById.get(c.entityId || '') ||
      (c.entityId === account.id ? account.name : null) ||
      'Account'
    rows.push({
      id: `acct-comment-${c.id}`,
      type: 'comment',
      title: `${an}: comment`,
      description: c.content,
      createdAt: c.createdAt.toISOString(),
      metadata: {
        source: 'comment',
        scope: 'account',
        commentId: c.id,
        accountEntityId: c.entityId,
      },
    })
  }

  for (const d of deals) {
    const cn = d.contact?.name ?? null
    rows.push({
      id: `deal-${d.id}`,
      type: 'deal',
      title: cn ? `${cn}: Deal ${d.name}` : `Deal: ${d.name}`,
      description: `₹${d.value?.toLocaleString?.('en-IN') ?? d.value} · ${d.stage}`,
      createdAt: d.createdAt.toISOString(),
      metadata: {
        source: 'deal',
        dealId: d.id,
        contactId: d.contact?.id ?? d.contactId,
      },
    })
  }

  for (const q of quotes) {
    rows.push({
      id: `quote-${q.id}`,
      type: 'quote',
      title: `Quote ${q.quoteNumber} · ${q.deal?.name ?? 'Deal'}`,
      description: q.status ? `Status: ${q.status}` : undefined,
      createdAt: q.createdAt.toISOString(),
      metadata: {
        source: 'quote',
        quoteId: q.id,
        dealId: q.dealId,
        status: q.status,
      },
    })
  }

  for (const p of proposals) {
    const ts = p.sentAt || p.createdAt
    rows.push({
      id: `proposal-${p.id}`,
      type: 'proposal',
      title: `Proposal · ${p.title}`,
      description: p.status ? `Status: ${p.status}` : undefined,
      createdAt: ts.toISOString(),
      metadata: { source: 'proposal', proposalId: p.id, contactId: p.contactId },
    })
  }

  for (const c of contacts) {
    const notes = c.notes?.trim()
    if (notes) {
      rows.push({
        id: `contact-notes:${c.id}`,
        type: 'note',
        title: `${c.name}: notes`,
        description: notes,
        createdAt: c.updatedAt.toISOString(),
        metadata: { source: 'contact_notes', contactId: c.id },
      })
    }
  }

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return { activities: rows.slice(0, maxOut) }
}
