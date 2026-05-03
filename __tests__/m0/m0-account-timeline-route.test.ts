import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getAccountTimeline } from '@/apps/dashboard/app/api/crm/accounts/[id]/timeline/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((err: unknown) => err),
}))

jest.mock('@/lib/crm/resolve-crm-request-tenant', () => ({
  resolveCrmRequestTenantId: jest.fn(),
}))

jest.mock('@/lib/crm/unified-account-timeline', () => ({
  buildUnifiedAccountTimeline: jest.fn(),
}))

describe('crm account timeline route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns account timeline payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')
    const timeline = require('@/lib/crm/unified-account-timeline')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')
    timeline.buildUnifiedAccountTimeline.mockResolvedValue({
      activities: [{ id: 'a_1', type: 'email', title: 'Email', createdAt: new Date().toISOString(), metadata: {} }],
    })

    const req = new NextRequest('http://localhost/api/crm/accounts/acct_1/timeline?limit=50', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getAccountTimeline(req, { params: Promise.resolve({ id: 'acct_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.activities).toHaveLength(1)
    expect(timeline.buildUnifiedAccountTimeline).toHaveBeenCalledWith({
      tenantId: 'tn_1',
      accountId: 'acct_1',
      limit: 50,
    })
  })

  it('returns 400 for invalid limit', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')

    const req = new NextRequest('http://localhost/api/crm/accounts/acct_1/timeline?limit=0', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getAccountTimeline(req, { params: Promise.resolve({ id: 'acct_1' }) })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Invalid limit')
  })

  it('returns 404 when account is not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')
    const timeline = require('@/lib/crm/unified-account-timeline')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')
    timeline.buildUnifiedAccountTimeline.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/crm/accounts/acct_missing/timeline', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getAccountTimeline(req, { params: Promise.resolve({ id: 'acct_missing' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Account not found')
  })

  it('returns 500 on unexpected errors', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenantResolver = require('@/lib/crm/resolve-crm-request-tenant')
    const timeline = require('@/lib/crm/unified-account-timeline')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_jwt', userId: 'usr_1' })
    tenantResolver.resolveCrmRequestTenantId.mockResolvedValue('tn_1')
    timeline.buildUnifiedAccountTimeline.mockRejectedValue(new Error('boom'))

    const req = new NextRequest('http://localhost/api/crm/accounts/acct_1/timeline', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getAccountTimeline(req, { params: Promise.resolve({ id: 'acct_1' }) })
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to load account timeline')
  })
})
