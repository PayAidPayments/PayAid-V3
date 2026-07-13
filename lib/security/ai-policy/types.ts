/**
 * Platform AI policy types — capability rings, surfaces, and audit payloads.
 */

export type ToolCapability = 'read' | 'draft' | 'write' | 'send' | 'delete' | 'execute' | 'admin'

export type AiSurface =
  | 'chat'
  | 'cofounder'
  | 'voice_transcript'
  | 'email_automation'
  | 'form_suggestions'
  | 'sentiment'
  | 'langchain'
  | 'kb_retrieval'

export interface AiPolicyInput {
  surface: AiSurface
  route: string
  tenantId: string
  userId: string
  roles?: string[]
  prompt: string
  retrievedChunks?: string[]
  sessionId?: string
}

export interface AiPolicyDecision {
  allowed: boolean
  blockCode?: string
  blockReason?: string
  sanitizedPrompt: string
  redactions: string[]
  injectionRiskScore: number
  injectionFlags: string[]
  rateLimited: boolean
  toolKillSwitchActive: boolean
  policyVersion: string
}

export interface ProposedAction {
  type: string
  capability: ToolCapability
  resourceType?: string
  resourceId?: string
  payload?: Record<string, unknown>
}

export interface ActionPolicyResult {
  allowed: boolean
  requiresApproval: boolean
  reason?: string
  code?: string
}

export interface ToolPolicyContext {
  tenantId: string
  userId: string
  roles?: string[]
  toolId: string
  sessionId?: string
}

export interface AiAuditRecord {
  surface: AiSurface
  route: string
  tenantId: string
  userId: string
  sessionId?: string
  promptPreview: string
  responsePreview?: string
  modelProvider?: string
  retrievedChunkCount?: number
  toolId?: string
  toolCapability?: ToolCapability
  policyDecision: 'allowed' | 'blocked' | 'approval_required'
  policyCode?: string
  policyReason?: string
  injectionRiskScore?: number
  injectionFlags?: string[]
  authContext?: {
    roles?: string[]
  }
}
