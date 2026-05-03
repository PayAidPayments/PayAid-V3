import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/conversations/[id]/messages/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/middleware/license', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    constructor(public featureName: string) {
      super(`Feature "${featureName}" is disabled`)
      this.name = 'TenantFeatureDisabledError'
    }
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    uniboxConversation: {
      findFirst: jest.fn(),
    },
    uniboxMessage: {
      findMany: jest.fn(),
    },
  },
}))

describe('GET /api/v1/conversations/:id/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 404 when conversation missing', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.uniboxConversation.findFirst.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/v1/conversations/c1/messages', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, { params: Promise.resolve({ id: 'c1' }) })
    expect(res.status).toBe(404)
  })

  it('returns chronological messages', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.uniboxConversation.findFirst.mockResolvedValue({ id: 'conv_db_1' })
    prisma.prisma.uniboxMessage.findMany.mockResolvedValue([
      {
        id: 'm1',
        direction: 'inbound',
        body: 'Hi',
        occurredAt: new Date('2026-04-07T10:00:00.000Z'),
        metadata: null,
      },
      {
        id: 'm2',
        direction: 'outbound',
        body: 'Hello',
        occurredAt: new Date('2026-04-07T10:01:00.000Z'),
        metadata: { author_user_id: 'u1' },
      },
    ])

    const req = new NextRequest('http://localhost/api/v1/conversations/conv_db_1/messages', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, { params: Promise.resolve({ id: 'conv_db_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.count).toBe(2)
    expect(body.messages[0].body).toBe('Hi')
    expect(body.messages[1].direction).toBe('outbound')
  })
})
