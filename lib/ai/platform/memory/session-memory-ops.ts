/**
 * Session memory lifecycle ops — export / delete / audit (D2 Phase 4).
 */

import { recordAiPolicyAudit } from '@/lib/security/ai-policy/ai-audit'
import type { AiSurface } from '@/lib/security/ai-policy'
import {
  clearSessionMemoryAsync,
  deleteTenantSessionMemory,
  exportTenantSessionMemory,
  getSessionMemoryAsync,
  listTenantSessionMemoryIds,
  type SessionMemoryEntry,
} from './session-memory'

export interface SessionMemoryExportPayload {
  tenantId: string
  exportedAt: string
  backend: string
  sessionCount: number
  sessions: Record<string, SessionMemoryEntry[]>
}

export async function exportSessionMemoryForTenant(params: {
  tenantId: string
  userId: string
  sessionId?: string
  surface?: AiSurface
  route?: string
}): Promise<SessionMemoryExportPayload> {
  const backend = (process.env.AI_SESSION_MEMORY_BACKEND || 'memory').toLowerCase()
  let sessions: Record<string, SessionMemoryEntry[]>

  if (params.sessionId) {
    const entries = await getSessionMemoryAsync(params.tenantId, params.sessionId)
    sessions = { [params.sessionId]: entries }
  } else {
    sessions = await exportTenantSessionMemory(params.tenantId)
  }

  await recordAiPolicyAudit({
    surface: params.surface || 'chat',
    route: params.route || '/api/ai/session-memory',
    tenantId: params.tenantId,
    userId: params.userId,
    sessionId: params.sessionId,
    promptPreview: `[session-memory:export sessions=${Object.keys(sessions).length}]`,
    policyDecision: 'allowed',
    policyCode: 'MEMORY_EXPORT_OK',
    policyReason: 'Tenant session memory export',
  })

  return {
    tenantId: params.tenantId,
    exportedAt: new Date().toISOString(),
    backend,
    sessionCount: Object.keys(sessions).length,
    sessions,
  }
}

export async function deleteSessionMemoryForTenant(params: {
  tenantId: string
  userId: string
  sessionId?: string
  surface?: AiSurface
  route?: string
}): Promise<{ deletedSessions: number }> {
  let deletedSessions = 0
  if (params.sessionId) {
    await clearSessionMemoryAsync(params.tenantId, params.sessionId)
    deletedSessions = 1
  } else {
    deletedSessions = await deleteTenantSessionMemory(params.tenantId)
  }

  await recordAiPolicyAudit({
    surface: params.surface || 'chat',
    route: params.route || '/api/ai/session-memory',
    tenantId: params.tenantId,
    userId: params.userId,
    sessionId: params.sessionId,
    promptPreview: `[session-memory:delete deleted=${deletedSessions}]`,
    policyDecision: 'allowed',
    policyCode: 'MEMORY_DELETE_OK',
    policyReason: params.sessionId
      ? 'Single session memory deleted'
      : 'Tenant-wide session memory deleted',
  })

  return { deletedSessions }
}

export async function listSessionMemorySessions(tenantId: string): Promise<string[]> {
  return listTenantSessionMemoryIds(tenantId)
}
