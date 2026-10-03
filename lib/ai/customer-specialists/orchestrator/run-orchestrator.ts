import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  loadCustomerSpecialistCatalog,
  runGstInvoiceDraftFlow,
  runSalesFollowUpFlow,
  type CustomerFlowAuth,
  type CustomerFlowResult,
  type CustomerFlowSlug,
  type GstInvoiceDraftInput,
  type SalesFollowUpInput,
} from '@/lib/ai/customer-specialists'

export interface CustomerOrchestratorRunbook {
  slug: CustomerFlowSlug
  title: string
  summary: string
  moduleIds: string[]
  requiresApproval: boolean
  agents: string[]
}

interface CustomerOrchestratorCatalog {
  pack: 'customer'
  maxAttempts: number
  runbooks: CustomerOrchestratorRunbook[]
}

export type CustomerOrchestratorPayload =
  | ({ runbook: 'sales-follow-up' } & SalesFollowUpInput)
  | ({ runbook: 'gst-invoice-draft' } & GstInvoiceDraftInput)

export interface CustomerOrchestratorResult extends CustomerFlowResult {
  runbook: CustomerFlowSlug
  title: string
  handoffIds: string[]
  retryable: boolean
}

let cachedRunbooks: CustomerOrchestratorCatalog | null = null

export function loadCustomerOrchestratorRunbooks(
  repoRoot = process.cwd()
): CustomerOrchestratorCatalog {
  if (cachedRunbooks) return cachedRunbooks
  const fullPath = join(
    repoRoot,
    'lib',
    'ai',
    'customer-specialists',
    'orchestrator',
    'runbooks.json'
  )
  cachedRunbooks = JSON.parse(readFileSync(fullPath, 'utf8')) as CustomerOrchestratorCatalog
  return cachedRunbooks
}

export function resetCustomerOrchestratorRunbooksCache() {
  cachedRunbooks = null
}

export function listCustomerOrchestratorRunbooks(): CustomerOrchestratorRunbook[] {
  return loadCustomerOrchestratorRunbooks().runbooks
}

export function getCustomerOrchestratorRunbook(
  slug: string
): CustomerOrchestratorRunbook | undefined {
  return listCustomerOrchestratorRunbooks().find((rb) => rb.slug === slug)
}

async function persistHandoff(params: {
  auth: CustomerFlowAuth
  sessionId: string
  runbook: CustomerFlowSlug
  attempt: number
  maxAttempts: number
  result: CustomerFlowResult
}): Promise<string> {
  const { prisma } = await import('@/lib/db/prisma')
  const row = await prisma.auditLog.create({
    data: {
      tenantId: params.auth.tenantId,
      entityType: 'customer_flow_handoff',
      entityId: params.sessionId,
      changedBy: params.auth.userId,
      changeSummary: `${params.runbook}:attempt-${params.attempt}:${params.result.reasonCode}`,
      afterSnapshot: {
        sessionId: params.sessionId,
        runbook: params.runbook,
        attempt: params.attempt,
        maxAttempts: params.maxAttempts,
        allowed: params.result.allowed,
        reasonCode: params.result.reasonCode,
        reason: params.result.reason,
        draftId: params.result.bundle?.draftId ?? null,
        approvalStatus: params.result.bundle?.approvalStatus ?? null,
        stepAgents: (params.result.bundle?.steps || []).map((s) => s.agentSlug),
        recordedAt: new Date().toISOString(),
      },
    },
    select: { id: true },
  })
  return row.id
}

function hasLicensedModule(auth: CustomerFlowAuth, moduleIds: string[]): boolean {
  const licensed = new Set(auth.licensedModules.map((m) => m.toLowerCase()))
  return moduleIds.some((id) => licensed.has(id.toLowerCase()))
}

/**
 * Thin customer orchestrator:
 * - selects a runbook
 * - runs the matching Phase 3 flow
 * - retries unexpected failures up to maxAttempts
 * - entitlement denials escalate immediately (not retryable)
 * - stores handoffs in tenant AuditLog
 */
