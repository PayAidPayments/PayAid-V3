/**
 * Runtime type guards for lead / queue payloads (shared with M0 contract tests).
 * Entity IDs follow the same cuid | uuid union as `modules/shared/business-graph`.
 */

function isEntityId(v: unknown): v is string {
  if (typeof v !== 'string' || v.length < 2) return false
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  ) {
    return true
  }
  // Prisma-style cuid (25 chars, starts with c)
  if (/^c[a-z0-9]{24}$/.test(v)) return true
  return false
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function isActivationRequest(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  if (!isEntityId(v.orgId)) return false
  if (!Array.isArray(v.accountIds) || v.accountIds.length === 0) return false
  if (!v.accountIds.every(isEntityId)) return false
  if (v.contactIds !== undefined) {
    if (!Array.isArray(v.contactIds) || !v.contactIds.every(isEntityId)) return false
  }
  if (v.segmentId !== undefined && !isEntityId(v.segmentId)) return false
  const dest = v.destination
  if (dest !== 'crm' && dest !== 'marketing' && dest !== 'sequence') return false
  if (!isPlainObject(v.options)) return false
  return true
}

export function isLeadActivationPayload(v: unknown): boolean {
  return isActivationRequest(v)
}

export function isCompanyDiscoveryRequest(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  if (!isEntityId(v.orgId) || !isEntityId(v.briefId) || !isEntityId(v.segmentId)) return false
  if (typeof v.limit !== 'number' || !Number.isFinite(v.limit) || v.limit <= 0) return false
  const mode = v.searchMode
  if (mode !== 'seed' && mode !== 'broad' && mode !== 'similar') return false
  return true
}

export function isLeadDiscoveryPayload(v: unknown): boolean {
  return isCompanyDiscoveryRequest(v)
}

export function isContactDiscoveryRequest(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  if (!isEntityId(v.orgId) || !isEntityId(v.accountId)) return false
  if (!Array.isArray(v.personas)) return false
  if (typeof v.limit !== 'number' || !Number.isFinite(v.limit) || v.limit <= 0) return false
  return true
}

export function isLeadAccountEnrichRequest(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  return isEntityId(v.orgId) && isEntityId(v.accountId)
}

export function isLeadAccountEnrichPayload(v: unknown): boolean {
  return isLeadAccountEnrichRequest(v)
}

export function isLeadAccountResolveContactsPayload(v: unknown): boolean {
  return isContactDiscoveryRequest(v)
}

export function isLeadScoreComputeRequest(v: unknown): boolean {
  return isLeadAccountEnrichRequest(v)
}

export function isLeadScoreComputePayload(v: unknown): boolean {
  return isLeadScoreComputeRequest(v)
}

export function isLeadContactEnrichRequest(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  return isEntityId(v.orgId) && isEntityId(v.contactId)
}

export function isLeadContactEnrichPayload(v: unknown): boolean {
  return isLeadContactEnrichRequest(v)
}

export function isLeadSegmentRefreshRequest(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  return isEntityId(v.orgId) && isEntityId(v.segmentId)
}

export function isLeadSegmentRefreshPayload(v: unknown): boolean {
  return isLeadSegmentRefreshRequest(v)
}

export function isLeadSegmentReEnrichRequest(v: unknown): boolean {
  return isLeadSegmentRefreshRequest(v)
}

export function isLeadSegmentReEnrichPayload(v: unknown): boolean {
  return isLeadSegmentReEnrichRequest(v)
}

export function isLeadStartSequenceRequest(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  if (!isEntityId(v.orgId) || !isEntityId(v.sequenceId)) return false
  if (!Array.isArray(v.contactIds) || v.contactIds.length === 0) return false
  return v.contactIds.every(isEntityId)
}

export function isLeadStartSequencePayload(v: unknown): boolean {
  return isLeadStartSequenceRequest(v)
}

export function isLeadExportGenerateRequest(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  if (!isEntityId(v.orgId)) return false
  if (v.format !== 'csv') return false
  return isEntityId(v.segmentId)
}

export function isLeadExportGeneratePayload(v: unknown): boolean {
  return isLeadExportGenerateRequest(v)
}

export function isLeadComplianceAuditSweepRequest(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  if (!isEntityId(v.orgId)) return false
  return v.scope === 'tenant'
}

export function isLeadComplianceAuditSweepPayload(v: unknown): boolean {
  return isLeadComplianceAuditSweepRequest(v)
}
