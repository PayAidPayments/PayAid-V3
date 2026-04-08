import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/m0/exit-metrics/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
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
  assertAnyPermission: jest.fn().mockResolvedValue(undefined),
  PermissionDeniedError: class PermissionDeniedError extends Error {},
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  getM0ExitMetrics: jest.fn(),
}))

describe('GET /api/v1/m0/exit-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns JSON from getM0ExitMetrics with query params', async () => {
    const auth = require('@/lib/middleware/auth')
    const svc = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    svc.getM0ExitMetrics.mockResolvedValue({
      window_days: 14,
      window_start: '2026-01-01T00:00:00.000Z',
      active_workflows_count: 5,
      audit: {
        signal_audit_entries: 10,
        workflow_audit_entries: 9,
        non_test_workflow_executions: 10,
        capture_ratio: 0.95,
        capture_ratio_definition: 'test',
        capture_met: true,
      },
      latency: {
        signal_sample_cap: 50,
        pairs_used: 3,
        median_signal_to_first_workflow_audit_ms: 60000,
        insufficient_sample: false,
        pairing_note: 'test',
        median_under_five_minutes: true,
      },
      criteria: {
        active_workflows_met: true,
        audit_capture_met: true,
        median_latency_met: true,
        all_met_strict: true,
        all_met_latency_na_ok: true,
      },
    })

    const req = new NextRequest(
      'http://localhost/api/v1/m0/exit-metrics?windowDays=14&signalSample=50',
      { headers: { authorization: 'Bearer t' } }
    )
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.active_workflows_count).toBe(5)
    expect(body.criteria.all_met_strict).toBe(true)
    expect(svc.getM0ExitMetrics).toHaveBeenCalledWith('tn_1', {
      windowDays: 14,
      signalSampleSize: 50,
    })
  })
})