export async function runCustomerOrchestrator(params: {
  auth: CustomerFlowAuth
  payload: CustomerOrchestratorPayload
  persistAudit?: boolean
}): Promise<CustomerOrchestratorResult> {
  const catalog = loadCustomerSpecialistCatalog()
  const runbooks = loadCustomerOrchestratorRunbooks()
  const runbook = getCustomerOrchestratorRunbook(params.payload.runbook)
  if (!runbook) {
    return {
      allowed: false,
      reasonCode: 'RUNBOOK_UNKNOWN',
      reason: `Unknown runbook: ${params.payload.runbook}`,
      sessionId: params.payload.sessionId || `orch-${randomUUID()}`,
      auditIds: [],
      bundle: null,
      runbook: 'sales-follow-up',
      title: 'Unknown',
      handoffIds: [],
      retryable: false,
      attempt: 1,
      maxAttempts: runbooks.maxAttempts,
      escalated: true,
    }
  }

  if (!hasLicensedModule(params.auth, runbook.moduleIds)) {
    const sessionId = params.payload.sessionId || `${runbook.slug}-${randomUUID()}`
    return {
      allowed: false,
      reasonCode: 'MODULE_NOT_LICENSED',
      reason: `Tenant lacks required module for ${runbook.slug} (need one of: ${runbook.moduleIds.join(', ')})`,
      sessionId,
      auditIds: [],
      bundle: null,
      runbook: runbook.slug,
      title: runbook.title,
      handoffIds: [],
      retryable: false,
      attempt: 1,
      maxAttempts: runbooks.maxAttempts,
      escalated: true,
    }
  }

  const maxAttempts = Math.max(1, runbooks.maxAttempts || 3)
  const sessionId = params.payload.sessionId?.trim() || `${runbook.slug}-${randomUUID()}`
  const handoffIds: string[] = []
  let lastResult: CustomerFlowResult | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (runbook.slug === 'sales-follow-up') {
        const input = params.payload as SalesFollowUpInput & { runbook: 'sales-follow-up' }
        lastResult = await runSalesFollowUpFlow({
          catalog,
          auth: params.auth,
          input: {
            ...input,
            sessionId,
            persistAudit: params.persistAudit,
          },
        })
      } else {
        const input = params.payload as GstInvoiceDraftInput & { runbook: 'gst-invoice-draft' }
        lastResult = await runGstInvoiceDraftFlow({
          catalog,
          auth: params.auth,
          input: {
            ...input,
            sessionId,
            persistAudit: params.persistAudit,
          },
        })
      }

      if (params.persistAudit !== false) {
        handoffIds.push(
          await persistHandoff({
            auth: params.auth,
            sessionId,
            runbook: runbook.slug,
            attempt,
            maxAttempts,
            result: lastResult,
          })
        )
      }

      const entitlementDeny = [
        'MODULE_NOT_LICENSED',
        'ROLE_DENIED',
        'CAPABILITY_FORBIDDEN',
        'AGENT_UNKNOWN',
        'AUTH_REQUIRED',
        'DRAFT_TYPE_FORBIDDEN',
        'INVALID_ENTITLEMENT_HEADER',
      ].includes(lastResult.reasonCode)

      if (lastResult.allowed) {
        return {
          ...lastResult,
          sessionId,
          runbook: runbook.slug,
          title: runbook.title,
          handoffIds,
          retryable: false,
          attempt,
          maxAttempts,
          escalated: false,
        }
      }

      if (entitlementDeny || lastResult.reasonCode === 'VALIDATION_ERROR') {
        return {
          ...lastResult,
          sessionId,
          runbook: runbook.slug,
          title: runbook.title,
          handoffIds,
          retryable: false,
          attempt,
          maxAttempts,
          escalated: true,
        }
      }

      // Unexpected deny codes: retry
      if (attempt >= maxAttempts) {
        return {
          ...lastResult,
          sessionId,
          runbook: runbook.slug,
          title: runbook.title,
          handoffIds,
          retryable: false,
          attempt,
          maxAttempts,
          escalated: true,
          reason: `${lastResult.reason} (escalated after ${maxAttempts} attempts)`,
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Orchestrator failure'
      lastResult = {
        allowed: false,
        reasonCode: 'ORCHESTRATOR_ERROR',
        reason,
        sessionId,
        auditIds: [],
        bundle: null,
      }
      if (params.persistAudit !== false) {
        handoffIds.push(
          await persistHandoff({
            auth: params.auth,
            sessionId,
            runbook: runbook.slug,
            attempt,
            maxAttempts,
            result: lastResult,
          })
        )
      }
      if (attempt >= maxAttempts) {
        return {
          ...lastResult,
          runbook: runbook.slug,
          title: runbook.title,
          handoffIds,
          retryable: false,
          attempt,
          maxAttempts,
          escalated: true,
          reason: `${reason} (escalated after ${maxAttempts} attempts)`,
        }
      }
    }
  }

  return {
    allowed: false,
    reasonCode: lastResult?.reasonCode || 'ORCHESTRATOR_ERROR',
    reason: lastResult?.reason || 'Orchestrator failed',
    sessionId,
    auditIds: lastResult?.auditIds || [],
    bundle: lastResult?.bundle || null,
    runbook: runbook.slug,
    title: runbook.title,
    handoffIds,
    retryable: false,
    attempt: maxAttempts,
    maxAttempts,
    escalated: true,
  }
}
