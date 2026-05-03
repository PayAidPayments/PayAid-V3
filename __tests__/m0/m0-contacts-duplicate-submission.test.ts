import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createContact } from '@/apps/dashboard/app/api/contacts/route'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    contact: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/db/prisma-read', () => ({
  prismaRead: {
    user: { findUnique: jest.fn() },
    tenant: { findUnique: jest.fn() },
    contact: { findMany: jest.fn(), count: jest.fn() },
  },
}))

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/middleware/tenant', () => ({
  checkTenantLimits: jest.fn(),
}))

jest.mock('@/lib/cache/multi-layer', () => ({
  multiLayerCache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  },
}))

jest.mock('@/lib/workflow/trigger', () => ({
  triggerWorkflowsByEvent: jest.fn(),
}))

jest.mock('@/lib/audit-log-crm', () => ({
  logCrmAudit: jest.fn(),
}))

jest.mock('@/lib/tenant/resolve-tenant', () => ({
  resolveTenantFromParam: jest.fn(),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

describe('contacts create duplicate-submission protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://mock'
  })

  it('returns deduplicated response when idempotency key was already recorded', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenant = require('@/lib/middleware/tenant')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    tenant.checkTenantLimits.mockResolvedValue(true)
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_1',
      afterSnapshot: { contact_id: 'cnt_existing' },
    })

    const req = new NextRequest('http://localhost/api/contacts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_key_contact',
      },
      body: JSON.stringify({
        name: 'Test Contact',
        email: 'test@example.com',
        type: 'lead',
      }),
    })

    const res = await createContact(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe('cnt_existing')
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.contact.create).not.toHaveBeenCalled()
  })
})
