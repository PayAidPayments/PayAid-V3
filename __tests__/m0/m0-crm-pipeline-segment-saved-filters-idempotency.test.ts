import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createPipeline } from '@/apps/dashboard/app/api/crm/pipelines/route'
import { POST as createSegment } from '@/apps/dashboard/app/api/crm/segments/route'
import { POST as createSavedFilter } from '@/apps/dashboard/app/api/crm/saved-filters/route'
import {
  PUT as updateSavedFilter,
  DELETE as deleteSavedFilter,
} from '@/apps/dashboard/app/api/crm/saved-filters/[id]/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  authenticateRequest: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    segment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    contact: {
      count: jest.fn(),
    },
    savedFilter: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    deal: {
      findMany: jest.fn(),
    },
  },
}))

describe('CRM pipeline/segment/saved-filter idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates pipeline create with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_pipeline_1',
      afterSnapshot: { pipeline_id: 'pipeline_existing' },
    })

    const req = new NextRequest('http://localhost/api/crm/pipelines', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_pipeline_1',
      },
      body: JSON.stringify({
        organizationId: 'tn_1',
        name: 'Pipeline',
        stages: [{ name: 'Lead', order: 0, probability: 10 }],
      }),
    })

    const res = await createPipeline(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.deal.findMany).not.toHaveBeenCalled()
  })

  it('deduplicates segment create with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_segment_1',
      afterSnapshot: { segment_id: 'segment_existing' },
    })

    const req = new NextRequest('http://localhost/api/crm/segments', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_segment_1',
      },
      body: JSON.stringify({
        organizationId: 'tn_1',
        name: 'High intent',
        criteria: [{ field: 'status', operator: 'equals', value: 'active' }],
      }),
    })

    const res = await createSegment(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.segment.create).not.toHaveBeenCalled()
  })

  it('deduplicates saved-filter create with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    auth.authenticateRequest.mockResolvedValue({ userId: 'usr_1', tenantId: 'tn_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_saved_filter_create_1',
      afterSnapshot: { saved_filter_id: 'sf_existing' },
    })

    const req = new NextRequest('http://localhost/api/crm/saved-filters', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_saved_filter_create_1',
      },
      body: JSON.stringify({
        name: 'My Filter',
        entityType: 'lead',
        filters: { status: 'active' },
      }),
    })

    const res = await createSavedFilter(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.savedFilter.create).not.toHaveBeenCalled()
  })

  it('deduplicates saved-filter update with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    auth.authenticateRequest.mockResolvedValue({ userId: 'usr_1', tenantId: 'tn_1' })
    prisma.prisma.savedFilter.findFirst.mockResolvedValue({
      id: 'sf_1',
      tenantId: 'tn_1',
      userId: 'usr_1',
      entityType: 'lead',
    })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_saved_filter_update_1',
      afterSnapshot: { saved_filter_id: 'sf_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/saved-filters/sf_1', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_saved_filter_update_1',
      },
      body: JSON.stringify({
        name: 'Updated Filter',
      }),
    })

    const res = await updateSavedFilter(req, { params: Promise.resolve({ id: 'sf_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.savedFilter.update).not.toHaveBeenCalled()
  })

  it('deduplicates saved-filter delete with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    auth.authenticateRequest.mockResolvedValue({ userId: 'usr_1', tenantId: 'tn_1' })
    prisma.prisma.savedFilter.findFirst.mockResolvedValue({
      id: 'sf_1',
      tenantId: 'tn_1',
      userId: 'usr_1',
      entityType: 'lead',
    })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_saved_filter_delete_1',
      afterSnapshot: { deleted: true },
    })

    const req = new NextRequest('http://localhost/api/crm/saved-filters/sf_1', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_saved_filter_delete_1',
      },
    })

    const res = await deleteSavedFilter(req, { params: Promise.resolve({ id: 'sf_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.savedFilter.delete).not.toHaveBeenCalled()
  })
})
