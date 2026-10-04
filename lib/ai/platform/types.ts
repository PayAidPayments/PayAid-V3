/**
 * PayAid V3 layered AI platform — shared types.
 * Security/policy enforcement lives in lib/security/ai-policy (outside chains/graphs).
 */

import type { AiSurface, ToolCapability } from '@/lib/security/ai-policy'

export type IntentClass =
  | 'informational'
  | 'analytical'
  | 'draft_content'
  | 'action_request'
  | 'workflow_trigger'
  | 'unknown'

export type SensitivityClass = 'public' | 'internal' | 'confidential' | 'restricted'

export type RiskClass = 'low' | 'medium' | 'high' | 'critical'

export interface NormalizedAiInput {
  raw: string
  normalized: string
  surface: AiSurface
  route: string
  channel: 'dashboard' | 'voice' | 'email' | 'webhook' | 'api'
  metadata?: Record<string, unknown>
}

export interface IngressClassification {
  intent: IntentClass
  sensitivity: SensitivityClass
  risk: RiskClass
  actionOriented: boolean
  labels: string[]
}

export interface IngressContext {
  tenantId: string
  userId: string
  roles?: string[]
  sessionId?: string
  workflowId?: string
  workflowVersion?: string
}

export interface IngressResult {
  allowed: boolean
  blockCode?: string
  blockReason?: string
  normalizedInput: NormalizedAiInput
  classification: IngressClassification
  sanitizedText: string
  retrievedChunks?: string[]
  policyVersion: string
}

export interface ApprovalPolicyRule {
  id: string
  capabilities: ToolCapability[]
  requiresHumanApproval: boolean
  minRoles?: string[]
  shadowMode?: boolean
  description: string
}

export interface WorkflowDefinition {
  id: string
  name: string
  owner: string
  version: string
  description: string
  surfaces: AiSurface[]
  allowedTools: string[]
  approvalPolicyId: string
  promptTemplateIds: string[]
  orchestration: 'custom' | 'langchain' | 'langgraph'
  auditSchemaVersion: string
  rollbackPlan?: string
  status: 'draft' | 'shadow' | 'active' | 'deprecated'
}
