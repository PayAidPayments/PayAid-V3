import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createCampaign } from '@/apps/dashboard/app/api/crm/sales-automation/campaigns/route'
import { POST as qualifyLead } from '@/apps/dashboard/app/api/crm/leads/qualify/route'
import { POST as convertLead } from '@/apps/dashboard/app/api/crm/leads/convert/route'
import { POST as createTaskProxy } from '@/apps/dashboard/app/api/crm/tasks/route'
import { POST as createDealProxy } from '@/apps/dashboard/app/api/crm/deals/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  authenticateRequest: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

jest.mock('@/lib/crm/lead-qualification', () => ({
  qualifyLead: jest.fn(),
  batchQualifyLeads: jest.fn(),
}))

jest.mock('@/packages/auth-sdk/client', () => ({
  getSessionToken: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    contact: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

describe('CRM lead and proxy hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates campaign create with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_campaign_1',
      afterSnapshot: { campaign_id: 'campaign_existing' },
    })

    const req = new NextRequest('http://localhost/api/crm/sales-automation/campaigns', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_campaign_1',
      },
      body: JSON.stringify({ name: 'Campaign', type: 'cold-email' }),
    })

    const res = await createCampaign(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
  })

  it('deduplicates lead qualification with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const qualification = require('@/lib/crm/lead-qualification')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_qualify_1',
      afterSnapshot: { processed: true },
    })

    const req = new NextRequest('http://localhost/api/crm/leads/qualify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_qualify_1',
      },
      body: JSON.stringify({ contactId: 'lead_1' }),
    })

    const res = await qualifyLead(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(qualification.qualifyLead).not.toHaveBeenCalled()
  })

  it('deduplicates lead convert with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    auth.authenticateRequest.mockResolvedValue({ userId: 'usr_1', tenantId: 'tn_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_convert_1',
      afterSnapshot: { lead_id: 'lead_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/leads/convert', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_convert_1',
      },
      body: JSON.stringify({ leadId: 'lead_1' }),
    })

    const res = await convertLead(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.$transaction).not.toHaveBeenCalled()
  })

  it('forwards x-idempotency-key in task proxy POST', async () => {
    const authSdk = require('@/packages/auth-sdk/client')
    authSdk.getSessionToken.mockResolvedValue('token_1')
    ;(global as any).fetch = jest.fn().mockResolvedValue({
      status: 201,
      json: async () => ({ id: 'task_1' }),
    })

    const req = new NextRequest('http://localhost/api/crm/tasks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-idempotency-key': 'dup_task_1',
      },
      body: JSON.stringify({ title: 'Call customer' }),
    })

    const res = await createTaskProxy(req)
    expect(res.status).toBe(201)
    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-idempotency-key': 'dup_task_1',
        }),
      })
    )
  })

  it('forwards x-idempotency-key in deal proxy POST', async () => {
    const authSdk = require('@/packages/auth-sdk/client')
    authSdk.getSessionToken.mockResolvedValue('token_1')
    ;(global as any).fetch = jest.fn().mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({ id: 'deal_1', status: 'open' }),
    })

    const req = new NextRequest('http://localhost/api/crm/deals', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-idempotency-key': 'dup_deal_1',
      },
      body: JSON.stringify({ name: 'New deal' }),
    })

    const res = await createDealProxy(req)
    expect(res.status).toBe(201)
    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/deals'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-idempotency-key': 'dup_deal_1',
        }),
      })
    )
  })
})
