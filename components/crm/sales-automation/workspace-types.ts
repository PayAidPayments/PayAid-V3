/** Shared JSON shape for GET /api/crm/sales-automation/workspace (client + server). */

/** Real counts for sequence / automation tables when provided by the workspace API. */
export type AutomationOperationStats = {
  activeInSeq: number
  paused: number
  completed: number
  /** Opens (broadcast) or contacts with step progress (nurture proxy). */
  replied: number
  bounced: number
  unsubscribed: number
}

export type OutreachCampaignShape = {
  id: string
  name: string
  type: 'cold-email' | 'cold-call' | 'linkedin' | 'multi-channel'
  status: 'draft' | 'active' | 'paused' | 'completed'
  prospectsCount: number
  contactedCount: number
  responseRate: number
  conversionRate: number
  createdAt: string
  /** When set, UI uses these instead of heuristic estimates. */
  operationStats?: AutomationOperationStats
}

export type AIProspectShape = {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: 'pending' | 'contacted' | 'qualified' | 'converted' | 'rejected'
  intentScore: number
  lastContacted?: string
  nextFollowUp?: string
  contactCount: number
  source: string
}

export type WorkflowRowShape = {
  id: string
  name: string
  trigger: string
  conditions: string
  actions: string
  delays: string
  status: 'active' | 'paused' | 'draft'
  owner: string
  lastRun: string
  failures7d: number
}

export type SignalRowShape = {
  id: string
  label: string
  company: string
  severity: 'hot' | 'warm'
  suggested: string
}

export type ExecutionLogRowShape = {
  id: string
  at: string
  prospect: string
  automation: string
  action: string
  channel: string
  status: 'ok' | 'retry' | 'failed' | 'pending_approval'
  next: string
  error?: string
  approvedBy?: string
}

export type ProspectQueueRowShape = AIProspectShape & {
  queueStatus: string
  enrolledSeq: string
  owner: string
  nextAction: string
}

export type TemplateRowShape = {
  id: string
  channel: string
  name: string
  status: 'approved' | 'pending' | 'draft'
  usage: number
  replyPct: number
  owner: string
}

export type WorkspacePayload = {
  meta: {
    generatedAt: string
    /** KPI filter window (days), from request. */
    dateRange: string
    /** Execution log rows + `executionLog.total` are scoped to this many days. */
    executionLogWindowDays: number
  }
  kpis: {
    activeAutomations: number
    leadsEnrolled: number
    leadsEnrolledInPeriod: number
    replyRate: number
    meetingsBooked: number
    conversionRate: number
    failedActions: number
    pendingReviews: number
    autoTasksCreated: number
  }
  automations: OutreachCampaignShape[]
  workflows: WorkflowRowShape[]
  signals: SignalRowShape[]
  executionLog: { rows: ExecutionLogRowShape[]; total: number }
  prospectQueue: { rows: ProspectQueueRowShape[]; total: number }
  templates: TemplateRowShape[]
  deliverability: { bounceCount7d: number; sentBaseline7d: number; bounceRatePct: number | null }
}
