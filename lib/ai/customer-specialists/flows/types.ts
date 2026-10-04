import type { CustomerEntitlementDecision } from '../types'

export type CustomerFlowDraftStatus = 'draft'
export type CustomerFlowApprovalStatus =
  | 'not_required'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'denied'

export type CustomerFlowSlug = 'sales-follow-up' | 'gst-invoice-draft'

export interface CustomerFlowAuth {
  tenantId: string
  userId: string
  roles: string[]
  licensedModules: string[]
}

export interface CustomerFlowStepResult {
  agentSlug: string
  decision: CustomerEntitlementDecision
  draftType?: string
  draft?: Record<string, unknown>
}

export interface CustomerFlowDraftBundle {
  draftId: string
  flow: CustomerFlowSlug
  status: CustomerFlowDraftStatus
  approvalStatus: CustomerFlowApprovalStatus
  executable: false
  createdAt: string
  steps: CustomerFlowStepResult[]
  draft: Record<string, unknown>
  approvedBy?: string | null
  approvedAt?: string | null
  rejectedBy?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
}

export interface CustomerFlowResult {
  allowed: boolean
  reasonCode: string
  reason: string
  sessionId: string
  auditIds: string[]
  bundle: CustomerFlowDraftBundle | null
  attempt?: number
  maxAttempts?: number
  escalated?: boolean
}
