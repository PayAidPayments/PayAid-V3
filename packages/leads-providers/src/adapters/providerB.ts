import type { CompanyCandidate, CompanyDiscoveryRequest, ContactCandidate, ContactDiscoveryRequest } from '@payaid/leads-core'
import type { LeadSourceAdapter } from '../base/LeadSourceAdapter'

export class ProviderBAdapter implements LeadSourceAdapter {
  name = 'provider-b'

  async discoverCompanies(_input: CompanyDiscoveryRequest): Promise<CompanyCandidate[]> {
    return []
  }

  async enrichCompany(): Promise<CompanyCandidate | null> {
    return null
  }

  async findContacts(_input: ContactDiscoveryRequest): Promise<ContactCandidate[]> {
    return []
  }

  async enrichContact(): Promise<ContactCandidate | null> {
    return null
  }
}
