import { PATCH } from '@/apps/dashboard/app/api/website/sites/[id]/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(),
}))

jest.mock('@/lib/website-builder/repository', () => ({
  getWebsiteSiteById: jest.fn(),
  updateWebsiteSiteById: jest.fn(),
  findSiteBySlug: jest.fn(),
}))

const auth = jest.requireMock('@/lib/middleware/auth') as {
  requireModuleAccess: jest.Mock
}

const repository = jest.requireMock('@/lib/website-builder/repository') as {
  getWebsiteSiteById: jest.Mock
  updateWebsiteSiteById: jest.Mock
  findSiteBySlug: jest.Mock
}

function buildPatchRequest(body: Record<string, unknown>) {
  return {
    json: async () => body,
  } as any
}

describe('PATCH /api/website/sites/:id pageTree validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tenant-1' })
    repository.getWebsiteSiteById.mockResolvedValue({
      mode: 'landing-page-bridge',
      site: {
        id: 'site-1',
        slug: 'site-one',
        goalType: 'lead_generation',
      },
    })
    repository.findSiteBySlug.mockResolvedValue(null)
    repository.updateWebsiteSiteById.mockResolvedValue({
      mode: 'landing-page-bridge',
      record: {
        id: 'site-1',
        name: 'Site One',
        slug: 'site-one',
        status: 'DRAFT',
        updatedAt: new Date().toISOString(),
      },
    })
  })

  it('returns 400 when pageTree is empty', async () => {
    const res = await PATCH(buildPatchRequest({ pageTree: [] }), {
      params: Promise.resolve({ id: 'site-1' }),
    } as any)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid page tree payload')
    expect(body.details).toEqual(expect.arrayContaining(['At least one page is required.']))
    expect(repository.updateWebsiteSiteById).not.toHaveBeenCalled()
  })

  it('returns 400 when page slugs are duplicated (case-insensitive)', async () => {
    const res = await PATCH(
      buildPatchRequest({
        pageTree: [
          { title: 'Home', slug: 'home' },
          { title: 'About', slug: 'HOME' },
        ],
      }),
      {
        params: Promise.resolve({ id: 'site-1' }),
      } as any
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid page tree payload')
    expect(body.details).toEqual(expect.arrayContaining(['Duplicate slug "home" found. Slugs must be unique.']))
    expect(repository.updateWebsiteSiteById).not.toHaveBeenCalled()
  })

  it('returns 400 when a page title or slug is empty', async () => {
    const res = await PATCH(
      buildPatchRequest({
        pageTree: [
          { title: '', slug: 'home' },
          { title: 'Contact', slug: '' },
        ],
      }),
      {
        params: Promise.resolve({ id: 'site-1' }),
      } as any
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid page tree payload')
    expect(body.details).toEqual(
      expect.arrayContaining(['Page #1 title cannot be empty.', 'Page #2 slug cannot be empty.'])
    )
    expect(repository.updateWebsiteSiteById).not.toHaveBeenCalled()
  })

  it('returns stable ordered details contract for mixed validation issues', async () => {
    const res = await PATCH(
      buildPatchRequest({
        pageTree: [
          { title: '', slug: '' },
          { title: 'About', slug: 'about' },
          { title: 'Contact', slug: 'ABOUT' },
        ],
      }),
      {
        params: Promise.resolve({ id: 'site-1' }),
      } as any
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid page tree payload')
    expect(body.details).toEqual([
      'Page #1 title cannot be empty.',
      'Page #1 slug cannot be empty.',
      'Duplicate slug "about" found. Slugs must be unique.',
    ])
    expect(repository.updateWebsiteSiteById).not.toHaveBeenCalled()
  })

  it('accepts valid pageTree payload and updates site', async () => {
    const res = await PATCH(
      buildPatchRequest({
        pageTree: [
          { title: 'Home', slug: 'home', pageType: 'home' },
          { title: 'Contact', slug: 'contact', pageType: 'contact' },
        ],
      }),
      {
        params: Promise.resolve({ id: 'site-1' }),
      } as any
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe('site-1')
    expect(body.normalizedPageTree).toBe(true)
    expect(repository.updateWebsiteSiteById).toHaveBeenCalledTimes(1)
  })

  it('returns normalizedPageTree=false when patch does not include pageTree', async () => {
    const res = await PATCH(
      buildPatchRequest({
        name: 'Renamed Site',
        goalType: 'service_showcase',
      }),
      {
        params: Promise.resolve({ id: 'site-1' }),
      } as any
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe('site-1')
    expect(body.normalizedPageTree).toBe(false)
    expect(repository.updateWebsiteSiteById).toHaveBeenCalledTimes(1)
  })
})
