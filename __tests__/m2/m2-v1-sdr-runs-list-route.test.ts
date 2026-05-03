/**
 * M2 smoke — GET /api/v1/sdr/runs (list endpoint)
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as listRuns } from '@/apps/dashboard/app/api/v1/sdr/runs/route'

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
    workflowExecution: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

function makeReq(url: string) {
  return new NextRequest(`http://localhost${url}`, {
    headers: { authorization: 'Bearer t' },
  })
}

const sampleRun = {
  id: 'run_1',
  workflowId: 'pb_1',
  tenantId: 'tn_1',
  status: 'RUNNING',
  triggerData: { contact_ids: ['c1', 'c2'], guardrails: {}, started_at: '2026-04-08T10:00:00Z' },
  startedAt: new Date('2026-04-08T10:00:00Z'),
  completedAt: null,
  error: null,
  result: null,
  workflow: { id: 'pb_1', name: 'Q2 Outreach' },
}

describe('GET /api/v1/sdr/runs (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 with runs list and pagination', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.workflowExecution.findMany.mockResolvedValue([sampleRun])
    db.prisma.workflowExecution.count.mockResolvedValue(1)

    const res = await listRuns(makeReq('/api/v1/sdr/runs'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.runs).toHaveLength(1)
    expect(body.runs[0].id).toBe('run_1')
    expect(body.runs[0].status).toBe('running')
    expect(body.runs[0].playbook_name).toBe('Q2 Outreach')
    expect(body.runs[0].contact_count).toBe(2)
    expect(body.pagination.total).toBe(1)
  })

  it('filters by status=RUNNING — returns only running run', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.workflowExecution.findMany.mockResolvedValue([sampleRun])
    db.prisma.workflowExecution.count.mockResolvedValue(1)

    const res = await listRuns(makeReq('/api/v1/sdr/runs?status=RUNNING'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.runs[0].status).toBe('running')
    expect(db.prisma.workflowExecution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'RUNNING' }) })
    )
  })

  it('filters by playbook_id — passes workflowId to query', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.workflowExecution.findMany.mockResolvedValue([sampleRun])
    db.prisma.workflowExecution.count.mockResolvedValue(1)

    const res = await listRuns(makeReq('/api/v1/sdr/runs?playbook_id=pb_1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.runs[0].playbook_id).toBe('pb_1')
    expect(db.prisma.workflowExecution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ workflowId: 'pb_1' }) })
    )
  })

  it('returns empty runs list when none found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.workflowExecution.findMany.mockResolvedValue([])
    db.prisma.workflowExecution.count.mockResolvedValue(0)

    const res = await listRuns(makeReq('/api/v1/sdr/runs'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.runs).toHaveLength(0)
    expect(body.pagination.total).toBe(0)
  })

  it('returns 500 on unexpected error', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.workflowExecution.findMany.mockRejectedValue(new Error('db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await listRuns(makeReq('/api/v1/sdr/runs'))
    expect(res.status).toBe(500)
    spy.mockRestore()
  })

  it('ignores invalid status filter values — returns 200 with no status filter', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.workflowExecution.findMany.mockResolvedValue([])
    db.prisma.workflowExecution.count.mockResolvedValue(0)

    const res = await listRuns(makeReq('/api/v1/sdr/runs?status=INVALID'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.runs).toHaveLength(0)
    // Invalid status is silently ignored — no status filter passed
    expect(db.prisma.workflowExecution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ status: 'INVALID' }),
      })
    )
  })

  it('returns 403 FEATURE_DISABLED when m2_sdr is disabled', async () => {
    const auth = require('@/lib/middleware/auth')
    const ff = require('@/lib/feature-flags/tenant-feature')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    ff.assertTenantFeatureEnabled.mockRejectedValueOnce(
      new ff.TenantFeatureDisabledError('m2_sdr')
    )

    const res = await listRuns(makeReq('/api/v1/sdr/runs'))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('FEATURE_DISABLED')
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

    const res = await listRuns(makeReq('/api/v1/sdr/runs'))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })

  it('returns 403 for filtered list when module access is denied by license handler', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await listRuns(makeReq('/api/v1/sdr/runs?status=RUNNING&playbook_id=pb_1'))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})
