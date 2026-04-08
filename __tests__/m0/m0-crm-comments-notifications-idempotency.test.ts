import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { PUT as updateComment, DELETE as deleteComment } from '@/apps/dashboard/app/api/crm/comments/[id]/route'
import { POST as readNotification } from '@/apps/dashboard/app/api/crm/notifications/[id]/read/route'
import { POST as readAllNotifications } from '@/apps/dashboard/app/api/crm/notifications/read-all/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/middleware/license', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

jest.mock('@/lib/collaboration/comments', () => ({
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    salesRep: {
      findFirst: jest.fn(),
    },
    alert: {
      updateMany: jest.fn(),
    },
  },
}))

describe('CRM comments + notifications idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates comment update with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const comments = require('@/lib/collaboration/comments')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_comment_update_1',
      afterSnapshot: { comment_id: 'cmt_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/comments/cmt_1', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_comment_update_1',
      },
      body: JSON.stringify({ content: 'updated' }),
    })

    const res = await updateComment(req, { params: Promise.resolve({ id: 'cmt_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(comments.updateComment).not.toHaveBeenCalled()
  })

  it('deduplicates comment delete with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const comments = require('@/lib/collaboration/comments')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_comment_delete_1',
      afterSnapshot: { deleted: true },
    })

    const req = new NextRequest('http://localhost/api/crm/comments/cmt_1', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_comment_delete_1',
      },
    })

    const res = await deleteComment(req, { params: Promise.resolve({ id: 'cmt_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(comments.deleteComment).not.toHaveBeenCalled()
  })

  it('deduplicates single notification read with repeated idempotency key', async () => {
    const license = require('@/lib/middleware/license')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')

    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({ id: 'idem_notification_read_1' })

    const req = new NextRequest('http://localhost/api/crm/notifications/ntf_1/read', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_notification_read_1',
      },
    })

    const res = await readNotification(req, { params: Promise.resolve({ id: 'ntf_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.alert.updateMany).not.toHaveBeenCalled()
  })

  it('deduplicates read-all notifications with repeated idempotency key', async () => {
    const license = require('@/lib/middleware/license')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')

    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({ id: 'idem_notifications_read_all_1' })

    const req = new NextRequest('http://localhost/api/crm/notifications/read-all', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_notifications_read_all_1',
      },
    })

    const res = await readAllNotifications(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.alert.updateMany).not.toHaveBeenCalled()
  })
})
