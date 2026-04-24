import { proxy } from '@/apps/dashboard/proxy'

function createRequest(pathWithQuery: string) {
  const url = new URL(`https://example.com${pathWithQuery}`)
  return {
    nextUrl: {
      ...url,
      clone: () => new URL(url.toString()),
      pathname: url.pathname,
      search: url.search,
    },
    headers: {
      get: jest.fn(() => null),
    },
    cookies: {
      get: jest.fn(() => undefined),
    },
  } as any
}

describe('dashboard proxy sales route canonicalization', () => {
  it('redirects legacy Landing-Pages list to canonical Sales-Pages', () => {
    const request = createRequest('/sales/demo/Landing-Pages')
    const response = proxy(request)

    expect(response.headers.get('location')).toBe('https://example.com/sales/demo/Sales-Pages')
  })

  it('redirects legacy detail route and preserves query params', () => {
    const request = createRequest('/sales/demo/Landing-Pages/page-123?status=DRAFT&view=full')
    const response = proxy(request)

    expect(response.headers.get('location')).toBe(
      'https://example.com/sales/demo/Sales-Pages/page-123?status=DRAFT&view=full'
    )
  })

  it('does not redirect canonical Sales-Pages route', () => {
    const request = createRequest('/sales/demo/Sales-Pages')
    const response = proxy(request)

    expect(response.headers.get('location')).toBeNull()
  })
})
