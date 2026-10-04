import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import type { CustomerFlowAuth, CustomerFlowDraftBundle } from './types'

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export function createCustomerFlowDraftId(flow: string): string {
  return `cflow_${flow.replace(/[^a-z0-9-]/gi, '')}_${randomUUID().slice(0, 8)}`
}

/**
 * Persist customer flow draft + per-step entitlement outcomes.
 * Uses AuditLog (always) and SpecialistActivityLog when the table is available.
 */
export async function persistCustomerFlowAudit(params: {
  auth: CustomerFlowAuth
  sessionId: string
  flow: 'sales-follow-up' | 'gst-invoice-draft'
  allowed: boolean
  reasonCode: string
  reason: string
  bundle: CustomerFlowDraftBundle | null
}): Promise<string[]> {
  const ids: string[] = []
  const draftArtifactId = params.bundle?.draftId ?? null
  const primaryAgent =
    params.bundle?.steps.find((step) => step.decision.allowed)?.agentSlug ||
    params.bundle?.steps[0]?.agentSlug ||
    `flow:${params.flow}`

  const snapshot = {
    flow: params.flow,
    sessionId: params.sessionId,
    allowed: params.allowed,
    reasonCode: params.reasonCode,
    reason: params.reason,
    draftArtifactId,
    approvalStatus: params.bundle?.approvalStatus ?? 'denied',
    executable: false,
    steps: (params.bundle?.steps || []).map((step) => ({
      agentSlug: step.agentSlug,
      reasonCode: step.decision.reasonCode,
      allowed: step.decision.allowed,
      draftType: step.draftType,
      matchedModules: step.decision.matchedModules,
    })),
    draft: params.bundle?.draft ?? null,
    recordedAt: new Date().toISOString(),
  }

  // Lazy import so flow smoke/unit paths can run without loading server-only Prisma.
  const { prisma } = await import('@/lib/db/prisma')

  const audit = await prisma.auditLog.create({
    data: {
      tenantId: params.auth.tenantId,
      entityType: 'customer_specialist_draft',
      entityId: draftArtifactId || params.sessionId,
      changedBy: params.auth.userId,
      changeSummary: `${params.flow}:${params.allowed ? 'draft_created' : 'denied'}:${params.reasonCode}`,
      afterSnapshot: asInputJson(snapshot),
    },
    select: { id: true },
  })
  ids.push(audit.id)

  try {
    const specialistLog = await prisma.specialistActivityLog.create({
      data: {
        tenantId: params.auth.tenantId,
        userId: params.auth.userId,
        specialistId: primaryAgent,
        specialistName: `Customer flow: ${params.flow}`,
        module: params.flow === 'gst-invoice-draft' ? 'finance' : 'sales',
        sessionId: params.sessionId,
        prompt: `${params.flow} product flow`,
        intent: params.flow,
        contextSources: ['customer-specialist-catalog', 'customer-flow'],
        permissionsChecked: (params.bundle?.steps || []).map(
          (step) => `${step.agentSlug}:${step.decision.reasonCode}`
        ),
        permissionResult: params.allowed ? 'granted' : 'denied',
        actionLevel: 'draft',
        draftArtifactId,
        proposedAction: params.flow,
        approvalRequired: params.bundle?.approvalStatus === 'pending_approval',
        result: params.allowed ? 'success' : 'blocked',
        reason: params.reason,
        metadata: asInputJson({
          eventType: params.allowed
            ? 'customer_flow.draft.created'
            : 'customer_flow.denied',
          flow: params.flow,
          reasonCode: params.reasonCode,
        }),
      },
      select: { id: true },
    })
    ids.push(specialistLog.id)
  } catch {
    // SpecialistActivityLog may be unavailable in some environments; AuditLog is enough.
  }

  return ids
}
