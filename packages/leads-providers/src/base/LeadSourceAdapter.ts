import type { CompanyCandidate, CompanyDiscoveryRequest, ContactCandidate, ContactDiscoveryRequest, UUID } from '@payaid/leads-core'

export interface EmailVerificationResult {
  email: string
  status: 'verified' | 'unverified' | 'likely' | 'unknown'
  confidence?: number
}

export interface PhoneVerificationResult {
  phone: string
  status: 'verified' | 'unverified' | 'likely' | 'unknown'
  confidence?: number
}

export interface ProviderUsageSnapshot {
  provider: string
  remainingUnits?: number
  consumedUnits?: number
  latencyMs?: number
}

export interface LeadSourceAdapter {
  name: string
  discoverCompanies(input: CompanyDiscoveryRequest): Promise<CompanyCandidate[]>
  enrichCompany(input: { orgId: UUID; accountId: UUID }): Promise<CompanyCandidate | null>
  findContacts(input: ContactDiscoveryRequest): Promise<ContactCandidate[]>
  enrichContact(input: { orgId: UUID; contactId: UUID }): Promise<ContactCandidate | null>
  verifyEmail?(input: { orgId: UUID; email: string }): Promise<EmailVerificationResult>
  verifyPhone?(input: { orgId: UUID; phone: string }): Promise<PhoneVerificationResult>
  getUsage?(input: { orgId: UUID }): Promise<ProviderUsageSnapshot>
}
