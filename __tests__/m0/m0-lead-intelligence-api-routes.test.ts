import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getDiscoveryCompanies } from '@/apps/dashboard/app/api/lead-intelligence/discovery/companies/route'
import { POST as postSavedSearch } from '@/apps/dashboard/app/api/lead-intelligence/saved-searches/route'
import { PATCH as patchSavedSearchById } from '@/apps/dashboard/app/api/lead-intelligence/saved-searches/[id]/route'
import { POST as postExport } from '@/apps/dashboard/app/api/lead-intelligence/exports/route'
import { GET as getLeadIntelligenceHealth } from '@/apps/dashboard/app/api/lead-intelligence/health/route'
import {
  getLeadIntelligenceTelemetryTotals,
  resetLeadIntelligenceTelemetryForTests,
} from '@/lib/lead-intelligence/telemetry'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((err: unknown) => err),
}))

jest.mock('@/lib/middleware/license', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((err: unknown) => err),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    account: { findMany: jest.fn() },
    leadBrief: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), delete: jest.fn(), update: jest.fn() },
    leadSegment: { create: jest.fn(), update: jest.fn() },
    leadExportJob: { create: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    leadAuditEvent: { create: jest.fn() },
  },
}))

describe('lead intelligence api routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetLeadIntelligenceTelemetryForTests()
  })

  it('returns discovery companies payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.account.findMany.mockResolvedValue([
      {
        id: 'acc_1',
        name: 'Acme Pvt Ltd',
        industry: 'Manufacturing',
        website: 'https://acme.example',
        city: 'Hyderabad',
        state: 'TS',
        country: 'India',
        employeeCount: 120,
        updatedAt: new Date('2026-05-07T00:00:00.000Z'),
      },
    ])

    const req = new NextRequest('http://localhost/api/lead-intelligence/discovery/companies?q=acme', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getDiscoveryCompanies(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.count).toBe(1)
    expect(body.items[0].companyName).toBe('Acme Pvt Ltd')
    const tel = getLeadIntelligenceTelemetryTotals()
    expect(tel.search_started).toBe(1)
    expect(tel.discovery_results_nonempty).toBe(1)
    expect(tel.discovery_results_empty).toBeUndefined()
  })

  it('increments empty discovery result telemetry', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.account.findMany.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/lead-intelligence/discovery/companies?q=nope', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getDiscoveryCompanies(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.count).toBe(0)
    const tel = getLeadIntelligenceTelemetryTotals()
    expect(tel.search_started).toBe(1)
    expect(tel.discovery_results_empty).toBe(1)
    expect(tel.discovery_results_nonempty).toBeUndefined()
  })

  it('rejects saving search without name', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/lead-intelligence/saved-searches', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ q: 'acme' }),
    })
    const res = await postSavedSearch(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(getLeadIntelligenceTelemetryTotals().search_saved).toBeUndefined()
  })

  it('returns csv export payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.account.findMany.mockResolvedValue([
      {
        id: 'acc_1',
        name: 'Acme Pvt Ltd',
        industry: 'Manufacturing',
        website: 'https://acme.example',
        city: 'Hyderabad',
        state: 'TS',
        country: 'India',
        employeeCount: 120,
        updatedAt: new Date('2026-05-07T00:00:00.000Z'),
      },
    ])
    prisma.leadExportJob.create.mockResolvedValue({ id: 'exp_1' })

    const req = new NextRequest('http://localhost/api/lead-intelligence/exports', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ q: 'acme', limit: 10 }),
    })
    const res = await postExport(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.jobId).toBe('exp_1')
    expect(typeof body.csv).toBe('string')
    expect(body.csv).toContain('company,industry,location,website,employees')
    const xt = getLeadIntelligenceTelemetryTotals()
    expect(xt.export_requested).toBe(1)
    expect(xt.export_csv_nonempty).toBe(1)
    expect(xt.export_csv_empty).toBeUndefined()
  })

  it('increments empty export csv telemetry when no rows match', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.account.findMany.mockResolvedValue([])
    prisma.leadExportJob.create.mockResolvedValue({ id: 'exp_empty' })

    const req = new NextRequest('http://localhost/api/lead-intelligence/exports', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ q: 'none', limit: 10 }),
    })
    const res = await postExport(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.rowCount).toBe(0)
    const xt = getLeadIntelligenceTelemetryTotals()
    expect(xt.export_requested).toBe(1)
    expect(xt.export_csv_empty).toBe(1)
    expect(xt.export_csv_nonempty).toBeUndefined()
  })

  it('archives saved search via PATCH', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.leadBrief.findFirst.mockResolvedValue({
      id: 'b1',
      name: 'My search',
      tenantId: 'tn_1',
      segments: [{ id: 's1', status: 'DRAFT', updatedAt: new Date() }],
    })
    prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        leadBrief: {
          update: jest.fn().mockResolvedValue({ id: 'b1', name: 'My search' }),
        },
        leadSegment: {
          update: jest.fn().mockResolvedValue({ status: 'ARCHIVED' }),
        },
      }
      return cb(tx as never)
    })

    const req = new NextRequest('http://localhost/api/lead-intelligence/saved-searches/b1', {
      method: 'PATCH',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    })
    const res = await patchSavedSearchById(req, { params: Promise.resolve({ id: 'b1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.status).toBe('ARCHIVED')
    expect(getLeadIntelligenceTelemetryTotals().search_archived).toBe(1)
  })

  it('health returns discovery and data plane when licensed', async () => {
    const license = require('@/lib/middleware/license')
    const { prisma } = require('@/lib/db/prisma')
    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', subscriptionTier: 'growth' })
    prisma.$queryRaw.mockResolvedValue([{ ok: 1 }])

    const req = new NextRequest('http://localhost/api/lead-intelligence/health', {
      headers: { authorization: 'Bearer token' },
    })
    const res = await getLeadIntelligenceHealth(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.discovery.mode).toBe('tenant_account_index')
    expect(body.discovery.status).toBe('ready')
    expect(body.dataPlane.prisma).toBe('ok')
    expect(body.telemetry).toBeUndefined()
  })

  it('health exposes in-process telemetry totals when LEAD_INTELLIGENCE_TELEMETRY_IN_HEALTH=1', async () => {
    const prev = process.env.LEAD_INTELLIGENCE_TELEMETRY_IN_HEALTH
    process.env.LEAD_INTELLIGENCE_TELEMETRY_IN_HEALTH = '1'
    try {
      resetLeadIntelligenceTelemetryForTests()
      const { trackLeadIntelligenceEvent } = await import('@/lib/lead-intelligence/telemetry')
      trackLeadIntelligenceEvent('search_started')

      const license = require('@/lib/middleware/license')
      const { prisma } = require('@/lib/db/prisma')
      license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', subscriptionTier: 'growth' })
      prisma.$queryRaw.mockResolvedValue([{ ok: 1 }])

      const req = new NextRequest('http://localhost/api/lead-intelligence/health', {
        headers: { authorization: 'Bearer token' },
      })
      const res = await getLeadIntelligenceHealth(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.telemetry?.countersSinceProcessStart?.search_started).toBe(1)
    } finally {
      if (prev === undefined) delete process.env.LEAD_INTELLIGENCE_TELEMETRY_IN_HEALTH
      else process.env.LEAD_INTELLIGENCE_TELEMETRY_IN_HEALTH = prev
    }
  })
})
