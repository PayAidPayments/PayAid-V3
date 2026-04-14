import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/apps/dashboard/app/api/v1/sdr/playbooks/route'

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

jest.mock('@/lib/middleware/permissions', () => ({
  assertAnyPermission: jest.fn(),
  PermissionDeniedError: class PermissionDeniedError extends Error {
    constructor(msg?: string) { super(msg ?? 'Permission denied') }
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    workflow: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}))

function makeReq(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/v1/sdr/playbooks', {
    method,
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
}

const samplePlaybook = {
  id: 'pb_1',
  name: 'Q2 Outreach',
  description: 'Q2 SDR sequence',
  isActive: true,
  steps: { sdr_steps: [], guardrails: {}, schema_version: '1.0' },
  createdAt: new Date('2026-04-08T00:00:00.000Z'),
  updatedAt: new Date('2026-04-08T00:00:00.000Z'),
  _count: { executions: 3 },
}

describe('GET /api/v1/sdr/playbooks (M2 smoke)', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns list of playbooks', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflow.findMany.mockResolvedValue([samplePlaybook])

    const res = await GET(makeReq('GET'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.playbooks).toHaveLength(1)
    expect(body.playbooks[0].id).toBe('pb_1')
    expect(body.playbooks[0].run_count).toBe(3)
    expect(body.total).toBe(1)
  })

  it('returns 403 when permission denied', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    perms.assertAnyPermission.mockRejectedValue(new perms.PermissionDeniedError('Access denied'))

    const res = await GET(makeReq('GET'))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('PERMISSION_DENIED')
  })
})

describe('POST /api/v1/sdr/playbooks (M2 smoke)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    const auth = require('@/lib/middleware/auth')
    const flags = require('@/lib/feature-flags/tenant-feature')
    const db = require('@/lib/db/prisma')
    auth.handleLicenseError.mockImplementation(() => null)
    flags.assertTenantFeatureEnabled.mockResolvedValue(undefined)
    db.prisma.auditLog.create.mockResolvedValue({})
  })

  const validBody = {
    name: 'Q2 Outreach',
    description: 'Q2 SDR sequence',
    steps: [
      { step_type: 'email', delay_hours: 0, subject: 'Hello', body: 'Hi there' },
      { step_type: 'call', delay_hours: 48 },
    ],
    guardrails: { max_contacts: 100, require_approval: false },
  }

  it('creates playbook and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    perms.assertAnyPermission.mockResolvedValue(undefined)
    db.prisma.workflow.create.mockResolvedValue({
      id: 'pb_new',
      name: 'Q2 Outreach',
      description: 'Q2 SDR sequence',
      isActive: true,
      steps: { sdr_steps: validBody.steps, guardrails: validBody.guardrails, schema_version: '1.0' },
      createdAt: new Date('2026-04-08T00:00:00.000Z'),
    })

    const res = await POST(makeReq('POST', validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.playbook.id).toBe('pb_new')
    expect(body.playbook.name).toBe('Q2 Outreach')
  })

  it('returns 400 for missing name', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    perms.assertAnyPermission.mockResolvedValue(undefined)

    const res = await POST(makeReq('POST', { steps: validBody.steps }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 400 for empty steps array', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    perms.assertAnyPermission.mockResolvedValue(undefined)

    const res = await POST(makeReq('POST', { name: 'Bad', steps: [] }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 403 when permission denied', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    perms.assertAnyPermission.mockRejectedValue(new perms.PermissionDeniedError('Access denied'))

    const res = await POST(makeReq('POST', validBody))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('PERMISSION_DENIED')
  })
})

// ─── Feature flag gate (m2_sdr) ─────────────────────────────────────────

describe('M2 feature flag gate — m2_sdr', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 FEATURE_DISABLED when m2_sdr is disabled on GET /playbooks', async () => {
    const auth = require('@/lib/middleware/auth')
    const ff = require('@/lib/feature-flags/tenant-feature')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    ff.assertTenantFeatureEnabled.mockRejectedValueOnce(
      new ff.TenantFeatureDisabledError('m2_sdr')
    )
    const res = await GET(makeReq('GET'))
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.code).toBe('FEATURE_DISABLED')
  })
})
