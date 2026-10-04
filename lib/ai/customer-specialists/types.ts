export type CustomerActionMode = 'advise' | 'draft'

export type CustomerApprovalPolicyId =
  | 'read-only'
  | 'draft-first'
  | 'guarded-ops'
  | 'external-actions'
  | 'destructive'

export type CustomerCapability =
  | 'read'
  | 'draft'
  | 'write'
  | 'send'
  | 'execute'
  | 'delete'
  | 'admin'

export interface CustomerEntitlementHeader {
  modulesAny: string[]
  modulesAll: string[]
  minRoles: string[]
  denyWithoutModule: boolean
  dataRead: string[]
  draftTypes: string[]
  forbiddenCapabilities: CustomerCapability[]
  auditRequired: boolean
  requiresApprovalBefore?: CustomerCapability[]
}

export interface CustomerSpecialistAgent {
  slug: string
  name: string
  division: string
  actionMode: CustomerActionMode
  approvalPolicy: CustomerApprovalPolicyId
  summary: string
  entitlement: CustomerEntitlementHeader
}

export interface CustomerSpecialistCatalog {
  pack: 'customer'
  entitlementHeaderVersion: string
  agents: CustomerSpecialistAgent[]
}

export interface CustomerEntitlementContext {
  tenantId?: string | null
  userId?: string | null
  roles?: string[] | null
  licensedModules?: string[] | null
  requestedCapability?: CustomerCapability
  draftType?: string | null
}

export type CustomerEntitlementReasonCode =
  | 'ALLOW'
  | 'AGENT_UNKNOWN'
  | 'AUTH_REQUIRED'
  | 'MODULE_NOT_LICENSED'
  | 'ROLE_DENIED'
  | 'CAPABILITY_FORBIDDEN'
  | 'DRAFT_TYPE_FORBIDDEN'
  | 'INVALID_ENTITLEMENT_HEADER'

export interface CustomerEntitlementDecision {
  allowed: boolean
  reasonCode: CustomerEntitlementReasonCode
  reason: string
  agentSlug: string
  auditRequired: boolean
  matchedModules: string[]
}
