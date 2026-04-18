import {
  buildPayaidSourcePayload,
  computeInboundLeadScoreV1,
  normalizeInboundContactFields,
  normalizeSourceAttribution,
  trimEmail,
  trimPhone,
} from '@/lib/crm/inbound-orchestration/source-normalize'

describe('trimEmail / trimPhone', () => {
  it('normalizes empty and casing', () => {
    expect(trimEmail('  A@B.COM  ')).toBe('a@b.com')
    expect(trimEmail('')).toBeUndefined()
    expect(trimPhone('  +91 98765  ')).toBe('+91 98765')
    expect(trimPhone('')).toBeUndefined()
  })
})

describe('normalizeInboundContactFields', () => {
  it('trims identifiers and defaults unknown name', () => {
    const out = normalizeInboundContactFields({
      name: '  Jane  ',
      email: 'X@Y.COM',
      phone: ' 999 ',
      company: ' Acme ',
      tags: [' a ', 'b'],
    })
    expect(out.name).toBe('Jane')
    expect(out.email).toBe('x@y.com')
    expect(out.phone).toBe('999')
    expect(out.company).toBe('Acme')
    expect(out.tags).toEqual(['a', 'b'])
  })
})

describe('normalizeSourceAttribution', () => {
  it('trims channels and fills capturedAt', () => {
    const s = normalizeSourceAttribution({
      sourceChannel: ' web_form ',
      sourceCampaign: ' Q1 ',
    })
    expect(s.sourceChannel).toBe('web_form')
    expect(s.sourceCampaign).toBe('Q1')
    expect(s.capturedAt).toBeDefined()
  })
})

describe('computeInboundLeadScoreV1', () => {
  it('scores completeness and optional intent', () => {
    const full = computeInboundLeadScoreV1(
      {
        name: 'x',
        email: 'a@b.com',
        phone: '1',
        company: 'c',
        city: 'Pune',
      },
      undefined
    )
    expect(full).toBeGreaterThan(20)
    const emailOnly = computeInboundLeadScoreV1({ name: 'x', email: 'a@b.com' }, undefined)
    const withIntent = computeInboundLeadScoreV1({ name: 'x', email: 'a@b.com' }, { intentScore: 10 })
    expect(withIntent).toBeGreaterThan(emailOnly)
    expect(withIntent).toBe(emailOnly + 10)
  })
})

describe('buildPayaidSourcePayload', () => {
  it('merges payaidSource and caps history', () => {
    const first = buildPayaidSourcePayload(
      normalizeSourceAttribution({ sourceChannel: 'a', sourceRef: '1' }),
      undefined
    )
    const second = buildPayaidSourcePayload(
      normalizeSourceAttribution({ sourceChannel: 'b', sourceRef: '2' }),
      first
    )
    expect(second.payaidSource.sourceChannel).toBe('b')
    expect(Array.isArray(second.payaidInboundHistory)).toBe(true)
    expect((second.payaidInboundHistory as unknown[]).length).toBe(2)
  })
})
