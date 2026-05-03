/**
 * M3.5 smoke — Admin Impersonation
 *   POST /api/v1/admin/tenants/[id]/impersonate
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as impersonate } from '@/apps/dashboard/app/api/v1/admin/tenants/[id]/impersonate/route'

jest.mock('@/lib/middleware/requireSuperAdmin', () => ({
  requireSuperAdmin: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
    },
    auditLog: { create: jest.fn().mockReturnValue({ catch: jest.fn() }) },
  },
}))

const ACTIVE_TENANT = {
  id: 'tn_target',
  name: 'Acme Corp',
  status: 'ACTIVE',
}

const SUSPENDED_TENANT = {
  id: 'tn_suspended',
  name: 'Suspended Co',
  status: 'SUSPENDED',
}

function makePostReq(tenantId: string) {
  return new NextRequest(`http://localhost/api/v1/admin/tenants/${tenantId}/impersonate`, {
    method: 'POST',
    headers: { cookie: 'token=super.admin.jwt', 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })
}

describe('POST /api/v1/admin/tenants/[id]/impersonate (M3.5 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const sa = require('@/lib/middleware/requireSuperAdmin')
    sa.requireSuperAdmin.mockResolvedValue({ userId: 'admin_1', roles: ['SUPER_ADMIN'] })

    const db = require('@/lib/db/prisma')
    db.prisma.tenant.findUnique.mockResolvedValue(ACTIVE_TENANT)
    db.prisma.auditLog.create.mockReturnValue({ catch: jest.fn() })
  })

  it('201 — returns impersonation token + audit trail for active tenant', async () => {
    const req = makePostReq('tn_target')
    const res = await impersonate(req, { params: { id: 'tn_target' } })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.impersonation_id).toBeDefined()
    expect(body.impersonation_token).toBeDefined()
    expect(body.target_tenant_id).toBe('tn_target')
    expect(body.target_tenant_name).toBe('Acme Corp')
    expect(body.initiated_by).toBe('admin_1')
    expect(body.expires_at).toBeDefined()
    const db = require('@/lib/db/prisma')
    expect(db.prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'tenant_impersonation',
          changeSummary: 'impersonation_started',
          tenantId: 'tn_target',
        }),
      }),
    )
  })

  it('expires_at is ~1 hour from now', async () => {
    const before = Date.now()
    const req = makePostReq('tn_target')
    const res = await impersonate(req, { params: { id: 'tn_target' } })
    const body = await res.json()
    const expiresMs = new Date(body.expires_at).getTime()
    // Should expire between 59-61 minutes from now
    expect(expiresMs - before).toBeGreaterThan(59 * 60 * 1000)
    expect(expiresMs - before).toBeLessThan(61 * 60 * 1000)
  })

  it('404 — tenant not found', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.tenant.findUnique.mockResolvedValue(null)
    const req = makePostReq('tn_missing')
    const res = await impersonate(req, { params: { id: 'tn_missing' } })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('422 — suspended tenant cannot be impersonated', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.tenant.findUnique.mockResolvedValue(SUSPENDED_TENANT)
    const req = makePostReq('tn_suspended')
    const res = await impersonate(req, { params: { id: 'tn_suspended' } })
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe('TENANT_SUSPENDED')
  })

  it('401 — missing auth cookie', async () => {
    const sa = require('@/lib/middleware/requireSuperAdmin')
    sa.requireSuperAdmin.mockRejectedValue(new Error('Unauthorized'))
    const req = makePostReq('tn_target')
    const res = await impersonate(req, { params: { id: 'tn_target' } })
    expect(res.status).toBe(401)
  })

  it('403 — non-SUPER_ADMIN role', async () => {
    const sa = require('@/lib/middleware/requireSuperAdmin')
    sa.requireSuperAdmin.mockRejectedValue(new Error('Forbidden'))
    const req = makePostReq('tn_target')
    const res = await impersonate(req, { params: { id: 'tn_target' } })
    expect(res.status).toBe(403)
  })

  it('500 — DB error', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.tenant.findUnique.mockRejectedValue(new Error('DB down'))
    const req = makePostReq('tn_target')
    const res = await impersonate(req, { params: { id: 'tn_target' } })
    expect(res.status).toBe(500)
  })
})
