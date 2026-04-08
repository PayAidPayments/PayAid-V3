import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/marketplace/apps/install/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    marketplaceAppInstallation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('POST /api/marketplace/apps/install (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('installs app and returns 201 payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.marketplaceAppInstallation.findFirst.mockResolvedValue(null)
    db.prisma.marketplaceAppInstallation.create.mockResolvedValue({
      id: 'inst_1',
      appId: 'webhook-connector',
      status: 'installed',
      installedAt: new Date('2026-04-08T00:00:00.000Z'),
    })

    const req = new NextRequest('http://localhost/api/marketplace/apps/install', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ appId: 'webhook-connector', config: { endpoint: 'https://example.com' } }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.installation.id).toBe('inst_1')
    expect(body.installation.appId).toBe('webhook-connector')
    expect(body.installation.status).toBe('installed')
  })

  it('returns 400 when app is already installed', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.marketplaceAppInstallation.findFirst.mockResolvedValue({
      id: 'inst_existing',
      tenantId: 'tn_m2',
      appId: 'webhook-connector',
    })

    const req = new NextRequest('http://localhost/api/marketplace/apps/install', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ appId: 'webhook-connector', config: {} }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('App is already installed')
  })
})
