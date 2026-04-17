import {
  isExactLookupQuery,
  normalizeSearchQuery,
  shouldRunServerSearch,
} from '@/lib/search/query-normalization'

describe('query-normalization helpers', () => {
  it('trims and collapses repeated spaces', () => {
    expect(normalizeSearchQuery('  rohit   sharma  ')).toBe('rohit sharma')
    expect(normalizeSearchQuery('   ')).toBe('')
  })

  it('detects exact lookup patterns', () => {
    expect(isExactLookupQuery('user@example.com')).toBe(true)
    expect(isExactLookupQuery('+91 98765 43210')).toBe(true)
    expect(isExactLookupQuery('cmjptk2mw0000aocw31u48n64')).toBe(true)
    expect(isExactLookupQuery('ro')).toBe(false)
  })

  it('enforces min chars for generic terms', () => {
    expect(shouldRunServerSearch('', 2)).toBe(false)
    expect(shouldRunServerSearch('a', 2)).toBe(false)
    expect(shouldRunServerSearch('ro', 2)).toBe(true)
    expect(shouldRunServerSearch('a@b.co', 2)).toBe(true)
  })
})

