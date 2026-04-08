import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'
import { SequenceDefinition, SignalEvent, WorkflowDefinition } from '@/lib/ai-native/m0-contracts'

const SIGNAL_ENTITY_TYPE = 'signal'
const WORKFLOW_ENTITY_TYPE = 'workflow'
const IDEMPOTENCY_ENTITY_TYPE = 'idempotency'
const SEQUENCE_DESCRIPTION_PREFIX = '[M0_SEQUENCE]'

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export async function hasSignalBeenIngested(tenantId: string, idempotencyKey: string) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId,
      entityType: SIGNAL_ENTITY_TYPE,
      entityId: idempotencyKey,
    },
    select: { id: true, timestamp: true },
  })

  return existing
}

export async function persistSignalAudit(
  tenantId: string,
  userId: string,
  idempotencyKey: string,
  signal: SignalEvent
) {
  return prisma.auditLog.create({
    data: {
      tenantId,
      entityType: SIGNAL_ENTITY_TYPE,
      entityId: idempotencyKey,
      changedBy: userId,
      changeSummary: `Signal ingested: ${signal.event_type}`,
      afterSnapshot: asInputJson(signal),
    },
  })
}

export async function listSignals(params: {
  tenantId: string
  entityType?: string
  intentMin?: number
  status?: string
  limit: number
}) {
  const rows = await prisma.auditLog.findMany({
    where: {
      tenantId: params.tenantId,
      entityType: SIGNAL_ENTITY_TYPE,
    },
    orderBy: { timestamp: 'desc' },
    take: params.limit,
  })

  const signals = rows
    .map((row) => row.afterSnapshot as SignalEvent | null)
    .filter((item): item is SignalEvent => item !== null)
    .filter((item) => (typeof params.intentMin === 'number' ? (item.intent_score ?? -1) >= params.intentMin : true))
    .filter((item) => (params.entityType ? item.entity_type === params.entityType : true))
    .filter((item) => (params.status ? String(item.payload?.status ?? '').toLowerCase() === params.status.toLowerCase() : true))

  return signals
}

export async function createWorkflow(tenantId: string, definition: WorkflowDefinition) {
  return prisma.workflow.create({
    data: {
      tenantId,
      name: definition.name,
      description: definition.description,
      triggerType: 'EVENT',
      triggerEvent: definition.trigger.event_type,
      isActive: definition.status === 'published',
      steps: asInputJson({
        schema_version: definition.schema_version,
        conditions: definition.conditions,
        actions: definition.actions,
        safety: definition.safety,
      }),
    },
  })
}

export function mapWorkflowStatus(isActive: boolean): 'published' | 'draft' {
  return isActive ? 'published' : 'draft'
}

export async function listWorkflows(tenantId: string) {
  return prisma.workflow.findMany({
    where: { tenantId, triggerType: 'EVENT' },
    orderBy: { createdAt: 'desc' },
  })
}

export async function publishWorkflow(tenantId: string, workflowId: string) {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, tenantId },
  })
  if (!workflow) return null

  return prisma.workflow.update({
    where: { id: workflowId },
    data: { isActive: true },
  })
}

export async function createWorkflowTestRun(
  tenantId: string,
  workflowId: string,
  triggerData: Record<string, unknown>
) {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, tenantId },
    select: { id: true, steps: true },
  })

  if (!workflow) {
    return null
  }

  const steps = workflow.steps as { actions?: unknown[] } | null
  const actions = Array.isArray(steps?.actions) ? steps.actions : []

  return prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      tenantId,
      status: 'COMPLETED',
      triggerData: asInputJson(triggerData),
      result: asInputJson({
        testRun: true,
        actionsPlanned: actions.length,
      }),
      completedAt: new Date(),
    },
  })
}

