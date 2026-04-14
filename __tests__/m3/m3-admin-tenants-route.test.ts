/**
 * M3.5 smoke — Multi-tenant admin console
 *   GET  /api/v1/admin/tenants
 *   GET  /api/v1/admin/tenants/[id]
 *   PATCH /api/v1/admin/tenants/[id]/feature-flags
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as listTenants } from '@/apps/dashboard/app/api/v1/admin/tenants/route'
import { GET as getTenant } from '@/apps/dashboard/app/api/v1/admin/tenants/[id]/route'
import { PATCH as patchFeatureFlags } from '@/apps/dashboard/app/api/v1/admin/tenants/[id]/feature-flags/route'

jest.mock('@/lib/middleware/requireSuperAdmin', () => ({
  requireSuperAdmin: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    tenant: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    featureToggle: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  },
}))

const SAMPLE_TENANT = {
  id: 'tn_1',
  name: 'Acme Corp',
  slug: 'acme',
  plan: 'pro',
  status: 'active',
  industry: 'SaaS',
  email: 'admin@acme.com',
  phone: null,
  country: 'India',
  licensedModules: ['crm', 'hr'],
  billingStatus: 'active',
  trialEndsAt: null,
  maxUsers: 50,
  maxContacts: 10000,
  subscriptionTier: 'pro',
  onboardingCompleted: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-04-01'),
  _count: { users: 12, deals: 34, contacts: 120 },
}

const SAMPLE_TOGGLES = [
  { tenantId: 'tn_1', featureName: 'm2_voice', isEnabled: true, updatedAt: new Date('2026-04-01') },
  { tenantId: 'tn_1', featureName: 'm2_sdr', isEnabled: false, updatedAt: new Date('2026-04-01') },
]

function makeReq(path: string, qs = '') {
  return new NextRequest(`http://localhost${path}${qs}`, {
    headers: { cookie: 'token=super.admin.jwt' },
  })
}

function makePatchReq(path: string, body: object) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'PATCH',
    headers: { cookie: 'token=super.admin.jwt', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('M3.5 Admin Tenants API smoke tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const sa = require('@/lib/middleware/requireSuperAdmin')
    const db = require('@/lib/db/prisma')

    sa.requireSuperAdmin.mockResolvedValue({ userId: 'admin_1', roles: ['SUPER_ADMIN'] })
    db.prisma.tenant.findMany.mockResolvedValue([SAMPLE_TENANT])
    db.prisma.tenant.count.mockResolvedValue(1)
    db.prisma.tenant.findUnique.mockResolvedValue(SAMPLE_TENANT)
    db.prisma.featureToggle.findMany.mockResolvedValue(SAMPLE_TOGGLES)
    db.prisma.featureToggle.upsert.mockResolvedValue({
      featureName: 'm2_voice',
      isEnabled: false,
      updatedAt: new Date(),
    })
    db.prisma.auditLog.create.mockResolvedValue({ id: 'al_1' })
  })

  // ── GET /api/v1/admin/tenants ──────────────────────────────────────────────

  describe('GET /api/v1/admin/tenants', () => {
    it('returns 200 with tenant list, pagination, and feature flags per tenant', async () => {
      const res = await listTenants(makeReq('/api/v1/admin/tenants'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(Array.isArray(json.tenants)).toBe(true)
      expect(json.tenants).toHaveLength(1)
      expect(json.tenants[0].id).toBe('tn_1')
      expect(json.tenants[0].user_count).toBe(12)
      expect(typeof json.tenants[0].feature_flags).toBe('object')
      expect(json.pagination.total).toBe(1)
    })

    it('returns 200 with empty list when no tenants match filter', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.tenant.findMany.mockResolvedValue([])
      db.prisma.tenant.count.mockResolvedValue(0)
      db.prisma.featureToggle.findMany.mockResolvedValue([])
      const res = await listTenants(makeReq('/api/v1/admin/tenants', '?status=suspended'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.tenants).toHaveLength(0)
      expect(json.pagination.total).toBe(0)
    })

    it('returns 401 when not authenticated', async () => {
      const sa = require('@/lib/middleware/requireSuperAdmin')
      sa.requireSuperAdmin.mockRejectedValueOnce(new Error('Unauthorized'))
      const res = await listTenants(makeReq('/api/v1/admin/tenants'))
      expect(res.status).toBe(401)
    })

    it('returns 403 when user is not SUPER_ADMIN', async () => {
      const sa = require('@/lib/middleware/requireSuperAdmin')
      sa.requireSuperAdmin.mockRejectedValueOnce(new Error('Forbidden'))
      const res = await listTenants(makeReq('/api/v1/admin/tenants'))
      expect(res.status).toBe(403)
    })

    it('returns 500 on unexpected DB error', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.tenant.findMany.mockRejectedValue(new Error('DB error'))
      const res = await listTenants(makeReq('/api/v1/admin/tenants'))
      expect(res.status).toBe(500)
    })
  })

  // ── GET /api/v1/admin/tenants/[id] ────────────────────────────────────────

  describe('GET /api/v1/admin/tenants/[id]', () => {
    it('returns 200 with tenant detail and all feature flags', async () => {
      const res = await getTenant(makeReq('/api/v1/admin/tenants/tn_1'), { params: { id: 'tn_1' } })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.tenant.id).toBe('tn_1')
      expect(json.tenant.user_count).toBe(12)
      expect(json.tenant.deal_count).toBe(34)
      expect(json.feature_flags).toBeDefined()
      expect(json.feature_flags['m2_voice'].enabled).toBe(true)
      expect(json.feature_flags['m2_sdr'].enabled).toBe(false)
    })

    it('returns 200 with default-on flags for unset feature flags', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.featureToggle.findMany.mockResolvedValue([]) // no explicit toggles
      const res = await getTenant(makeReq('/api/v1/admin/tenants/tn_1'), { params: { id: 'tn_1' } })
      expect(res.status).toBe(200)
      const json = await res.json()
      // Default-on: all flags should be present and enabled=true
      expect(json.feature_flags['m2_voice'].enabled).toBe(true)
      expect(json.feature_flags['m3_governance'].enabled).toBe(true)
    })

    it('returns 404 when tenant does not exist', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.tenant.findUnique.mockResolvedValue(null)
      const res = await getTenant(makeReq('/api/v1/admin/tenants/nonexistent'), { params: { id: 'nonexistent' } })
      expect(res.status).toBe(404)
    })

    it('returns 403 when not SUPER_ADMIN', async () => {
      const sa = require('@/lib/middleware/requireSuperAdmin')
      sa.requireSuperAdmin.mockRejectedValueOnce(new Error('Forbidden'))
      const res = await getTenant(makeReq('/api/v1/admin/tenants/tn_1'), { params: { id: 'tn_1' } })
      expect(res.status).toBe(403)
    })
  })

  // ── PATCH /api/v1/admin/tenants/[id]/feature-flags ─────────────────────────

  describe('PATCH /api/v1/admin/tenants/[id]/feature-flags', () => {
    it('returns 200 and updated flag map on successful patch', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.featureToggle.upsert.mockResolvedValueOnce({
        featureName: 'm2_voice',
        isEnabled: false,
        updatedAt: new Date(),
      })
      const res = await patchFeatureFlags(
        makePatchReq('/api/v1/admin/tenants/tn_1/feature-flags', { flags: { m2_voice: false } }),
        { params: { id: 'tn_1' } }
      )
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.tenant_id).toBe('tn_1')
      expect(json.updated_flags['m2_voice']).toBe(false)
      expect(json.updated_at).toBeDefined()
    })

    it('can enable and disable multiple flags at once', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.featureToggle.upsert
        .mockResolvedValueOnce({ featureName: 'm2_sdr', isEnabled: true, updatedAt: new Date() })
        .mockResolvedValueOnce({ featureName: 'm3_governance', isEnabled: false, updatedAt: new Date() })
      const res = await patchFeatureFlags(
        makePatchReq('/api/v1/admin/tenants/tn_1/feature-flags', {
          flags: { m2_sdr: true, m3_governance: false },
        }),
        { params: { id: 'tn_1' } }
      )
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.updated_flags['m2_sdr']).toBe(true)
      expect(json.updated_flags['m3_governance']).toBe(false)
    })

    it('returns 400 when unknown flag name is provided', async () => {
      const res = await patchFeatureFlags(
        makePatchReq('/api/v1/admin/tenants/tn_1/feature-flags', {
          flags: { unknown_flag_xyz: true },
        }),
        { params: { id: 'tn_1' } }
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 when flags object is empty', async () => {
      const res = await patchFeatureFlags(
        makePatchReq('/api/v1/admin/tenants/tn_1/feature-flags', { flags: {} }),
        { params: { id: 'tn_1' } }
      )
      expect(res.status).toBe(400)
    })

    it('returns 404 when tenant does not exist', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.tenant.findUnique.mockResolvedValue(null)
      const res = await patchFeatureFlags(
        makePatchReq('/api/v1/admin/tenants/nonexistent/feature-flags', { flags: { m2_voice: true } }),
        { params: { id: 'nonexistent' } }
      )
      expect(res.status).toBe(404)
    })

    it('returns 403 when not SUPER_ADMIN', async () => {
      const sa = require('@/lib/middleware/requireSuperAdmin')
      sa.requireSuperAdmin.mockRejectedValueOnce(new Error('Forbidden'))
      const res = await patchFeatureFlags(
        makePatchReq('/api/v1/admin/tenants/tn_1/feature-flags', { flags: { m2_voice: false } }),
        { params: { id: 'tn_1' } }
      )
      expect(res.status).toBe(403)
    })

    it('returns 500 on DB failure', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.featureToggle.upsert.mockRejectedValue(new Error('DB error'))
      const res = await patchFeatureFlags(
        makePatchReq('/api/v1/admin/tenants/tn_1/feature-flags', { flags: { m2_voice: false } }),
        { params: { id: 'tn_1' } }
      )
      expect(res.status).toBe(500)
    })
  })
})
