import type { Prisma } from '@prisma/client'
import type {
  CustomerFlowApprovalStatus,
  CustomerFlowAuth,
  CustomerFlowDraftBundle,
  CustomerFlowSlug,
} from '../flows/types'

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export interface StoredCustomerFlowDraft {
  auditId: string
  draftId: string
  flow: CustomerFlowSlug
  sessionId: string
  approvalStatus: CustomerFlowApprovalStatus
  createdAt: string
  changedBy: string
  bundle: CustomerFlowDraftBundle
  reason?: string
}

type DraftSnapshot = {
  flow?: CustomerFlowSlug
  sessionId?: string
  draftArtifactId?: string | null
  approvalStatus?: CustomerFlowApprovalStatus
  draft?: Record<string, unknown> | null
  bundle?: CustomerFlowDraftBundle | null
  reason?: string
  allowed?: boolean
  recordedAt?: string
  steps?: CustomerFlowDraftBundle['steps']
}

function snapshotToBundle(snapshot: DraftSnapshot, fallbackDraftId: string): CustomerFlowDraftBundle | null {
  if (snapshot.bundle?.draftId) return snapshot.bundle
  if (!snapshot.flow) return null
  return {
    draftId: snapshot.draftArtifactId || fallbackDraftId,
    flow: snapshot.flow,
    status: 'draft',
    approvalStatus: snapshot.approvalStatus || 'denied',
    executable: false,
    createdAt: snapshot.recordedAt || new Date().toISOString(),
    steps: snapshot.steps || [],
    draft: snapshot.draft || {},
    approvedBy: (snapshot.bundle as CustomerFlowDraftBundle | undefined)?.approvedBy ?? null,
    approvedAt: (snapshot.bundle as CustomerFlowDraftBundle | undefined)?.approvedAt ?? null,
    rejectedBy: (snapshot.bundle as CustomerFlowDraftBundle | undefined)?.rejectedBy ?? null,
    rejectedAt: (snapshot.bundle as CustomerFlowDraftBundle | undefined)?.rejectedAt ?? null,
    rejectionReason: (snapshot.bundle as CustomerFlowDraftBundle | undefined)?.rejectionReason ?? null,
  }
}

export async function listCustomerFlowDrafts(params: {
  tenantId: string
  approvalStatus?: CustomerFlowApprovalStatus | 'pending'
  flow?: CustomerFlowSlug
  limit?: number
}): Promise<StoredCustomerFlowDraft[]> {
  const { prisma } = await import('@/lib/db/prisma')
  const rows = await prisma.auditLog.findMany({
    where: {
      tenantId: params.tenantId,
      entityType: 'customer_specialist_draft',
    },
    orderBy: { timestamp: 'desc' },
    take: Math.min(params.limit ?? 80, 200),
  })

  const latestByDraft = new Map<string, StoredCustomerFlowDraft>()
  for (const row of rows) {
    const snapshot = (row.afterSnapshot || {}) as DraftSnapshot
    const draftId = snapshot.draftArtifactId || snapshot.bundle?.draftId || row.entityId
    if (!draftId || latestByDraft.has(draftId)) continue
    const bundle = snapshotToBundle(snapshot, draftId)
    if (!bundle) continue
    if (params.flow && bundle.flow !== params.flow) continue
    const status = bundle.approvalStatus
    if (params.approvalStatus === 'pending' && status !== 'pending_approval') continue
    if (
      params.approvalStatus &&
      params.approvalStatus !== 'pending' &&
      status !== params.approvalStatus
    ) {
      continue
    }
    latestByDraft.set(draftId, {
      auditId: row.id,
      draftId,
      flow: bundle.flow,
      sessionId: snapshot.sessionId || bundle.draftId,
      approvalStatus: status,
      createdAt: row.timestamp.toISOString(),
      changedBy: row.changedBy,
      bundle,
      reason: snapshot.reason,
    })
  }

  return Array.from(latestByDraft.values())
}

export async function getCustomerFlowDraft(params: {
  tenantId: string
  draftId: string
}): Promise<StoredCustomerFlowDraft | null> {
  const drafts = await listCustomerFlowDrafts({
    tenantId: params.tenantId,
    limit: 200,
  })
  return drafts.find((d) => d.draftId === params.draftId) || null
}

export async function recordCustomerFlowApproval(params: {
  auth: CustomerFlowAuth
  draft: StoredCustomerFlowDraft
  decision: 'approved' | 'rejected'
  rejectionReason?: string
}): Promise<StoredCustomerFlowDraft> {
  const { prisma } = await import('@/lib/db/prisma')
  const now = new Date().toISOString()
  const nextBundle: CustomerFlowDraftBundle = {
    ...params.draft.bundle,
    approvalStatus: params.decision,
    executable: false,
    approvedBy: params.decision === 'approved' ? params.auth.userId : params.draft.bundle.approvedBy ?? null,
    approvedAt: params.decision === 'approved' ? now : params.draft.bundle.approvedAt ?? null,
    rejectedBy: params.decision === 'rejected' ? params.auth.userId : null,
    rejectedAt: params.decision === 'rejected' ? now : null,
    rejectionReason:
      params.decision === 'rejected'
        ? params.rejectionReason?.trim() || 'Rejected by approver'
        : null,
  }

  const snapshot = {
    flow: nextBundle.flow,
    sessionId: params.draft.sessionId,
    allowed: true,
    reasonCode: params.decision === 'approved' ? 'APPROVED' : 'REJECTED',
    reason:
      params.decision === 'approved'
        ? 'Draft approved for human follow-up (still not sent/filed/paid)'
        : nextBundle.rejectionReason,
    draftArtifactId: nextBundle.draftId,
    approvalStatus: nextBundle.approvalStatus,
    executable: false,
    steps: nextBundle.steps.map((step) => ({
      agentSlug: step.agentSlug,
      reasonCode: step.decision.reasonCode,
      allowed: step.decision.allowed,
      draftType: step.draftType,
      matchedModules: step.decision.matchedModules,
    })),
    draft: nextBundle.draft,
    bundle: nextBundle,
    recordedAt: now,
  }

  const audit = await prisma.auditLog.create({
    data: {
      tenantId: params.auth.tenantId,
      entityType: 'customer_specialist_draft',
      entityId: nextBundle.draftId,
      changedBy: params.auth.userId,
      changeSummary: `${nextBundle.flow}:${params.decision}`,
      afterSnapshot: asInputJson(snapshot),
    },
    select: { id: true, timestamp: true, changedBy: true },
  })

  return {
    auditId: audit.id,
    draftId: nextBundle.draftId,
    flow: nextBundle.flow,
    sessionId: params.draft.sessionId,
    approvalStatus: nextBundle.approvalStatus,
    createdAt: audit.timestamp.toISOString(),
    changedBy: audit.changedBy,
    bundle: nextBundle,
    reason: snapshot.reason || undefined,
  }
}
