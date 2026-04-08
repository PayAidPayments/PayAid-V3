import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/apps/dashboard/app/api/developer/marketplace/apps/route'

jest.mock('@/lib/middleware/license', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {},
}))

describe('GET /api/developer/marketplace/apps (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns developer marketplace apps payload', async () => {
    const license = require('@/lib/middleware/license')
    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/developer/marketplace/apps', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.apps)).toBe(true)
    expect(body.apps.length).toBeGreaterThan(0)
    expect(body.apps[0]).toHaveProperty('id')
    expect(body.apps[0]).toHaveProperty('name')
    expect(license.requireModuleAccess).toHaveBeenCalledWith(req, 'api-integration-hub')
  })
})

describe('POST /api/developer/marketplace/apps (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('installs app and returns 201', async () => {
    const license = require('@/lib/middleware/license')
    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/developer/marketplace/apps', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ appId: 'zapier' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.installation.appId).toBe('zapier')
    expect(body.installation.tenantId).toBe('tn_m2')
    expect(body.installation.status).toBe('active')
  })

  it('returns 400 when appId is missing', async () => {
    const license = require('@/lib/middleware/license')
    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/developer/marketplace/apps', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('App ID is required')
  })
})
