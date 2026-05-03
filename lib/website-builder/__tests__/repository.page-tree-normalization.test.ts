jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    landingPage: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/website-builder/canonical-api-mode', () => ({
  isCanonicalWebsiteBuilderApiMode: jest.fn(() => false),
}))

import { updateWebsiteSiteById } from '@/lib/website-builder/repository'

const prismaMock = jest.requireMock('@/lib/db/prisma').prisma as {
  landingPage: {
    findFirst: jest.Mock
    update: jest.Mock
  }
}

describe('updateWebsiteSiteById pageTree normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.landingPage.findFirst.mockResolvedValue({
      id: 'site-1',
      tenantId: 'tenant-1',
      contentJson: {},
    })
    prismaMock.landingPage.update.mockResolvedValue({
      id: 'site-1',
      name: 'Site One',
      slug: 'site-one',
      status: 'DRAFT',
      updatedAt: new Date().toISOString(),
    })
  })

  it('normalizes slug and rewrites orderIndex deterministically', async () => {
    await updateWebsiteSiteById('tenant-1', 'site-1', {
      pageTree: [
        { title: 'Home', slug: ' Home Page ', orderIndex: 99 },
        { title: 'About', slug: 'about_us', orderIndex: -1 },
      ] as any,
    })

    expect(prismaMock.landingPage.update).toHaveBeenCalledTimes(1)
    const updateCall = prismaMock.landingPage.update.mock.calls[0][0]
    const persistedPages = updateCall.data.contentJson.pages

    expect(persistedPages).toEqual([
      expect.objectContaining({ slug: 'home-page', orderIndex: 0 }),
      expect.objectContaining({ slug: 'about-us', orderIndex: 1 }),
    ])
  })
})
