/**
 * M2 smoke — /api/v1/marketplace/apps (GET + POST install) and
 *             /api/v1/marketplace/apps/[id]/configure (POST)
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as listApps, POST as installApp } from '@/apps/dashboard/app/api/v1/marketplace/apps/route'
import { POST as configureApp } from '@/apps/dashboard/app/api/v1/marketplace/apps/[id]/configure/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    constructor(public featureName: string) {
      super(`Feature "${featureName}" is disabled`)
      this.name = 'TenantFeatureDisabledError'
    }
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'al_1' }),
    },
  },
}))

function makeReq(url: string, method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
}

// ─── GET /api/v1/marketplace/apps ──────────────────────────────────────────

describe('GET /api/v1/marketplace/apps (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 with apps catalog', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.auditLog.findMany.mockResolvedValue([])

    const res = await listApps(makeReq('/api/v1/marketplace/apps'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.apps)).toBe(true)
    expect(body.apps.length).toBeGreaterThan(0)
    expect(body.installed_count).toBe(0)
  })

  it('reflects installed apps when audit log records exist', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.auditLog.findMany.mockResolvedValue([
      { entityId: 'webhook-connector', snapshot: {} },
    ])

    const res = await listApps(makeReq('/api/v1/marketplace/apps'))
    const body = await res.json()
    const wh = body.apps.find((a: any) => a.id === 'webhook-connector')

    expect(res.status).toBe(200)
    expect(wh?.installed).toBe(true)
    expect(wh?.status).toBe('installed')
    expect(body.installed_count).toBe(1)
  })

  it('returns 500 fallback on unexpected error', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.auditLog.findMany.mockRejectedValue(new Error('db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await listApps(makeReq('/api/v1/marketplace/apps'))
    expect(res.status).toBe(500)
    spy.mockRestore()
  })

  it('returns 403 when module access is denied by license handler', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await listApps(makeReq('/api/v1/marketplace/apps'))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── POST /api/v1/marketplace/apps (install) ───────────────────────────────

describe('POST /api/v1/marketplace/apps (install, M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('installs an app and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.auditLog.findFirst.mockResolvedValue(null) // not installed yet

    const res = await installApp(
      makeReq('/api/v1/marketplace/apps', 'POST', { app_id: 'webhook-connector' })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.installation.app_id).toBe('webhook-connector')
    expect(body.installation.status).toBe('installed')
  })

  it('returns 400 when app is already installed', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.auditLog.findFirst.mockResolvedValue({ id: 'al_existing' })

    const res = await installApp(
      makeReq('/api/v1/marketplace/apps', 'POST', { app_id: 'webhook-connector' })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('ALREADY_INSTALLED')
  })

  it('returns 404 for unknown app_id', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const res = await installApp(
      makeReq('/api/v1/marketplace/apps', 'POST', { app_id: 'no-such-app' })
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('App not found')
  })

  it('returns 400 for missing app_id', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const res = await installApp(
      makeReq('/api/v1/marketplace/apps', 'POST', {})
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 403 when module access is denied by license handler', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await installApp(
      makeReq('/api/v1/marketplace/apps', 'POST', { app_id: 'webhook-connector' })
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── POST /api/v1/marketplace/apps/[id]/configure ─────────────────────────

describe('POST /api/v1/marketplace/apps/[id]/configure (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('configures an installed app and returns 200', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.auditLog.findFirst.mockResolvedValue({
      id: 'al_1', snapshot: { config: {} },
    })

    const res = await configureApp(
      makeReq('/api/v1/marketplace/apps/webhook-connector/configure', 'POST', {
        config: { webhook_url: 'https://example.com/hook' },
      }),
      { params: Promise.resolve({ id: 'webhook-connector' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.app_id).toBe('webhook-connector')
  })

  it('returns 404 when app is not installed', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.auditLog.findFirst.mockResolvedValue(null)

    const res = await configureApp(
      makeReq('/api/v1/marketplace/apps/webhook-connector/configure', 'POST', {
        config: { key: 'val' },
      }),
      { params: Promise.resolve({ id: 'webhook-connector' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('NOT_INSTALLED')
  })

  it('returns 400 for empty config object', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.auditLog.findFirst.mockResolvedValue({ id: 'al_1', snapshot: {} })

    const res = await configureApp(
      makeReq('/api/v1/marketplace/apps/webhook-connector/configure', 'POST', { config: {} }),
      { params: Promise.resolve({ id: 'webhook-connector' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('EMPTY_CONFIG')
  })

  it('returns 403 when module access is denied by license handler (configure)', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await configureApp(
      makeReq('/api/v1/marketplace/apps/webhook-connector/configure', 'POST', {
        config: { webhook_url: 'https://example.com/hook' },
      }),
      { params: Promise.resolve({ id: 'webhook-connector' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── Feature flag gate (m2_marketplace) ─────────────────────────────────

describe('M2 feature flag gate — m2_marketplace', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 FEATURE_DISABLED when m2_marketplace is disabled on GET /apps', async () => {
    const auth = require('@/lib/middleware/auth')
    const ff = require('@/lib/feature-flags/tenant-feature')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    ff.assertTenantFeatureEnabled.mockRejectedValueOnce(
      new ff.TenantFeatureDisabledError('m2_marketplace')
    )
    const res = await listApps(makeReq('/api/v1/marketplace/apps', 'GET'))
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.code).toBe('FEATURE_DISABLED')
  })
})
