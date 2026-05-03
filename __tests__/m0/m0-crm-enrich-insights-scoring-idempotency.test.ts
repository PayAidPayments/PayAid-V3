import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as enrichContact } from '@/apps/dashboard/app/api/crm/contacts/[id]/enrich/route'
import { POST as refreshInsights } from '@/apps/dashboard/app/api/crm/contacts/[id]/insights/route'
import { POST as scoreLead } from '@/apps/dashboard/app/api/crm/leads/[id]/score/route'
import { POST as createScoringRule } from '@/apps/dashboard/app/api/crm/scoring/rules/route'

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

jest.mock('@/lib/ai/customer-insights', () => ({
  generateCustomerInsights: jest.fn(),
  saveCustomerInsights: jest.fn(),
}))

jest.mock('@/lib/ai/lead-scoring', () => ({
  calculateLeadScore: jest.fn(),
  updateLeadScore: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    contact: {
      findFirst: jest.fn(),
    },
    customerInsight: {
      findUnique: jest.fn(),
    },
    leadScoreRule: {
      create: jest.fn(),
    },
  },
}))

describe('CRM enrich/insights/scoring idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates contact enrich with repeated idempotency key', async () => {
    const license = require('@/lib/middleware/license')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')
    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_contact_enrich_1',
      afterSnapshot: { enriched: true },
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/c_1/enrich', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_contact_enrich_1',
      },
    })

    const res = await enrichContact(req, { params: Promise.resolve({ id: 'c_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.contact.findFirst).not.toHaveBeenCalled()
  })

  it('deduplicates insights refresh with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const insights = require('@/lib/ai/customer-insights')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_insights_refresh_1',
      afterSnapshot: { refreshed: true },
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/c_1/insights', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_insights_refresh_1',
      },
      body: JSON.stringify({}),
    })

    const res = await refreshInsights(req, { params: Promise.resolve({ id: 'c_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(insights.generateCustomerInsights).not.toHaveBeenCalled()
  })

  it('deduplicates lead scoring with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const scoring = require('@/lib/ai/lead-scoring')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_lead_score_1',
      afterSnapshot: { scored: true },
    })

    const req = new NextRequest('http://localhost/api/crm/leads/l_1/score', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_lead_score_1',
      },
    })

    const res = await scoreLead(req, { params: Promise.resolve({ id: 'l_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(scoring.calculateLeadScore).not.toHaveBeenCalled()
  })

  it('deduplicates scoring rule create with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_scoring_rule_create_1',
      afterSnapshot: { rule_id: 'rule_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/scoring/rules', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_scoring_rule_create_1',
      },
      body: JSON.stringify({
        key: 'website_visit',
        category: 'engagement',
        weight: 15,
      }),
    })

    const res = await createScoringRule(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.leadScoreRule.create).not.toHaveBeenCalled()
  })
})
