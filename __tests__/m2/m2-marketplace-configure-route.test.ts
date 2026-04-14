import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/marketplace/apps/[id]/configure/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    marketplaceAppInstallation: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

function makeRequest(appId: string, body: unknown) {
  return new NextRequest(`http://localhost/api/marketplace/apps/${appId}/configure`, {
    method: 'POST',
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/marketplace/apps/[id]/configure (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('updates config and returns 200', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.marketplaceAppInstallation.findFirst.mockResolvedValue({
      id: 'inst_1',
      appId: 'webhook-connector',
      status: 'installed',
    })
    db.prisma.marketplaceAppInstallation.update.mockResolvedValue({
      id: 'inst_1',
      appId: 'webhook-connector',
      status: 'installed',
      config: { endpoint: 'https://updated.example.com' },
    })

    const res = await POST(makeRequest('webhook-connector', { config: { endpoint: 'https://updated.example.com' } }), {
      params: Promise.resolve({ id: 'webhook-connector' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.installation.appId).toBe('webhook-connector')
  })

  it('returns 404 when app is not installed', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.marketplaceAppInstallation.findFirst.mockResolvedValue(null)

    const res = await POST(makeRequest('nonexistent-app', { config: { key: 'val' } }), {
      params: Promise.resolve({ id: 'nonexistent-app' }),
    })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('NOT_INSTALLED')
  })

  it('returns 400 for missing config field', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })

    const res = await POST(makeRequest('any-app', {}), {
      params: Promise.resolve({ id: 'any-app' }),
    })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 500 on unexpected db error', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.marketplaceAppInstallation.findFirst.mockRejectedValue(new Error('db timeout'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(makeRequest('app', { config: { k: 'v' } }), {
      params: Promise.resolve({ id: 'app' }),
    })
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('db timeout')
    spy.mockRestore()
  })
})
