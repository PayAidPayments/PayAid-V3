import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/conversations/[id]/route'

jest.mock('@/lib/middleware/auth', () => ({
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
  },
}))

describe('GET /api/v1/conversations/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 404 when thread missing', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.uniboxConversation.findFirst.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/v1/conversations/x1', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, { params: Promise.resolve({ id: 'x1' }) })
    expect(res.status).toBe(404)
  })

  it('returns conversation detail with SLA fields', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.uniboxConversation.findFirst.mockResolvedValue({
      id: 'conv1',
      threadKey: 'thread_a',
      channel: 'email',
      status: 'open',
      ownerUserId: 'u1',
      tags: ['priority'],
      sentiment: 'neutral',
      slaDueAt: new Date('2099-01-01T00:00:00.000Z'),
      lastMessageAt: new Date('2026-04-07T12:00:00.000Z'),
      createdAt: new Date('2026-04-06T12:00:00.000Z'),
      updatedAt: new Date('2026-04-07T12:00:00.000Z'),
    })

    const req = new NextRequest('http://localhost/api/v1/conversations/conv1', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, { params: Promise.resolve({ id: 'conv1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.thread_key).toBe('thread_a')
    expect(body.sla.breached).toBe(false)
    expect(body.sla.due_in_seconds).not.toBeNull()
  })
})