export async function createSequence(tenantId: string, definition: SequenceDefinition) {
  return prisma.workflow.create({
    data: {
      tenantId,
      name: definition.name,
      description: `${SEQUENCE_DESCRIPTION_PREFIX} ${definition.description ?? ''}`.trim(),
      triggerType: 'MANUAL',
      triggerEvent: 'sequence.manual',
      isActive: definition.status === 'published',
      steps: asInputJson({
        schema_version: definition.schema_version,
        sequence: true,
        steps: definition.steps,
      }),
    },
  })
}

export async function enrollSequence(
  tenantId: string,
  sequenceId: string,
  enrollment: Record<string, unknown>
) {
  const sequence = await prisma.workflow.findFirst({
    where: { id: sequenceId, tenantId },
    select: { id: true },
  })
  if (!sequence) return null

  return prisma.workflowExecution.create({
    data: {
      workflowId: sequence.id,
      tenantId,
      status: 'RUNNING',
      triggerData: asInputJson(enrollment),
      result: asInputJson({ enrollmentAccepted: true }),
    },
  })
}

export async function pauseSequence(tenantId: string, sequenceId: string) {
  const sequence = await prisma.workflow.findFirst({
    where: { id: sequenceId, tenantId },
  })
  if (!sequence) return null

  return prisma.workflow.update({
    where: { id: sequenceId },
    data: { isActive: false },
  })
}

export async function listActionAudit(params: {
  tenantId: string
  entityType?: string
  entityId?: string
  limit: number
}) {
  return prisma.auditLog.findMany({
    where: {
      tenantId: params.tenantId,
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.entityId ? { entityId: params.entityId } : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: params.limit,
  })
}

export async function markWorkflowAudit(
  tenantId: string,
  userId: string,
  entityId: string,
  summary: string,
  afterSnapshot?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      tenantId,
      entityType: WORKFLOW_ENTITY_TYPE,
      entityId,
      changedBy: userId,
      changeSummary: summary,
      afterSnapshot: afterSnapshot ? asInputJson(afterSnapshot) : null,
    },
  })
}

export async function findIdempotentRequest(tenantId: string, key: string) {
  return prisma.auditLog.findFirst({
    where: {
      tenantId,
      entityType: IDEMPOTENCY_ENTITY_TYPE,
      entityId: key,
    },
    select: { id: true, afterSnapshot: true, timestamp: true },
  })
}

export async function markIdempotentRequest(
  tenantId: string,
  userId: string,
  key: string,
  payload: Record<string, unknown>
) {
  return prisma.auditLog.create({
    data: {
      tenantId,
      entityType: IDEMPOTENCY_ENTITY_TYPE,
      entityId: key,
      changedBy: userId,
      changeSummary: `Idempotent request recorded: ${key}`,
      afterSnapshot: asInputJson(payload),
    },
  })
}

const M0_EXIT_FIVE_MIN_MS = 5 * 60 * 1000

function medianMs(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/** First workflow audit timestamp at or after `minTimeMs`, from a sorted ascending list. */
function firstWorkflowAtOrAfter(sortedMs: number[], minTimeMs: number): number | null {
  let lo = 0
  let hi = sortedMs.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (sortedMs[mid]! < minTimeMs) lo = mid + 1
    else hi = mid - 1
  }
  return lo < sortedMs.length ? sortedMs[lo]! : null
}

/**
 * M0 exit / staging verification metrics (read-only). See GET /api/v1/m0/exit-metrics.
 * Ratios are documented in the response; tune window/sample for prod-like samples.
 */
