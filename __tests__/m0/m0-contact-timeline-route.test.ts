import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getContactTimeline } from '@/apps/dashboard/app/api/crm/contacts/[id]/timeline/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((err: unknown) => err),
}))

jest.mock('@/lib/crm/resolve-crm-request-tenant', () => ({
  resolveCrmRequestTenantId: jest.fn(),
}))

jest.mock('@/lib/crm/unified-contact-timeline', () => ({
  buildUnifiedContactTimeline: jest.fn(),
}))

describe('crm contact timeline route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns contact timeline payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')
    const timeline = require('@/lib/crm/unified-contact-timeline')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')
    timeline.buildUnifiedContactTimeline.mockResolvedValue({
      activities: [{ id: 'a_1', type: 'email', title: 'Email', createdAt: new Date().toISOString(), metadata: {} }],
      deals: [{ id: 'd_1', name: 'Deal', value: 1000, stage: 'lead', createdAt: new Date().toISOString() }],
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/ct_1/timeline?limit=40', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getContactTimeline(req, { params: Promise.resolve({ id: 'ct_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.activities).toHaveLength(1)
    expect(body.deals).toHaveLength(1)
    expect(timeline.buildUnifiedContactTimeline).toHaveBeenCalledWith({
      tenantId: 'tn_1',
      contactId: 'ct_1',
      limit: 40,
    })
  })

  it('returns 400 for invalid limit', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')

    const req = new NextRequest('http://localhost/api/crm/contacts/ct_1/timeline?limit=0', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getContactTimeline(req, { params: Promise.resolve({ id: 'ct_1' }) })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Invalid limit')
  })

  it('returns 404 when contact is not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')
    const timeline = require('@/lib/crm/unified-contact-timeline')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')
    timeline.buildUnifiedContactTimeline.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/crm/contacts/ct_missing/timeline', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getContactTimeline(req, { params: Promise.resolve({ id: 'ct_missing' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Contact not found')
  })
})
