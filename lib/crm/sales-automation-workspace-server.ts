/**
 * Server-only helpers for GET /api/crm/sales-automation/workspace.
 * Aggregates tenant-scoped CRM/marketing automation data from Prisma.
 */

import type { PrismaClient } from '@prisma/client'
import { startOfDay, subDays } from 'date-fns'
import type {
  AIProspectShape,
  ExecutionLogRowShape,
  OutreachCampaignShape,
  ProspectQueueRowShape,
  SignalRowShape,
  TemplateRowShape,
  WorkflowRowShape,
  WorkspacePayload,
} from '@/components/crm/sales-automation/workspace-types'

export type {
  AIProspectShape,
  ExecutionLogRowShape,
  OutreachCampaignShape,
  ProspectQueueRowShape,
  SignalRowShape,
  TemplateRowShape,
  WorkflowRowShape,
  WorkspacePayload,
} from '@/components/crm/sales-automation/workspace-types'

function mapStepChannelToType(channel: string | null | undefined): OutreachCampaignShape['type'] {
  const c = (channel || 'email').toLowerCase()
  if (c === 'whatsapp') return 'multi-channel'
  if (c === 'sms') return 'multi-channel'
  if (c === 'linkedin') return 'linkedin'
  if (c === 'call' || c === 'phone') return 'cold-call'
  return 'cold-email'
}

function nurtureStatusFromEnrollments(
  counts: { active: number; completed: number; paused: number; cancelled: number; total: number }
): OutreachCampaignShape['status'] {
  if (counts.active > 0) return 'active'
  if (counts.total === 0) return 'draft'
  if (counts.completed >= counts.total && counts.completed > 0) return 'completed'
  if (counts.cancelled > 0 && counts.active === 0) return 'paused'
  if (counts.paused > 0 || counts.completed > 0) return 'paused'
  return 'draft'
}

function marketingStatus(s: string): OutreachCampaignShape['status'] {
  const u = (s || '').toLowerCase()
  if (u === 'draft') return 'draft'
  if (u === 'paused' || u === 'cancelled') return 'paused'
  if (u === 'completed' || u === 'archived') return 'completed'
  return 'active'
}

function mapOutreachAutomationType(raw: string): OutreachCampaignShape['type'] {
  const t = (raw || '').toLowerCase()
  if (t === 'cold-call') return 'cold-call'
  if (t === 'linkedin') return 'linkedin'
  if (t === 'multi-channel') return 'multi-channel'
  return 'cold-email'
}

function mapOutreachAutomationStatus(raw: string): OutreachCampaignShape['status'] {
  const s = (raw || '').toLowerCase()
  if (s === 'paused' || s === 'cancelled') return 'paused'
  if (s === 'completed' || s === 'archived') return 'completed'
  if (s === 'active') return 'active'
  return 'draft'
}

/** Normalize nurture enrollment status for counting (DB may vary in casing). */
function enrollmentBucket(s: string | undefined): 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED' | 'OTHER' {
  const u = String(s || '').toUpperCase()
  if (u === 'ACTIVE' || u === 'IN_PROGRESS') return 'ACTIVE'
  if (u === 'COMPLETED') return 'COMPLETED'
  if (u === 'PAUSED') return 'PAUSED'
  if (u === 'CANCELLED') return 'CANCELLED'
  return 'OTHER'
}

/**
 * Map ScheduledEmail row to execution log status.
 * Known lifecycle: PENDING → SENT | FAILED (see `lib/marketing/nurture-sequences.ts`).
 */
function mapScheduledEmailExecution(e: {
  status: string
  sentAt: Date | null
  retryCount: number
  scheduledAt: Date
}): { logStatus: ExecutionLogRowShape['status']; next: string; error?: string } {
  const st = String(e.status || '').toUpperCase()
  if (st === 'FAILED' || st === 'BOUNCED' || st === 'CANCELLED') {
    return { logStatus: 'failed', next: 'Manual review', error: `Send status: ${e.status}` }
  }
  if (st === 'SENT' || e.sentAt) {
    return { logStatus: 'ok', next: 'Continue sequence' }
  }
  if (st === 'PENDING') {
    if (e.retryCount > 0) {
      return { logStatus: 'retry', next: `Retry · scheduled ${e.scheduledAt.toISOString()}` }
    }
    return { logStatus: 'ok', next: `Queued · send after ${e.scheduledAt.toISOString()}` }
  }
  return { logStatus: 'ok', next: 'Review row' }
}