export async function getM0ExitMetrics(
  tenantId: string,
  opts: { windowDays?: number; signalSampleSize?: number } = {}
) {
  const windowDays = opts.windowDays ?? 7
  const signalSampleSize = Math.min(opts.signalSampleSize ?? 100, 500)
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

  const activeWorkflowsCount = await prisma.workflow.count({
    where: { tenantId, isActive: true },
  })

  const [signalAuditCount, workflowAuditCount, executions, signalRows, workflowAuditTimes] = await Promise.all([
    prisma.auditLog.count({
      where: { tenantId, entityType: SIGNAL_ENTITY_TYPE, timestamp: { gte: since } },
    }),
    prisma.auditLog.count({
      where: { tenantId, entityType: WORKFLOW_ENTITY_TYPE, timestamp: { gte: since } },
    }),
    prisma.workflowExecution.findMany({
      where: { tenantId, startedAt: { gte: since } },
      select: { id: true, result: true },
    }),
    prisma.auditLog.findMany({
      where: { tenantId, entityType: SIGNAL_ENTITY_TYPE, timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' },
      take: signalSampleSize,
      select: { timestamp: true, afterSnapshot: true },
    }),
    prisma.auditLog.findMany({
      where: { tenantId, entityType: WORKFLOW_ENTITY_TYPE, timestamp: { gte: since } },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    }),
  ])

  const nonTestExecutions = executions.filter((e) => {
    const r = e.result as { testRun?: boolean } | null
    return !r?.testRun
  }).length

  const denom = signalAuditCount + nonTestExecutions
  const numer = signalAuditCount + workflowAuditCount
  const auditCaptureRatio = denom > 0 ? numer / denom : null
  const auditCaptureMet = denom === 0 || (auditCaptureRatio !== null && auditCaptureRatio >= 0.9)

  const wfSortedMs = workflowAuditTimes.map((w) => w.timestamp.getTime())

  const latencies: number[] = []
  for (const row of signalRows) {
    const snap = row.afterSnapshot as { occurred_at?: string } | null
    if (!snap?.occurred_at) continue
    const occurredAtMs = Date.parse(snap.occurred_at)
    if (Number.isNaN(occurredAtMs)) continue

    const minRef = Math.max(row.timestamp.getTime(), occurredAtMs)
    const firstWfMs = firstWorkflowAtOrAfter(wfSortedMs, minRef)
    if (firstWfMs === null) continue

    const delta = firstWfMs - occurredAtMs
    if (delta >= 0 && delta < 48 * 60 * 60 * 1000) latencies.push(delta)
  }

  const medianLatency = medianMs(latencies)
  const medianLatencyInsufficient = latencies.length === 0
  const medianLatencyMet =
    medianLatencyInsufficient ? null : medianLatency !== null && medianLatency < M0_EXIT_FIVE_MIN_MS

  const activeWorkflowsMet = activeWorkflowsCount >= 3

  return {
    window_days: windowDays,
    window_start: since.toISOString(),
    active_workflows_count: activeWorkflowsCount,
    audit: {
      signal_audit_entries: signalAuditCount,
      workflow_audit_entries: workflowAuditCount,
      non_test_workflow_executions: nonTestExecutions,
      capture_ratio: auditCaptureRatio,
      capture_ratio_definition:
        '(signal_audit_entries + workflow_audit_entries) / (signal_audit_entries + non_test_workflow_executions); target ≥ 0.9 when denominator > 0',
      capture_met: auditCaptureMet,
    },
    latency: {
      signal_sample_cap: signalSampleSize,
      pairs_used: latencies.length,
      median_signal_to_first_workflow_audit_ms: medianLatency,
      insufficient_sample: medianLatencyInsufficient,
      pairing_note:
        'Per signal audit row: first AuditLog (entityType workflow) at or after max(signal_audit.timestamp, occurred_at from payload); Δ = that timestamp minus occurred_at',
      median_under_five_minutes: medianLatencyMet,
    },
    criteria: {
      active_workflows_met: activeWorkflowsMet,
      audit_capture_met: auditCaptureMet,
      median_latency_met: medianLatencyMet,
      /** All three gates satisfied (latency must be provably under 5 min; insufficient sample fails this). */
      all_met_strict:
        activeWorkflowsMet && auditCaptureMet && medianLatencyMet === true,
      /** Same as strict except latency is skipped when no signal→workflow pairs exist in the sample (document in runbook). */
      all_met_latency_na_ok:
        activeWorkflowsMet &&
        auditCaptureMet &&
        (medianLatencyMet === true || medianLatencyInsufficient),
    },
  }
}
