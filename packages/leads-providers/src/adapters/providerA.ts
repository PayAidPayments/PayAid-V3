import type { CompanyCandidate, CompanyDiscoveryRequest, ContactCandidate, ContactDiscoveryRequest } from '@payaid/leads-core'
import type { LeadSourceAdapter } from '../base/LeadSourceAdapter'

export class ProviderAAdapter implements LeadSourceAdapter {
  name = 'provider-a'

  async discoverCompanies(input: CompanyDiscoveryRequest): Promise<CompanyCandidate[]> {
    return [
      {
        provider: this.name,
        companyName: `Sample Account ${input.segmentId.slice(0, 6)}`,
        domain: `sample-${input.segmentId.slice(0, 6)}.com`,
        websiteUrl: `https://sample-${input.segmentId.slice(0, 6)}.com`,
        country: 'IN',
        city: 'Mumbai',
        industry: 'SaaS',
        employeeBand: '11-50',
        confidence: 0.8,
      },
    ]
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