export async function buildSalesAutomationWorkspace(
  prisma: PrismaClient,
  tenantId: string,
  opts: {
    dateRangeDays: number
    queueSkip: number
    queueTake: number
    logSkip: number
    logTake: number
    search: string
    channelFilter: string
    statusFilter: string
  }
): Promise<WorkspacePayload> {
  const now = new Date()
  const periodStart = subDays(now, opts.dateRangeDays)
  const dayStart = startOfDay(now)
  const bounceWindow = subDays(now, 7)
  /** Align list fetch, merge, and `total` so pagination is honest (not full table history). */
  const EXECUTION_LOG_WINDOW_DAYS = 90
  const executionLogSince = subDays(now, EXECUTION_LOG_WINDOW_DAYS)

  const search = opts.search.trim().toLowerCase()

  const scheduledEmailInExecutionLogWhere = {
    tenantId,
    OR: [
      { updatedAt: { gte: executionLogSince } },
      { sentAt: { gte: executionLogSince } },
      { scheduledAt: { gte: executionLogSince } },
    ],
  }

  const workflowExecutionInLogWhere = {
    tenantId,
    startedAt: { gte: executionLogSince },
  }

  const [
    workflowsActive,
    nurtureTemplates,
    marketingCampaigns,
    enrollToday,
    enrollInPeriod,
    meetingsInPeriod,
    tasksToday,
    scheduledFailed7d,
    wfFailed7d,
    bounce7d,
    aiPending,
    contactsReview,
    campaignsInPeriod,
    enrollmentsForConversion,
    activeEnrollByTemplate,
    workflowsList,
    wfExecutionsRecent,
    scheduledEmails,
    contactsQueue,
    contactsQueueTotal,
    emailTemplates,
    waTemplates,
    webEvents,
    scoreContacts,
    outreachAutomationRows,
    executionScheduledTotal,
    executionWorkflowTotal,
  ] = await Promise.all([
    prisma.workflow.count({ where: { tenantId, isActive: true } }),
    prisma.nurtureTemplate.findMany({
      where: {
        tenantId,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: {
        steps: { orderBy: { order: 'asc' }, take: 5 },
        enrollments: { select: { id: true, status: true, completedSteps: true, totalSteps: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 80,
    }),
    prisma.campaign.findMany({
      where: {
        tenantId,
        createdAt: { gte: periodStart },
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 40,
    }),
    prisma.nurtureEnrollment.count({
      where: { tenantId, enrolledAt: { gte: dayStart } },
    }),
    prisma.nurtureEnrollment.count({
      where: { tenantId, enrolledAt: { gte: periodStart } },
    }),
    prisma.meeting.count({
      where: {
        tenantId,
        startTime: { gte: periodStart },
        status: { notIn: ['cancelled', 'CANCELLED'] },
      },
    }),
    prisma.task.count({
      where: { tenantId, module: 'crm', createdAt: { gte: dayStart } },
    }),
    prisma.scheduledEmail.count({
      where: {
        tenantId,
        status: 'FAILED',
        updatedAt: { gte: bounceWindow },
      },
    }),
    prisma.workflowExecution.count({
      where: {
        tenantId,
        status: 'FAILED',
        startedAt: { gte: bounceWindow },
      },
    }),
    prisma.emailBounce.count({
      where: { tenantId, createdAt: { gte: bounceWindow } },
    }),
    prisma.aIDecision.count({
      where: {
        tenantId,
        status: 'pending',
        approvalLevel: { not: 'AUTO_EXECUTE' },
      },
    }),
    prisma.contact.count({
      where: {
        tenantId,
        stage: 'prospect',
        leadScore: { gte: 70 },
      },
    }),
    prisma.campaign.findMany({
      where: { tenantId, sent: { gt: 0 }, updatedAt: { gte: periodStart } },
      select: { opened: true, clicked: true, sent: true, bounced: true },
    }),
    prisma.nurtureEnrollment.findMany({
      where: { tenantId, enrolledAt: { gte: periodStart } },
      select: { status: true },
    }),
    prisma.nurtureEnrollment.groupBy({
      by: ['templateId'],
      where: { tenantId, status: { in: ['ACTIVE', 'active'] } },
      _count: { templateId: true },
    }),
    prisma.workflow.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      take: 24,
      include: {
        executions: { orderBy: { startedAt: 'desc' }, take: 1 },
      },
    }),
    prisma.workflowExecution.findMany({
      where: workflowExecutionInLogWhere,
      orderBy: { startedAt: 'desc' },
      take: Math.min(500, Math.max(80, (opts.logSkip + opts.logTake) * 4)),
      include: { workflow: { select: { id: true, name: true } } },
    }),
    prisma.scheduledEmail.findMany({
      where: scheduledEmailInExecutionLogWhere,
      orderBy: { updatedAt: 'desc' },
      take: Math.min(500, Math.max(120, (opts.logSkip + opts.logTake) * 4)),
      include: {
        contact: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.contact.findMany({
      where: {
        tenantId,
        stage: 'prospect',
        leadScore: { gte: 40 },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ leadScore: 'desc' }, { createdAt: 'desc' }],
      skip: opts.queueSkip,
      take: opts.queueTake,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        source: true,
        leadScore: true,
        lastContactedAt: true,
        nextFollowUp: true,
        createdAt: true,
        assignedToId: true,
        assignedTo: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.contact.count({
      where: {
        tenantId,
        stage: 'prospect',
        leadScore: { gte: 40 },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    }),
    prisma.emailTemplate.findMany({
      where: { tenantId, isActive: true },
      orderBy: { timesUsed: 'desc' },
      take: 20,
      select: { id: true, name: true, timesUsed: true, category: true, isActive: true },
    }),
    prisma.crmWhatsappTemplate.findMany({
      where: { tenantId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: { id: true, name: true },
    }),
    prisma.websiteEvent.findMany({
      where: {
        tenantId,
        occurredAt: { gte: subDays(now, 3) },
        OR: [
          { eventName: { contains: 'pricing', mode: 'insensitive' } },
          { eventType: { contains: 'click', mode: 'insensitive' } },
        ],
      },
      orderBy: { occurredAt: 'desc' },
      take: 6,
      select: { id: true, eventName: true, eventType: true, occurredAt: true, metadata: true },
    }),
    prisma.contact.findMany({
      where: {
        tenantId,
        scoreUpdatedAt: { gte: subDays(now, 2) },
        leadScore: { gte: 20 },
      },
      orderBy: { leadScore: 'desc' },
      take: 5,
      select: { id: true, name: true, company: true, leadScore: true, source: true },
    }),
    prisma.outreachAutomation.findMany({
      where: {
        tenantId,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 40,
    }),
    prisma.scheduledEmail.count({ where: scheduledEmailInExecutionLogWhere }),
    prisma.workflowExecution.count({ where: workflowExecutionInLogWhere }),
  ])

  const nurtureAutomations: OutreachCampaignShape[] = nurtureTemplates.map((t) => {
    const en = t.enrollments
    const counts = {
      active: en.filter((e) => enrollmentBucket(e.status) === 'ACTIVE').length,
      completed: en.filter((e) => enrollmentBucket(e.status) === 'COMPLETED').length,
      paused: en.filter((e) => enrollmentBucket(e.status) === 'PAUSED').length,
      cancelled: en.filter((e) => enrollmentBucket(e.status) === 'CANCELLED').length,
      total: en.length,
    }
    const firstCh = t.steps[0]?.channel
    const type = mapStepChannelToType(firstCh)
    const status = nurtureStatusFromEnrollments(counts)
    const contacted = en.reduce((s, e) => s + (e.completedSteps > 0 ? 1 : 0), 0)
    const completedRatio = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0
    return {
      id: `nurture:${t.id}`,
      name: t.name,
      type,
      status,
      prospectsCount: counts.total,
      contactedCount: contacted,
      responseRate: counts.total > 0 ? Math.min(100, (contacted / counts.total) * 22 + completedRatio * 0.15) : 0,
      conversionRate: completedRatio,
      createdAt: t.createdAt.toISOString(),
      operationStats: {
        activeInSeq: counts.active,
        paused: counts.paused + counts.cancelled,
        completed: counts.completed,
        replied: contacted,
        bounced: 0,
        unsubscribed: 0,
      },
    }
  })

  const broadcastAutomations: OutreachCampaignShape[] = marketingCampaigns.map((c) => {
    const sent = Math.max(1, c.sent)
    const reply = (c.opened / sent) * 100
    const conv = (c.clicked / sent) * 100
    const st = marketingStatus(c.status)
    const recipients = Math.max(c.recipientCount, c.sent, 0)
    const queued = Math.max(0, recipients - (c.sent || 0))
    return {
      id: `campaign:${c.id}`,
      name: c.name,
      type: (c.type || '').toLowerCase().includes('sms')
        ? 'multi-channel'
        : (c.type || '').toLowerCase().includes('linkedin')
          ? 'linkedin'
          : 'cold-email',
      status: st,
      prospectsCount: Math.max(c.recipientCount, c.sent),
      contactedCount: c.sent,
      responseRate: Math.round(reply * 10) / 10,
      conversionRate: Math.round(conv * 10) / 10,
      createdAt: c.createdAt.toISOString(),
      operationStats: {
        activeInSeq: st === 'active' ? queued : 0,
        paused: st === 'paused' ? Math.max(queued, recipients > 0 ? 1 : 0) : 0,
        completed: st === 'completed' ? recipients : c.delivered || c.sent,
        replied: c.opened,
        bounced: c.bounced,
        unsubscribed: c.unsubscribed,
      },
    }
  })

  const outreachAutomations: OutreachCampaignShape[] = outreachAutomationRows.map((o) => {
    const prospects = Math.max(0, o.prospectsCount)
    const contacted = Math.max(0, o.contactedCount)
    const rr = prospects > 0 ? Math.min(100, (contacted / prospects) * 100) : 0
    const st = mapOutreachAutomationStatus(o.status)
    const type = mapOutreachAutomationType(o.type)
    return {
      id: `outreach:${o.id}`,
      name: o.name,
      type,
      status: st,
      prospectsCount: prospects,
      contactedCount: contacted,
      responseRate: Math.round(rr * 10) / 10,
      conversionRate: 0,
      createdAt: o.createdAt.toISOString(),
      operationStats: {
        activeInSeq: st === 'active' ? Math.max(0, prospects - contacted) : 0,
        paused: st === 'paused' ? prospects || contacted || 1 : 0,
        completed: st === 'completed' ? Math.max(contacted, prospects) : 0,
        replied: contacted,
        bounced: 0,
        unsubscribed: 0,
      },
    }
  })

  let automations = [...nurtureAutomations, ...broadcastAutomations, ...outreachAutomations]

  if (opts.channelFilter !== 'all') {
    automations = automations.filter((a) => a.type === opts.channelFilter)
  }
  if (opts.statusFilter !== 'all') {
    automations = automations.filter((a) => a.status === opts.statusFilter)
  }

  const replyNumer = campaignsInPeriod.reduce((s, c) => s + (c.opened || 0), 0)
  const replyDenom = campaignsInPeriod.reduce((s, c) => s + (c.sent || 0), 0)
  const replyRate = replyDenom > 0 ? (replyNumer / replyDenom) * 100 : 0

  const convCompleted = enrollmentsForConversion.filter((e) =>
    ['COMPLETED', 'completed'].includes(String(e.status || ''))
  ).length
  const conversionRate =
    enrollmentsForConversion.length > 0 ? (convCompleted / enrollmentsForConversion.length) * 100 : 0

  const failedActions = scheduledFailed7d + wfFailed7d + bounce7d
  const pendingReviews = aiPending + contactsReview

  const activeNurturePrograms = activeEnrollByTemplate.length
  const activeAutomations = workflowsActive + activeNurturePrograms

  const sentBaseline7d = campaignsInPeriod.reduce((s, c) => s + (c.sent || 0), 0) || 1
  const bounceRatePct = sentBaseline7d > 0 ? (bounce7d / sentBaseline7d) * 100 : null

  const templateIdSet = new Set(
    scheduledEmails.map((e) => e.templateId).filter((x): x is string => Boolean(x))
  )
  const nurtureMeta = await prisma.nurtureTemplate.findMany({
    where: { id: { in: [...templateIdSet] } },
    select: { id: true, name: true },
  })
  const tplName = new Map(nurtureMeta.map((x) => [x.id, x.name]))

  const execFromScheduled: ExecutionLogRowShape[] = scheduledEmails.map((e) => {
    const sent = Boolean(e.sentAt)
    const mapped = mapScheduledEmailExecution({
      status: e.status,
      sentAt: e.sentAt,
      retryCount: e.retryCount,
      scheduledAt: e.scheduledAt,
    })
    const autoName = e.templateId ? tplName.get(e.templateId) || 'Nurture sequence' : 'Scheduled message'
    return {
      id: `se:${e.id}`,
      at: (e.sentAt || e.updatedAt).toISOString(),
      prospect: e.contact?.name || '—',
      automation: autoName,
      action: sent ? `Send ${e.channel || 'email'}` : `Queue ${e.channel || 'email'}`,
      channel: (e.channel || 'email').replace(/^./, (m) => m.toUpperCase()),
      status: mapped.logStatus,
      next: mapped.next,
      error: mapped.error,
    }
  })

  const execFromWf: ExecutionLogRowShape[] = wfExecutionsRecent.map((ex) => {
    const st = String(ex.status || '').toUpperCase()
    const failed = st === 'FAILED'
    return {
      id: `wf:${ex.id}`,
      at: ex.startedAt.toISOString(),
      prospect: '—',
      automation: ex.workflow?.name || 'Workflow',
      action: `Run workflow (${st})`,
      channel: 'Internal',
      status: failed ? 'failed' : st === 'COMPLETED' ? 'ok' : 'retry',
      next: ex.completedAt ? 'Done' : 'Await completion',
      error: ex.error || undefined,
    }
  })

  const executionMerged = [...execFromScheduled, ...execFromWf]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(opts.logSkip, opts.logSkip + opts.logTake)

  const workflowRows: WorkflowRowShape[] = workflowsList.map((w) => {
    const last = w.executions[0]
    const steps = Array.isArray(w.steps) ? (w.steps as unknown[]) : []
    const firstStep = steps[0] as { action?: string; type?: string } | undefined
    const actionsPreview =
      typeof firstStep?.action === 'string'
        ? firstStep.action
        : typeof firstStep?.type === 'string'
          ? firstStep.type
          : JSON.stringify(w.steps).slice(0, 120)
    const fails = wfExecutionsRecent.filter((ex) => ex.workflowId === w.id && String(ex.status || '').toUpperCase() === 'FAILED')
      .length
    return {
      id: w.id,
      name: w.name,
      trigger: `${w.triggerType}${w.triggerEvent ? ` · ${w.triggerEvent}` : ''}`,
      conditions: w.description || 'See step JSON in builder',
      actions: actionsPreview || 'Multi-step',
      delays: w.triggerSchedule || 'Event-driven',
      status: w.isActive ? 'active' : 'paused',
      owner: 'RevOps',
      lastRun: last?.startedAt?.toISOString() || '',
      failures7d: fails,
    }
  })

  const signals: SignalRowShape[] = [
    ...scoreContacts.map((c) => ({
      id: `sig-score-${c.id}`,
      label: `Lead score ${Math.round(c.leadScore)} · recent update`,
      company: c.company || 'Unknown',
      severity: (c.leadScore >= 75 ? 'hot' : 'warm') as SignalRowShape['severity'],
      suggested: 'Assign owner · enroll strongest sequence',
    })),
    ...webEvents.map((ev) => ({
      id: `sig-web-${ev.id}`,
      label: `${ev.eventType}: ${ev.eventName}`,
      company: 'Website visitor',
      severity: 'warm' as SignalRowShape['severity'],
      suggested: 'Match to contact · enroll capture sequence',
    })),
  ].slice(0, 12)

  const prospectsMapped: AIProspectShape[] = contactsQueue.map((c) => {
    const status: AIProspectShape['status'] = c.lastContactedAt
      ? 'contacted'
      : c.leadScore >= 70
        ? 'qualified'
        : 'pending'
    return {
      id: c.id,
      name: c.name,
      email: c.email || '',
      phone: c.phone || undefined,
      company: c.company || undefined,
      status,
      intentScore: Math.round(c.leadScore || 0),
      lastContacted: c.lastContactedAt?.toISOString(),
      nextFollowUp: c.nextFollowUp?.toISOString(),
      contactCount: 0,
      source: c.source || 'unknown',
    }
  })

  const firstSeqName = nurtureTemplates[0]?.name ?? '—'
  const queueRows: ProspectQueueRowShape[] = contactsQueue.map((c, idx) => {
    const p = prospectsMapped[idx]!
    return {
      ...p,
      queueStatus:
        p.status === 'qualified'
          ? 'Hot · needs owner'
          : p.status === 'contacted'
            ? 'Enrolled · in sequence'
            : 'Ready to enroll',
      enrolledSeq: p.status === 'contacted' ? firstSeqName : '—',
      owner: c.assignedTo?.user?.name || 'Unassigned',
      nextAction:
        p.intentScore >= 70
          ? 'Assign AE + enroll “Fast lane”'
          : p.status === 'pending'
            ? 'Enroll nurture + verify email'
            : 'Pause email · schedule call',
    }
  })

  const templates: TemplateRowShape[] = [
    ...emailTemplates.map((t) => ({
      id: `emailtpl:${t.id}`,
      channel: 'Email',
      name: t.name,
      status: (t.isActive ? 'approved' : 'draft') as TemplateRowShape['status'],
      usage: t.timesUsed || 0,
      replyPct: 0,
      owner: t.category || 'Marketing',
    })),
    ...waTemplates.map((t) => ({
      id: `watpl:${t.id}`,
      channel: 'WhatsApp',
      name: t.name,
      status: 'approved' as const,
      usage: 0,
      replyPct: 0,
      owner: 'CRM',
    })),
  ]

  return {
    meta: {
      generatedAt: now.toISOString(),
      dateRange: String(opts.dateRangeDays),
      executionLogWindowDays: EXECUTION_LOG_WINDOW_DAYS,
    },
    kpis: {
      activeAutomations,
      leadsEnrolled: enrollToday,
      leadsEnrolledInPeriod: enrollInPeriod,
      replyRate: Math.round(replyRate * 10) / 10,
      meetingsBooked: meetingsInPeriod,
      conversionRate: Math.round(conversionRate * 10) / 10,
      failedActions,
      pendingReviews,
      autoTasksCreated: tasksToday,
    },
    automations,
    workflows: workflowRows,
    signals,
    executionLog: {
      rows: executionMerged,
      total: executionScheduledTotal + executionWorkflowTotal,
    },
    prospectQueue: { rows: queueRows, total: contactsQueueTotal },
    templates,
    deliverability: {
      bounceCount7d: bounce7d,
      sentBaseline7d,
      bounceRatePct: bounceRatePct != null ? Math.round(bounceRatePct * 100) / 100 : null,
    },
  }
}
