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

  it('returns 403 when module access is denied', async () => {
    const license = require('@/lib/middleware/license')
    license.requireModuleAccess.mockRejectedValue({ moduleId: 'api-integration-hub' })
    license.handleLicenseError.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
    )

    const req = new NextRequest('http://localhost/api/developer/marketplace/apps', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ appId: 'zapier' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })

  it('returns 500 when install fails unexpectedly', async () => {
    const license = require('@/lib/middleware/license')
    license.requireModuleAccess.mockRejectedValue(new Error('db down'))
    license.handleLicenseError.mockReturnValueOnce(null)
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = new NextRequest('http://localhost/api/developer/marketplace/apps', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ appId: 'zapier' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to install app')
    consoleSpy.mockRestore()
  })
})
