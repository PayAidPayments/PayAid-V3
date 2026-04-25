import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as bulkDeleteContacts } from '@/apps/dashboard/app/api/crm/contacts/bulk-delete/route'
import { POST as massTransferContacts } from '@/apps/dashboard/app/api/crm/contacts/mass-transfer/route'
import { POST as massUpdateLeads } from '@/apps/dashboard/app/api/crm/leads/mass-update/route'
import { POST as massTransferLeads } from '@/apps/dashboard/app/api/crm/leads/mass-transfer/route'
import { POST as massDeleteLeads } from '@/apps/dashboard/app/api/crm/leads/mass-delete/route'

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

jest.mock('@/lib/db/connection-retry', () => ({
  prismaWithRetry: jest.fn(async (fn: () => unknown) => fn()),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    salesRep: {
      findFirst: jest.fn(),
    },
    contact: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

describe('CRM mass mutation idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates contacts bulk-delete with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_contacts_bulk_delete_1',
      afterSnapshot: { archived: 2 },
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/bulk-delete', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_contacts_bulk_delete_1',
      },
      body: JSON.stringify({ contactIds: ['c_1', 'c_2'] }),
    })

    const res = await bulkDeleteContacts(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.archived).toBe(2)
    expect(prisma.prisma.contact.updateMany).not.toHaveBeenCalled()
  })

  it('deduplicates contacts mass-transfer with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_contacts_mass_transfer_1',
      afterSnapshot: { transferred: 3 },
    })

    const req = new NextRequest('http://localhost/api/crm/contacts/mass-transfer', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_contacts_mass_transfer_1',
      },
      body: JSON.stringify({ contactIds: ['c_1', 'c_2', 'c_3'], assignToUserId: 'usr_2' }),
    })

    const res = await massTransferContacts(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.transferred).toBe(3)
    expect(prisma.prisma.contact.updateMany).not.toHaveBeenCalled()
  })

  it('deduplicates leads mass-update with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_leads_mass_update_1',
      afterSnapshot: { updated: 4 },
    })

    const req = new NextRequest('http://localhost/api/crm/leads/mass-update', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_leads_mass_update_1',
      },
      body: JSON.stringify({
        leadIds: ['l_1', 'l_2', 'l_3', 'l_4'],
        updates: { status: 'active' },
      }),
    })

    const res = await massUpdateLeads(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.updated).toBe(4)
    expect(prisma.prisma.contact.updateMany).not.toHaveBeenCalled()
  })

  it('deduplicates leads mass-transfer with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_leads_mass_transfer_1',
      afterSnapshot: { transferred: 2 },
    })

    const req = new NextRequest('http://localhost/api/crm/leads/mass-transfer', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_leads_mass_transfer_1',
      },
      body: JSON.stringify({
        leadIds: ['l_1', 'l_2'],
        assignToUserId: 'usr_2',
      }),
    })

    const res = await massTransferLeads(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.transferred).toBe(2)
    expect(prisma.prisma.contact.updateMany).not.toHaveBeenCalled()
  })

  it('deduplicates leads mass-delete with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1', roles: ['admin'] })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_leads_mass_delete_1',
      afterSnapshot: { deleted: 5 },
    })

    const req = new NextRequest('http://localhost/api/crm/leads/mass-delete', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_leads_mass_delete_1',
      },
      body: JSON.stringify({
        leadIds: ['l_1', 'l_2', 'l_3', 'l_4', 'l_5'],
      }),
    })

    const res = await massDeleteLeads(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.deleted).toBe(5)
    expect(prisma.prisma.contact.deleteMany).not.toHaveBeenCalled()
  })
})
