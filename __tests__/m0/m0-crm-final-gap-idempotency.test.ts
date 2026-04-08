import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createThreshold } from '@/apps/dashboard/app/api/crm/scoring/thresholds/route'
import { POST as renderTemplate } from '@/apps/dashboard/app/api/crm/templates/render/route'
import { POST as enrichContact } from '@/apps/dashboard/app/api/crm/contacts/enrich/route'
import { POST as promoteContact } from '@/apps/dashboard/app/api/crm/contacts/[id]/promote/route'
import { POST as processMeetingIntelligence } from '@/apps/dashboard/app/api/crm/interactions/[id]/meeting-intelligence/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

jest.mock('@/lib/ai/meeting-intelligence', () => ({
  processMeetingIntelligence: jest.fn(),
}))

jest.mock('@/lib/crm/template-variables', () => ({
  substituteVariables: jest.fn((template: string) => template),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    leadScoreThreshold: {
      create: jest.fn(),
    },
    emailTemplate: {
      findFirst: jest.fn(),
    },
    crmWhatsappTemplate: {
      findFirst: jest.fn(),
    },
    contact: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    interaction: {
      findFirst: jest.fn(),
    },
    deal: {
      findFirst: jest.fn(),
    },
  },
}))

describe('CRM final gap idempotency batch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates score threshold create with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_threshold_1',
      afterSnapshot: { threshold_id: 'thr_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/scoring/thresholds', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_threshold_1',
      },
      body: JSON.stringify({ minValue: 0, maxValue: 20, label: 'Cold' }),
    })
    const res = await createThreshold(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.leadScoreThreshold.create).not.toHaveBeenCalled()
  })

  it('deduplicates template render with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_render_1',
      afterSnapshot: { rendered: true },
    })

    const req = new NextRequest('http://localhost/api/crm/templates/render', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_render_1',
      },
      body: JSON.stringify({ channel: 'email', templateId: 'tpl_1' }),
    })
    const res = await renderTemplate(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.emailTemplate.findFirst).not.toHaveBeenCalled()
  })

  it('deduplicates contacts enrich with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_enrich_1',
      afterSnapshot: { enriched: true },
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/enrich', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_enrich_1',
      },
      body: JSON.stringify({ contactId: 'c_1' }),
    })
    const res = await enrichContact(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.contact.findFirst).not.toHaveBeenCalled()
  })

  it('deduplicates contact promote with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_promote_1',
      afterSnapshot: { promoted: true },
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/c_1/promote', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_promote_1',
      },
      body: JSON.stringify({ stage: 'customer' }),
    })
    const res = await promoteContact(req, { params: Promise.resolve({ id: 'c_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.contact.update).not.toHaveBeenCalled()
  })

  it('deduplicates meeting intelligence process with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const meeting = require('@/lib/ai/meeting-intelligence')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_meeting_intel_1',
      afterSnapshot: { processed: true },
    })

    const req = new NextRequest('http://localhost/api/crm/interactions/i_1/meeting-intelligence', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_meeting_intel_1',
      },
    })
    const res = await processMeetingIntelligence(req, { params: Promise.resolve({ id: 'i_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.interaction.findFirst).not.toHaveBeenCalled()
    expect(meeting.processMeetingIntelligence).not.toHaveBeenCalled()
  })
})
