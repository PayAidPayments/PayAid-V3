/**
 * Client helpers for P1-C4 automation builder / run-history UI.
 */

export type AutomationWorkflow = {
  id: string
  name: string
  description: string | null
  triggerType: string
  triggerEvent: string | null
  triggerSchedule: string | null
  isActive: boolean
  steps: unknown
  createdAt: string
  updatedAt: string
}

export type AutomationRun = {
  runId: string
  workflowId: string
  workflowName: string | null
  status: string
  canonicalStatus: string
  eventType: string | null
  startedAt: string
  completedAt: string | null
  error: string | null
}

export type PendingApproval = {
  id: string
  workflowId: string
  status: string
  startedAt: string
  workflow?: { id: string; name: string; triggerEvent: string | null }
}

function authHeaders(token: string | null | undefined): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      (data as { error?: string })?.error || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data as T
}

export async function fetchAutomationWorkflows(token: string | null) {
  const res = await fetch('/api/automation/workflows', {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  const data = await readJson<{ workflows: AutomationWorkflow[] }>(res)
  return data.workflows ?? []
}

export async function fetchAutomationRuns(
  token: string | null,
  opts?: { limit?: number; status?: string; workflowId?: string }
) {
  const params = new URLSearchParams()
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.status) params.set('status', opts.status)
  if (opts?.workflowId) params.set('workflowId', opts.workflowId)
  const qs = params.toString()
  const res = await fetch(`/api/automation/runs${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  const data = await readJson<{ runs: AutomationRun[]; count: number }>(res)
  return data.runs ?? []
}

export async function fetchPendingApprovals(token: string | null) {
  const res = await fetch('/api/automation/workflows/approvals', {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  const data = await readJson<{ approvals: PendingApproval[] }>(res)
  return data.approvals ?? []
}

export async function createAutomationWorkflow(
  token: string | null,
  body: Record<string, unknown>
) {
  const res = await fetch('/api/automation/workflows', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return readJson<{ success: boolean; workflow: AutomationWorkflow }>(res)
}

export async function executeAutomationWorkflow(
  token: string | null,
  workflowId: string,
  triggerData: Record<string, unknown> = {}
) {
  const res = await fetch(`/api/automation/workflows/${workflowId}/execute`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ triggerData }),
  })
  return readJson<{
    success: boolean
    executionId?: string
    status?: string
    error?: string
  }>(res)
}

export async function decideAutomationApproval(
  token: string | null,
  executionId: string,
  decision: 'APPROVE' | 'REJECT',
  note?: string
) {
  const res = await fetch(
    `/api/automation/workflows/approvals/${executionId}/decision`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ decision, note }),
    }
  )
  return readJson<{ success: boolean }>(res)
}

export function formatMetricValue(
  loading: boolean,
  value: number | null | undefined
): string {
  if (loading || value == null) return '—'
  return String(value)
}

export type AutomationDlqEntry = {
  runId: string
  workflowId: string
  workflowName: string | null
  eventType: string | null
  error: string | null
  failedAt: string
  attempt: number
  maxAttempts: number
  redriveable: boolean
  inDlq: boolean
}

export async function fetchAutomationDlq(token: string | null, limit = 50) {
  const res = await fetch(`/api/automation/dlq?limit=${limit}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  const data = await readJson<{
    entries: AutomationDlqEntry[]
    count: number
    dlqCount: number
  }>(res)
  return data
}

export async function redriveAutomationRunClient(token: string | null, runId: string) {
  const res = await fetch(`/api/automation/runs/${runId}/redrive`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  })
  return readJson<{
    success: boolean
    result: {
      sourceRunId: string
      newRunId: string
      workflowId: string
      status: string
      attempt: number
      error?: string
    }
  }>(res)
}

export async function processAutomationRetriesClient(token: string | null, limit = 20) {
  const res = await fetch('/api/automation/retries/process', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ limit }),
  })
  return readJson<{ success: boolean; processed: number }>(res)
}
