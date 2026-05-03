import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as startRun } from '@/apps/dashboard/app/api/v1/sdr/runs/[id]/start/route'
import { POST as pauseRun } from '@/apps/dashboard/app/api/v1/sdr/runs/[id]/pause/route'
import { POST as stopRun } from '@/apps/dashboard/app/api/v1/sdr/runs/[id]/stop/route'

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
    tenantFeatureFlag: { findFirst: jest.fn().mockResolvedValue({ tenantId: 'tn_m2', feature: 'm2_sdr', enabled: true }) },
    workflow: { findFirst: jest.fn() },
    workflowExecution: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}))

function makeReq(path: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
}

const samplePlaybook = {
  id: 'pb_1',
  tenantId: 'tn_m2',
  name: 'Q2 Outreach',
  triggerType: 'SDR_PLAYBOOK',
  steps: { sdr_steps: [], guardrails: { require_approval: false }, schema_version: '1.0' },
}

const sampleRun = {
  id: 'run_1',
  workflowId: 'pb_1',
  tenantId: 'tn_m2',
  status: 'RUNNING',
  triggerData: { contact_ids: ['c1', 'c2'], started_at: '2026-04-08T00:00:00.000Z' },
  startedAt: new Date('2026-04-08T00:00:00.000Z'),
  result: null,
}

describe('POST /api/v1/sdr/runs/[id]/start (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('starts a run and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflow.findFirst.mockResolvedValue(samplePlaybook)
    db.prisma.workflowExecution.create.mockResolvedValue(sampleRun)

    const res = await startRun(
      makeReq('/api/v1/sdr/runs/pb_1/start', { contact_ids: ['c1', 'c2'] }),
      { params: Promise.resolve({ id: 'pb_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.run.id).toBe('run_1')
    expect(body.run.status).toBe('running')
    expect(body.run.contact_count).toBe(2)
  })

  it('returns 404 when playbook not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflow.findFirst.mockResolvedValue(null)

    const res = await startRun(
      makeReq('/api/v1/sdr/runs/pb_999/start', { contact_ids: ['c1'] }),
      { params: Promise.resolve({ id: 'pb_999' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('SDR playbook not found')
  })

  it('returns 422 when playbook requires approval', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflow.findFirst.mockResolvedValue({
      ...samplePlaybook,
      steps: { sdr_steps: [], guardrails: { require_approval: true }, schema_version: '1.0' },
    })

    const res = await startRun(
      makeReq('/api/v1/sdr/runs/pb_1/start', { contact_ids: ['c1'] }),
      { params: Promise.resolve({ id: 'pb_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe('APPROVAL_REQUIRED')
  })

  it('returns 400 for missing contact_ids', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })

    const res = await startRun(
      makeReq('/api/v1/sdr/runs/pb_1/start', {}),
      { params: Promise.resolve({ id: 'pb_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 500 on unexpected start failure', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    perms.assertAnyPermission.mockResolvedValue(undefined)
    db.prisma.workflow.findFirst.mockRejectedValue(new Error('start db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await startRun(
      makeReq('/api/v1/sdr/runs/pb_1/start', { contact_ids: ['c1'] }),
      { params: Promise.resolve({ id: 'pb_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to start SDR run')
    spy.mockRestore()
  })
})

describe('POST /api/v1/sdr/runs/[id]/pause (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('pauses a running run', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflowExecution.findFirst.mockResolvedValue(sampleRun)
    db.prisma.workflowExecution.update.mockResolvedValue({
      ...sampleRun,
      status: 'PAUSED',
    })

    const res = await pauseRun(
      makeReq('/api/v1/sdr/runs/run_1/pause'),
      { params: Promise.resolve({ id: 'run_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.run.status).toBe('paused')
  })

  it('returns 422 when run is not RUNNING', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflowExecution.findFirst.mockResolvedValue({ ...sampleRun, status: 'CANCELLED' })

    const res = await pauseRun(
      makeReq('/api/v1/sdr/runs/run_1/pause'),
      { params: Promise.resolve({ id: 'run_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe('INVALID_STATE_TRANSITION')
  })

  it('returns 404 when run not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflowExecution.findFirst.mockResolvedValue(null)

    const res = await pauseRun(
      makeReq('/api/v1/sdr/runs/run_999/pause'),
      { params: Promise.resolve({ id: 'run_999' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(404)
  })

  it('returns 500 on unexpected pause failure', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    perms.assertAnyPermission.mockResolvedValue(undefined)
    db.prisma.workflowExecution.findFirst.mockRejectedValue(new Error('pause db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await pauseRun(
      makeReq('/api/v1/sdr/runs/run_1/pause'),
      { params: Promise.resolve({ id: 'run_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to pause SDR run')
    spy.mockRestore()
  })
})

describe('POST /api/v1/sdr/runs/[id]/stop (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('stops a running run with reason', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflowExecution.findFirst.mockResolvedValue(sampleRun)
    db.prisma.workflowExecution.update.mockResolvedValue({
      ...sampleRun,
      status: 'CANCELLED',
      completedAt: new Date('2026-04-08T01:00:00.000Z'),
    })

    const res = await stopRun(
      makeReq('/api/v1/sdr/runs/run_1/stop', { reason: 'Campaign paused by manager' }),
      { params: Promise.resolve({ id: 'run_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.run.status).toBe('stopped')
    expect(body.run.stop_reason).toBe('Campaign paused by manager')
  })

  it('returns 422 when run is already stopped', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflowExecution.findFirst.mockResolvedValue({ ...sampleRun, status: 'CANCELLED' })

    const res = await stopRun(
      makeReq('/api/v1/sdr/runs/run_1/stop', { reason: 'Trying again' }),
      { params: Promise.resolve({ id: 'run_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe('INVALID_STATE_TRANSITION')
  })

  it('returns 400 when reason is missing', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })

    const res = await stopRun(
      makeReq('/api/v1/sdr/runs/run_1/stop', {}),
      { params: Promise.resolve({ id: 'run_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 404 when run not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.workflowExecution.findFirst.mockResolvedValue(null)

    const res = await stopRun(
      makeReq('/api/v1/sdr/runs/run_999/stop', { reason: 'No such run' }),
      { params: Promise.resolve({ id: 'run_999' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(404)
  })

  it('returns 500 on unexpected stop failure', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2' })
    perms.assertAnyPermission.mockResolvedValue(undefined)
    db.prisma.workflowExecution.findFirst.mockRejectedValue(new Error('stop db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await stopRun(
      makeReq('/api/v1/sdr/runs/run_1/stop', { reason: 'Unexpected issue' }),
      { params: Promise.resolve({ id: 'run_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to stop SDR run')
    spy.mockRestore()
  })
})

// ─── Feature flag gate (m2_sdr) ─────────────────────────────────────────

describe('M2 feature flag gate — m2_sdr (runs)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 FEATURE_DISABLED when m2_sdr is disabled on POST /runs/[id]/start', async () => {
    const auth = require('@/lib/middleware/auth')
    const ff = require('@/lib/feature-flags/tenant-feature')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    ff.assertTenantFeatureEnabled.mockRejectedValueOnce(
      new ff.TenantFeatureDisabledError('m2_sdr')
    )
    const res = await startRun(
      makeReq('/api/v1/sdr/runs/pb_1/start', { contact_ids: ['ct_1'] }),
      { params: Promise.resolve({ id: 'pb_1' }) }
    )
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.code).toBe('FEATURE_DISABLED')
  })
})
