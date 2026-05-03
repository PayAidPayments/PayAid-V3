import { getPluralTerm } from '@/lib/terminology/get-plural-term'
import { getTerm } from '@/lib/terminology/get-term'
import { normalizeIndustryKey } from '@/lib/terminology/industry-presets'

type IndustryExpectation = {
  lead: string
  leadPlural: string
  contact: string
  contactPlural: string
  deal: string
  dealPlural: string
  pipeline: string
}

function expectIndustryTerms(industry: string, expected: IndustryExpectation) {
  expect(getTerm('lead', { industry })).toBe(expected.lead)
  expect(getPluralTerm('lead', { industry })).toBe(expected.leadPlural)
  expect(getTerm('contact', { industry })).toBe(expected.contact)
  expect(getPluralTerm('contact', { industry })).toBe(expected.contactPlural)
  expect(getTerm('deal', { industry })).toBe(expected.deal)
  expect(getPluralTerm('deal', { industry })).toBe(expected.dealPlural)
  expect(getTerm('pipeline', { industry })).toBe(expected.pipeline)
}

describe('terminology resolver', () => {
  it('returns canonical defaults without context', () => {
    expect(getTerm('lead')).toBe('Lead')
    expect(getTerm('contact')).toBe('Contact')
    expect(getTerm('deal')).toBe('Deal')
  })

  it('uses industry preset labels when available', () => {
    expect(getTerm('lead', { industry: 'healthcare' })).toBe('Patient Inquiry')
    expect(getTerm('contact', { industry: 'healthcare' })).toBe('Patient')
    expect(getTerm('deal', { industry: 'restaurant' })).toBe('Order')
  })

  it('uses tenant override before industry and default', () => {
    expect(
      getTerm('lead', {
        industry: 'healthcare',
        tenantTerms: { lead: 'Opportunity' },
      })
    ).toBe('Opportunity')
  })

  it('normalizes legacy and underscore industry aliases', () => {
    expect(normalizeIndustryKey('real_estate')).toBe('real-estate')
    expect(normalizeIndustryKey('service_businesses')).toBe('service-business')
    expect(normalizeIndustryKey('event_management')).toBe('events')
    expect(normalizeIndustryKey('financial')).toBe('financial-services')
  })

  it('returns plural labels with fallback chain', () => {
    expect(getPluralTerm('contact')).toBe('Contacts')
    expect(getPluralTerm('contact', { industry: 'healthcare' })).toBe('Patients')
    expect(getPluralTerm('deal', { industry: 'events' })).toBe('Events')
    expect(
      getPluralTerm('deal', {
        industry: 'events',
        tenantPluralTerms: { deal: 'Opportunities' },
      })
    ).toBe('Opportunities')
  })

  it('matches industry UI terminology snapshots in table-driven scenarios', () => {
    const cases = [
      {
        industry: 'healthcare',
        expected: {
          lead: 'Patient Inquiry',
          leadPlural: 'Patient Inquiries',
          contact: 'Patient',
          contactPlural: 'Patients',
          deal: 'Care Plan',
          dealPlural: 'Care Plans',
          pipeline: 'Patient Journey',
        },
      },
      {
        industry: 'retail',
        expected: {
          lead: 'Lead',
          leadPlural: 'Leads',
          contact: 'Contact',
          contactPlural: 'Contacts',
          deal: 'Sale',
          dealPlural: 'Sales',
          pipeline: 'Sales Pipeline',
        },
      },
      {
        industry: 'real_estate',
        normalized: 'real-estate',
        expected: {
          lead: 'Property Lead',
          leadPlural: 'Property Leads',
          contact: 'Buyer',
          contactPlural: 'Buyers',
          deal: 'Deal',
          dealPlural: 'Deals',
          pipeline: 'Sales Pipeline',
        },
      },
      {
        industry: 'service_businesses',
        normalized: 'service-business',
        expected: {
          lead: 'Lead',
          leadPlural: 'Leads',
          contact: 'Client',
          contactPlural: 'Clients',
          deal: 'Job',
          dealPlural: 'Jobs',
          pipeline: 'Pipeline',
        },
      },
      {
        industry: 'financial',
        normalized: 'financial-services',
        expected: {
          lead: 'Lead',
          leadPlural: 'Leads',
          contact: 'Client',
          contactPlural: 'Clients',
          deal: 'Case',
          dealPlural: 'Cases',
          pipeline: 'Review Pipeline',
        },
      },
    ] as const

    cases.forEach(({ industry, normalized, expected }) => {
      if (normalized) {
        expect(normalizeIndustryKey(industry)).toBe(normalized)
      }
      expectIndustryTerms(industry, expected)
    })
  })

  it('falls back to canonical defaults for unknown or empty industries', () => {
    const cases = [undefined, null, '', 'unknown-industry', 'REAL_ESTATE', 'services'] as const

    cases.forEach((industry) => {
      expect(getTerm('lead', { industry })).toBe('Lead')
      expect(getPluralTerm('lead', { industry })).toBe('Leads')
      expect(getTerm('contact', { industry })).toBe('Contact')
      expect(getPluralTerm('contact', { industry })).toBe('Contacts')
      expect(getTerm('deal', { industry })).toBe('Deal')
      expect(getPluralTerm('deal', { industry })).toBe('Deals')
      expect(getTerm('pipeline', { industry })).toBe('Pipeline')
      expect(normalizeIndustryKey(industry)).toBeNull()
    })
  })

  it('applies tenant overrides before industry presets and defaults', () => {
    const cases = [
      {
        label: 'tenant override wins over industry',
        key: 'deal' as const,
        industry: 'healthcare',
        tenantTerm: 'Opportunity',
        tenantPlural: 'Opportunities',
        expectedTerm: 'Opportunity',
        expectedPlural: 'Opportunities',
      },
      {
        label: 'industry wins when tenant override absent',
        key: 'deal' as const,
        industry: 'healthcare',
        tenantTerm: undefined,
        tenantPlural: undefined,
        expectedTerm: 'Care Plan',
        expectedPlural: 'Care Plans',
      },
      {
        label: 'default wins when both tenant and industry absent',
        key: 'pipeline' as const,
        industry: undefined,
        tenantTerm: undefined,
        tenantPlural: undefined,
        expectedTerm: 'Pipeline',
        expectedPlural: 'Pipelines',
      },
    ] as const

    cases.forEach(
      ({ key, industry, tenantTerm, tenantPlural, expectedTerm, expectedPlural }) => {
        const tenantTerms = tenantTerm ? { [key]: tenantTerm } : undefined
        const tenantPluralTerms = tenantPlural ? { [key]: tenantPlural } : undefined

        expect(getTerm(key, { industry, tenantTerms })).toBe(expectedTerm)
        expect(getPluralTerm(key, { industry, tenantPluralTerms })).toBe(expectedPlural)
      }
    )
  })
})
