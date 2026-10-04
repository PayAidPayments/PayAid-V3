/**
 * NIST-aligned structured AI trace schema for PayAid workflows.
 */

import type { AiSurface, ToolCapability } from '@/lib/security/ai-policy'
import type { IntentClass, RiskClass, SensitivityClass } from '../types'

export const AI_TRACE_SCHEMA_VERSION = 'ai-trace-v1'

export interface AiTraceRecord {
  schemaVersion: typeof AI_TRACE_SCHEMA_VERSION
  interactionId: string
  timestamp: string
  tenantId: string
  principal: {
    userId: string
    roles?: string[]
    servicePrincipal?: string
  }
  workflow: {
    id: string
    version: string
    orchestration: 'custom' | 'langchain' | 'langgraph'
    nodeId?: string
  }
  ingress: {
    surface: AiSurface
    route: string
    intent: IntentClass
    sensitivity: SensitivityClass
    risk: RiskClass
  }
  prompt: {
    templateId?: string
    templateVersion?: string
    modelProvider?: string
    retrievedContextIds?: string[]
  }
  policy: {
    policyVersion: string
    decision: 'allowed' | 'blocked' | 'approval_required'
    code?: string
    injectionRiskScore?: number
    injectionFlags?: string[]
  }
  tools?: Array<{
    toolId: string
    capability: ToolCapability
    argsPreview?: string
    result: 'success' | 'blocked' | 'error'
    latencyMs?: number
  }>
  approval?: {
    required: boolean
    confirmed: boolean
    approvedBy?: string
  }
  outcome: {
    status: 'success' | 'blocked' | 'error'
    latencyMs: number
    errorCode?: string
  }
  securityFlags?: string[]
}

export function createInteractionId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
