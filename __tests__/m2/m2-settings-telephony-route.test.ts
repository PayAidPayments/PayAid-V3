import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/settings/telephony/route'

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/integrations/permissions', () => ({
  assertIntegrationPermission: jest.fn(),
  toPermissionDeniedResponse: jest.fn(() => null),
}), { virtual: true })

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    tenantTelephonySettings: {
      findUnique: jest.fn(),
    },
  },
}))

describe('GET /api/settings/telephony (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns not_applicable when provider is none', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    db.prisma.tenantTelephonySettings.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/settings/telephony', {
      method: 'GET',
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.webhookVerification.signatureVerification).toBe('not_applicable')
  })

  it('returns active for twilio when auth token exists', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    db.prisma.tenantTelephonySettings.findUnique.mockResolvedValue({
      provider: 'twilio',
      accountSid: 'AC123',
      authTokenEnc: 'enc:secret',
      apiKey: null,
      apiSecretEnc: null,
      apiBaseUrl: null,
      fromNumber: null,
      webhookBaseUrl: null,
      lastWebhookAt: null,
      lastWebhookProvider: 'twilio',
      lastWebhookCallSid: null,
      lastWebhookSignatureValid: true,
      isConfigured: true,
      lastTestAt: null,
      lastTestOk: true,
      lastTestError: null,
    })

    const req = new NextRequest('http://localhost/api/settings/telephony', {
      method: 'GET',
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.webhookVerification.signatureVerification).toBe('active')
    expect(json.webhookVerification.lastSignatureValid).toBe(true)
  })
})
