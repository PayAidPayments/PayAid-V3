import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createComment } from '@/apps/dashboard/app/api/crm/comments/route'
import { GET as listCommunications, POST as createCommunication } from '@/apps/dashboard/app/api/crm/communications/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

jest.mock('@/lib/collaboration/comments', () => ({
  createComment: jest.fn(),
  getComments: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    salesRep: {
      findUnique: jest.fn(),
    },
    interaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    contact: {
      findFirst: jest.fn(),
    },
  },
}))

describe('CRM idempotency and tenant hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates crm comments create when x-idempotency-key repeats', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const comments = require('@/lib/collaboration/comments')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_comment_1',
      afterSnapshot: { comment_id: 'cmt_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/comments', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_comment_1',
      },
      body: JSON.stringify({
        content: 'hello',
        entityType: 'deal',
        entityId: 'deal_1',
      }),
    })

    const res = await createComment(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.data.id).toBe('cmt_1')
    expect(comments.createComment).not.toHaveBeenCalled()
  })

  it('deduplicates crm communications create when x-idempotency-key repeats', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_comm_1',
      afterSnapshot: { communication_id: 'int_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/communications', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_comm_1',
      },
      body: JSON.stringify({
        organizationId: 'tn_1',
        channel: 'email',
        direction: 'outbound',
        senderContactId: '5a4e1778-3605-450a-b1bf-fd43fd96f9db',
        senderName: 'Alice',
        senderAddress: 'alice@example.com',
        message: 'Test',
      }),
    })

    const res = await createCommunication(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.data.id).toBe('int_1')
    expect(prisma.prisma.interaction.create).not.toHaveBeenCalled()
  })

  it('rejects organizationId mismatch against authenticated tenant', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/crm/communications?organizationId=tn_2', {
      method: 'GET',
      headers: { authorization: 'Bearer token' },
    })

    const res = await listCommunications(req)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error?.code).toBe('TENANT_MISMATCH')
  })
})
