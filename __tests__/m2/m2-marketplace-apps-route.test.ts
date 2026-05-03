import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/marketplace/apps/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {},
}))

describe('GET /api/marketplace/apps (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns marketplace apps payload', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/marketplace/apps', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.apps)).toBe(true)
    expect(body.apps.length).toBeGreaterThan(0)
    expect(body.apps[0]).toHaveProperty('id')
    expect(body.apps[0]).toHaveProperty('name')
  })

  it('returns 500 when listing apps fails unexpectedly', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('apps list failed'))
    auth.handleLicenseError.mockReturnValueOnce(null)

    const req = new NextRequest('http://localhost/api/marketplace/apps', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('apps list failed')
  })
})
