import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/apps/dashboard/app/api/marketplace/apps/[id]/reviews/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  // Return null so ZodError (and other non-license errors) fall through to route handlers.
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    marketplaceAppReview: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    marketplaceAppInstallation: {
      findUnique: jest.fn(),
    },
    marketplaceApp: {
      update: jest.fn(),
    },
  },
}))

const appId = 'webhook-connector'
const ctx = { params: Promise.resolve({ id: appId }) }

describe('GET /api/marketplace/apps/[id]/reviews (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns reviews payload with averages', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.marketplaceAppReview.findMany.mockResolvedValue([
      { rating: 4, createdAt: new Date(), user: null, tenant: null },
      { rating: 5, createdAt: new Date(), user: null, tenant: null },
    ])

    const req = new NextRequest(`http://localhost/api/marketplace/apps/${appId}/reviews`, {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.reviews).toHaveLength(2)
    expect(body.totalReviews).toBe(2)
    expect(body.averageRating).toBe(4.5)
    expect(db.prisma.marketplaceAppReview.findMany).toHaveBeenCalled()
  })

  it('returns 500 when fetching reviews fails unexpectedly', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.marketplaceAppReview.findMany.mockRejectedValue(new Error('reviews read failed'))

    const req = new NextRequest(`http://localhost/api/marketplace/apps/${appId}/reviews`, {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('reviews read failed')
  })
})

describe('POST /api/marketplace/apps/[id]/reviews (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates review and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.marketplaceAppReview.findUnique.mockResolvedValue(null)
    db.prisma.marketplaceAppInstallation.findUnique.mockResolvedValue(null)
    db.prisma.marketplaceAppReview.create.mockResolvedValue({
      id: 'rev_1',
      appId,
      tenantId: 'tn_m2',
      userId: 'usr_1',
      rating: 5,
      title: 'Great',
      comment: null,
      isVerified: false,
    })
    db.prisma.marketplaceAppReview.findMany.mockResolvedValue([{ rating: 5 }])
    db.prisma.marketplaceApp.update.mockResolvedValue({})

    const req = new NextRequest(`http://localhost/api/marketplace/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ rating: 5, title: 'Great' }),
    })
    const res = await POST(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.review.id).toBe('rev_1')
    expect(body.review.rating).toBe(5)
  })

  it('returns 400 for validation error', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })

    const req = new NextRequest(`http://localhost/api/marketplace/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 400 when user already reviewed', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.marketplaceAppReview.findUnique.mockResolvedValue({ id: 'existing' })

    const req = new NextRequest(`http://localhost/api/marketplace/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ rating: 4 }),
    })
    const res = await POST(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('You have already reviewed this app')
  })
})
