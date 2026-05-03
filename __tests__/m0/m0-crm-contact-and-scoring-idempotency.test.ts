import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { PATCH as updateContact, DELETE as archiveContact } from '@/apps/dashboard/app/api/crm/contacts/[id]/route'
import { PATCH as updateScoringRule } from '@/apps/dashboard/app/api/crm/scoring/rules/[id]/route'
import { PUT as updateRecordingConsent } from '@/apps/dashboard/app/api/crm/contacts/[id]/recording-consent/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

jest.mock('@/lib/audit-log-crm', () => ({
  logCrmAudit: jest.fn(),
}))

jest.mock('@/lib/telephony/call-recording', () => ({
  updateRecordingConsent: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    contact: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    leadScoreRule: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

describe('CRM contact and scoring idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates contact update with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_contact_patch_1',
      afterSnapshot: { contact_id: 'c_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/c_1', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_contact_patch_1',
      },
      body: JSON.stringify({ firstName: 'A' }),
    })

    const res = await updateContact(req, { params: Promise.resolve({ id: 'c_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.contact.update).not.toHaveBeenCalled()
  })

  it('deduplicates contact archive with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_contact_delete_1',
      afterSnapshot: { archived: true },
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/c_1', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_contact_delete_1',
      },
    })

    const res = await archiveContact(req, { params: Promise.resolve({ id: 'c_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.contact.update).not.toHaveBeenCalled()
  })

  it('deduplicates scoring rule update with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_rule_patch_1',
      afterSnapshot: { rule_id: 'rule_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/scoring/rules/rule_1', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_rule_patch_1',
      },
      body: JSON.stringify({ weight: 12 }),
    })

    const res = await updateScoringRule(req, { params: Promise.resolve({ id: 'rule_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.leadScoreRule.updateMany).not.toHaveBeenCalled()
  })

  it('deduplicates recording consent update with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const telephony = require('@/lib/telephony/call-recording')
    const m0Service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_recording_consent_1',
      afterSnapshot: { updated: true },
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/c_1/recording-consent', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_recording_consent_1',
      },
      body: JSON.stringify({ consent: true }),
    })

    const res = await updateRecordingConsent(req, { params: Promise.resolve({ id: 'c_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(telephony.updateRecordingConsent).not.toHaveBeenCalled()
  })
})
