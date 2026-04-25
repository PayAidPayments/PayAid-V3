export type UUID = string

export interface LeadBriefInput {
  name: string
  description?: string
  industryFilters: unknown[]
  geoFilters: unknown[]
  sizeFilters: unknown[]
  revenueFilters?: unknown[]
  personaFilters: unknown[]
  techFilters?: unknown[]
  triggerFilters?: unknown[]
  exclusionFilters?: unknown[]
}

export interface CompanyDiscoveryRequest {
  orgId: UUID
  briefId: UUID
  segmentId: UUID
  limit: number
  cursor?: string
  searchMode: 'seed' | 'broad' | 'similar'
}

export interface CompanyCandidate {
  externalId?: string
  provider: string
  companyName: string
  domain?: string
  websiteUrl?: string
  linkedinUrl?: string
  country?: string
  region?: string
  city?: string
  employeeCount?: number
  employeeBand?: string
  revenueBand?: string
  industry?: string
  subIndustry?: string
  techStack?: string[]
  signals?: Array<{ type: string; strength?: number; title?: string }>
  confidence?: number
  sourceUrl?: string
  raw?: unknown
}

export interface ContactDiscoveryRequest {
  orgId: UUID
  accountId: UUID
  personas: unknown[]
  limit: number
}

export interface ContactCandidate {
  externalId?: string
  provider: string
  fullName: string
  firstName?: string
  lastName?: string
  title?: string
  seniority?: string
  department?: string
  linkedinUrl?: string
  workEmail?: string
  emailConfidence?: number
  phone?: string
  phoneConfidence?: number
  sourceUrl?: string
  raw?: unknown
}

export interface NormalizedCompanyRecord {
  companyName: string
  normalizedName: string
  domain?: string
  websiteUrl?: string
  linkedinUrl?: string
  country?: string
  region?: string
  city?: string
  employeeCount?: number
  employeeBand?: string
  revenueBand?: string
  industry?: string
  subIndustry?: string
  techStack?: string[]
  sourceProvider: string
  sourceCoverageScore: number
  evidence: FieldEvidenceCandidate[]
}

export interface NormalizedContactRecord {
  fullName: string
  normalizedFullName: string
  firstName?: string
  lastName?: string
  title?: string
  seniority?: string
  department?: string
  linkedinUrl?: string
  workEmail?: string
  phone?: string
  sourceProvider: string
  evidence: FieldEvidenceCandidate[]
}

export interface FieldEvidenceCandidate {
  fieldName: string
  rawValue?: string
  normalizedValue?: string
  provider: string
  confidence?: number
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'LIKELY' | 'UNKNOWN'
  sourceUrl?: string
  legalBasis?: string
  observedAt: Date
  isWinningValue: boolean
}

export interface ProviderTrustProfile {
  provider: string
  baseWeight: number
  strengths: Array<'company' | 'contact' | 'email' | 'phone' | 'signal'>
  freshnessTtlDays: number
}

export interface LeadScoreBreakdown {
  fitScore: number
  intentScore: number
  reachabilityScore: number
  compositeScore: number
  whyNow: string[]
  recommendedChannel?: 'email' | 'linkedin' | 'call' | 'nurture'
  recommendedAngle?: string
  explanationVersion: string
}

export interface ActivationRequest {
  orgId: UUID
  segmentId?: UUID
  accountIds: UUID[]
  contactIds?: UUID[]
  destination: 'crm' | 'marketing' | 'sequence'
  options: {
    createTasks?: boolean
    assignOwner?: boolean
    startSequence?: boolean
    skipDuplicates?: boolean
  }
}

export interface LeadAccountListItemView {
  id: string
  companyName: string
  domain?: string
  industry?: string
  city?: string
  employeeBand?: string
  conversionPotential: number
  fitScore: number
  intentScore: number
  verifiedContactCount: number
  topSignal?: string
  freshnessLabel: 'fresh' | 'aging' | 'stale'
  recommendedAction?: 'review' | 'resolve_contacts' | 'activate'
}
