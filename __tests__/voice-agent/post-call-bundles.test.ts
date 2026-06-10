import {
  marketingHotLeadMinScore,
  qualifiesAsMarketingHotLead,
  readBundleIdsFromMetadata,
} from '@/lib/voice-agent/bundles/post-call-bundles'

describe('post-call cross-module bundles', () => {
  it('readBundleIdsFromMetadata merges trigger and contact metadata', () => {
    const ids = readBundleIdsFromMetadata({
      triggerContext: { invoiceId: 'inv-1' },
      contactMetadata: { caseId: 'case-9' },
      dealId: 'deal-3',
    })
    expect(ids.invoiceId).toBe('inv-1')
    expect(ids.caseId).toBe('case-9')
    expect(ids.dealId).toBe('deal-3')
  })

  it('qualifies hot leads at or above threshold', () => {
    process.env.VOICE_MARKETING_HOT_LEAD_MIN_SCORE = '70'
    expect(qualifiesAsMarketingHotLead(85)).toBe(true)
    expect(qualifiesAsMarketingHotLead(50)).toBe(false)
    expect(qualifiesAsMarketingHotLead(null)).toBe(true)
  })

  it('marketingHotLeadMinScore defaults to 70', () => {
    delete process.env.VOICE_MARKETING_HOT_LEAD_MIN_SCORE
    expect(marketingHotLeadMinScore()).toBe(70)
  })
})
