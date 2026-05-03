import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as runReconciliation } from '@/apps/dashboard/app/api/v1/outbox/reconciliation/run/route'
import { GET as exportReconciliationCsv } from '@/apps/dashboard/app/api/v1/outbox/reconciliation/history/export/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn(),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {},
}))

jest.mock('@/lib/middleware/permissions', () => ({
  assertAnyPermission: jest.fn(),
  PermissionDeniedError: class PermissionDeniedError extends Error {},
}))

jest.mock('@/lib/outbox/reconciliation', () => ({
  reconcileOutboxHealthAcrossTenants: jest.fn(),
}))

jest.mock('@/lib/cache/multi-layer', () => ({
  multiLayerCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: jest.fn(),
    },
  },
}))

describe('M0 outbox reconciliation route hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 429 when manual reconciliation run is on cooldown', async () => {
    const auth = require('@/lib/middleware/auth')
    const cache = require('@/lib/cache/multi-layer')
    const reconcile = require('@/lib/outbox/reconciliation')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    cache.multiLayerCache.get.mockResolvedValue({ blocked: true })

    const req = new NextRequest('http://localhost/api/v1/outbox/reconciliation/run', {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
    })

    const res = await runReconciliation(req)
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.code).toBe('RECONCILIATION_COOLDOWN')
    expect(typeof body.retryAfterSeconds).toBe('number')
    expect(reconcile.reconcileOutboxHealthAcrossTenants).not.toHaveBeenCalled()
  })

  it('exports reconciliation history as csv with applied filters', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.auditLog.findMany.mockResolvedValue([
      {
        timestamp: new Date('2026-04-06T10:00:00.000Z'),
        changeSummary: 'healthy run',
        afterSnapshot: { hasRisk: false, dlqCount: 0, driftCount: 0 },
      },
      {
        timestamp: new Date('2026-04-06T11:00:00.000Z'),
        changeSummary: 'risky run',
        afterSnapshot: { hasRisk: true, dlqCount: 3, driftCount: 2 },
      },
    ])

    const req = new NextRequest(
      'http://localhost/api/v1/outbox/reconciliation/history/export?riskyOnly=1&dlqMin=2&driftMin=1&limit=100',
      {
        method: 'GET',
        headers: { authorization: 'Bearer token' },
      }
    )

    const res = await exportReconciliationCsv(req)
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
    expect(res.headers.get('content-disposition')).toContain('outbox-reconciliation-history-tn_1.csv')
    expect(text).toContain('runAt,hasRisk,dlqCount,driftCount,summary')
    expect(text).toContain('risky run')
    expect(text).not.toContain('healthy run')
  })
})
