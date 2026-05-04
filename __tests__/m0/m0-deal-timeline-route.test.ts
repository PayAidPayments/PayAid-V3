import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getDealTimeline } from '@/apps/dashboard/app/api/crm/deals/[id]/timeline/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((err: unknown) => err),
}))

jest.mock('@/lib/crm/resolve-crm-request-tenant', () => ({
  resolveCrmRequestTenantId: jest.fn(),
}))

jest.mock('@/lib/crm/unified-deal-timeline', () => ({
  buildUnifiedDealTimeline: jest.fn(),
}))

describe('crm deal timeline route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns deal timeline payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')
    const timeline = require('@/lib/crm/unified-deal-timeline')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')
    timeline.buildUnifiedDealTimeline.mockResolvedValue({
      events: [{ id: 'e_1', type: 'deal_created', title: 'Deal created', createdAt: new Date().toISOString() }],
    })

    const req = new NextRequest('http://localhost/api/crm/deals/deal_1/timeline?limit=55', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getDealTimeline(req, { params: Promise.resolve({ id: 'deal_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.events).toHaveLength(1)
    expect(timeline.buildUnifiedDealTimeline).toHaveBeenCalledWith({
      tenantId: 'tn_1',
      dealId: 'deal_1',
      limit: 55,
    })
  })

  it('returns 400 for invalid limit', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')

    const req = new NextRequest('http://localhost/api/crm/deals/deal_1/timeline?limit=-1', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getDealTimeline(req, { params: Promise.resolve({ id: 'deal_1' }) })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Invalid limit')
  })

  it('returns 404 when deal is not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')
    const timeline = require('@/lib/crm/unified-deal-timeline')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')
    timeline.buildUnifiedDealTimeline.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/crm/deals/deal_missing/timeline', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getDealTimeline(req, { params: Promise.resolve({ id: 'deal_missing' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Deal not found')
  })
})
