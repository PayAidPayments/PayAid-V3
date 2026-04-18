export type InboundDedupePolicy =
  | 'reject_duplicate'
  | 'merge_existing'
  /** If email/phone matches an existing contact, return it without updates or workflows. */
  | 'return_existing_without_update'

/** How merged fields combine when `dedupePolicy` is `merge_existing`. */
export type InboundMergeExistingFields = 'prefer_incoming' | 'fill_empty_only'

/** Canonical capture metadata stored on Contact.sourceData.payaidSource */
export interface InboundSourceAttribution {
  sourceChannel: string
  sourceSubchannel?: string
  sourceCampaign?: string
  sourceAsset?: string
  sourceRef?: string
  capturedAt?: string
  capturedBy?: string
  rawMetadata?: Record<string, unknown>
}

export interface InboundContactFields {
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  type?: 'customer' | 'lead' | 'vendor' | 'employee'
  stage?: 'prospect' | 'contact' | 'customer'
  status?: 'active' | 'inactive' | 'lost'
  address?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  tags?: string[]
  notes?: string | null
  internalNotes?: string | null
  /** When set, routing must not override assignment without an explicit product rule (v1: always respected). */
  assignedToId?: string | null
  attributionChannel?: string | null
}

export type InboundOrchestrationStep =
  | 'lead.received'
  | 'lead.normalized'
  | 'lead.matched'
  | 'lead.scored'
  | 'lead.assigned'
  | 'lead.followup.started'
  | 'lead.escalated'

export interface InboundExecutionLogEntry {
  step: InboundOrchestrationStep | 'lead.persisted' | 'lead.duplicate_rejected'
  detail?: Record<string, unknown>
}

export interface ProcessInboundLeadInput {
  tenantId: string
  actorUserId: string
  dedupePolicy: InboundDedupePolicy
  source: InboundSourceAttribution
  contact: InboundContactFields
  /** Back-compat Contact.source string (e.g. website, manual). Defaults to sourceChannel. */
  legacySourceLabel?: string
  skipWorkflows?: boolean
  skipAudit?: boolean
  skipCacheInvalidation?: boolean
  /** When true, enforces plan limits before create (not on merge). Default true. */
  enforceTenantLimits?: boolean
  mergeExistingFields?: InboundMergeExistingFields
  /** When true, sets `Contact.lastContactedAt` on create and merge (e.g. public forms). */
  touchLastContactedAt?: boolean
  /** When true, skips writing to `InboundOrchestrationLog` (bulk jobs, tests). */
  skipExecutionLogWrite?: boolean
  /** When true, skips CRMConfig-based auto-assignment (bulk import, marketing CSV). */
  skipLeadRouting?: boolean
}

export interface ProcessInboundLeadError {
  code: 'DUPLICATE_EMAIL' | 'DUPLICATE_PHONE' | 'CONTACT_LIMIT' | 'VALIDATION'
  message: string
  existingId?: string
}

export interface ProcessInboundLeadResult {
  ok: boolean
  contact: {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    stage: string | null
    type: string | null
    status: string | null
    source: string | null
    accountId: string | null
    assignedToId: string | null
    leadScore: number
  }
  created: boolean
  dedupeAction: 'created' | 'merged' | 'rejected_duplicate' | 'unchanged'
  executionLog: InboundExecutionLogEntry[]
  error?: ProcessInboundLeadError
}
