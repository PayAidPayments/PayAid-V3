import { buildQueryStringWithUpdates } from '@/lib/url/query-state'

describe('buildQueryStringWithUpdates', () => {
  it('sets new query params from an empty query', () => {
    const result = buildQueryStringWithUpdates('', {
      page: '2',
      limit: '20',
      status: 'OPEN',
    })

    expect(result).toBe('page=2&limit=20&status=OPEN')
  })

  it('updates existing params while preserving untouched keys', () => {
    const result = buildQueryStringWithUpdates('page=1&limit=20&tab=overview', {
      page: '3',
      status: 'PAID',
    })

    expect(result).toBe('page=3&limit=20&tab=overview&status=PAID')
  })

  it('removes keys when value is null, undefined, or empty string', () => {
    const result = buildQueryStringWithUpdates('page=1&status=DRAFT&category=Travel', {
      status: null,
      category: '',
      page: undefined,
    })

    expect(result).toBe('')
  })
})
