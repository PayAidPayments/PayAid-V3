import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/conversations/route'

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
      findMany: jest.fn(),
    },
  },
}))

function row(over: Partial<{ id: string; channel: string; status: string; ownerUserId: string | null }> = {}) {
  const id = over.id ?? 'ub1'
  const channel = over.channel ?? 'email'
  const status = over.status ?? 'open'
  const ownerUserId = over.ownerUserId ?? 'usr_1'
  return {
    id,
    tenantId: 'tn_1',
    threadKey: 'conv_1',
    channel,
    status,
    ownerUserId,
    tags: [] as string[],
    sentiment: null,
    slaDueAt: null,
    lastMessageAt: new Date('2026-04-07T12:00:00.000Z'),
    createdAt: new Date('2026-04-06T12:00:00.000Z'),
    updatedAt: new Date('2026-04-07T12:00:00.000Z'),
    messages: [
      {
        direction: 'inbound',
        body: 'Hello world',
        occurredAt: new Date('2026-04-07T12:00:00.000Z'),
        sourceIngestKey: 'idem_1',
      },
    ],
  }
}

describe('GET /api/v1/conversations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns mapped conversations and applies channel filter', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.uniboxConversation.findMany.mockResolvedValue([row({ channel: 'email' })])

    const req = new NextRequest('http://localhost/api/v1/conversations?channel=email', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.count).toBe(1)
    expect(body.conversations[0].channel).toBe('email')
  })

  it('filters by status', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.uniboxConversation.findMany.mockResolvedValue([row({ status: 'pending' })])

    const req = new NextRequest('http://localhost/api/v1/conversations?status=pending', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()
    expect(body.count).toBe(1)
    expect(body.conversations[0].status).toBe('pending')
  })

  it('filters by owner', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.uniboxConversation.findMany.mockResolvedValue([
      row({ id: 'a1', ownerUserId: 'agent_9' }),
      row({ id: 'a2', ownerUserId: 'agent_9' }),
    ])

    const req = new NextRequest('http://localhost/api/v1/conversations?owner=agent_9', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()
    expect(body.count).toBe(2)
  })
})
