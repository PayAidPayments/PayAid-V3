import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/settings/social/connect/route'

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/integrations/permissions', () => ({
  assertIntegrationPermission: jest.fn(),
  toPermissionDeniedResponse: jest.fn(() => null),
}), { virtual: true })

jest.mock('@/lib/encryption', () => ({
  encrypt: jest.fn((v: string) => `enc:${v}`),
}))

jest.mock('@/lib/integrations/audit', () => ({
  writeIntegrationAudit: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    oAuthIntegration: {
      upsert: jest.fn(),
    },
  },
}))

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/settings/social/connect', {
    method: 'POST',
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/settings/social/connect (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue(null)

    const res = await POST(makeRequest({ provider: 'facebook', accessToken: 'abcdefghijklm' }))
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('upserts provider token and returns 200', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    db.prisma.oAuthIntegration.upsert.mockResolvedValue({
      provider: 'facebook',
      updatedAt: new Date('2026-04-09T12:00:00.000Z'),
      expiresAt: new Date('2026-05-09T12:00:00.000Z'),
      providerName: 'Acme FB',
      providerEmail: 'social@acme.test',
    })

    const res = await POST(
      makeRequest({
        provider: 'facebook',
        accessToken: 'abcdefghijklm',
        providerName: 'Acme FB',
        providerEmail: 'social@acme.test',
        expiresInSeconds: 3600,
      })
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.provider).toBe('facebook')
    expect(db.prisma.oAuthIntegration.upsert).toHaveBeenCalledTimes(1)
  })

  it('returns 400 on invalid payload', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })

    const res = await POST(makeRequest({ provider: 'facebook', accessToken: 'short' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Validation error')
  })
})
