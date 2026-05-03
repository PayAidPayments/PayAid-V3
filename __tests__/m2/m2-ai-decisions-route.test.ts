/**
 * M3 smoke — /api/v1/ai/decisions (list, detail, override, stats)
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as listDecisions } from '@/apps/dashboard/app/api/v1/ai/decisions/route'
import { GET as getDecision } from '@/apps/dashboard/app/api/v1/ai/decisions/[id]/route'
import { POST as overrideDecision } from '@/apps/dashboard/app/api/v1/ai/decisions/[id]/override/route'
import { GET as getStats } from '@/apps/dashboard/app/api/v1/ai/decisions/stats/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    constructor(msg: string) { super(msg) }
  },
}))

jest.mock('@/lib/analytics/track', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    auditLog: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}))

const SAMPLE_DECISION = {
  id: 'aud_abc123',
  entityId: 'deal_x',
  changedBy: 'system',
  changeSummary: 'ai_recommendation',
  beforeSnapshot: { context: 'deal_stage_change' },
  afterSnapshot: {
    type: 'sdr',
    action: 'recommend_outreach',
    confidence: 0.87,
    outcome: 'pending',
    reasoning_trace: 'Deal stalled for 7 days. Contact last active via email.',
  },
  createdAt: new Date('2026-04-01T10:00:00Z'),
}

function makeListReq(qs = '') {
  return new NextRequest(`http://localhost/api/v1/ai/decisions${qs}`, {
    headers: { authorization: 'Bearer t' },
  })
}

function makeDetailReq(id: string) {
  return new NextRequest(`http://localhost/api/v1/ai/decisions/${id}`, {
    headers: { authorization: 'Bearer t' },
  })
}

function makeOverrideReq(id: string, body: object) {
  return new NextRequest(`http://localhost/api/v1/ai/decisions/${id}/override`, {
    method: 'POST',
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeStatsReq(qs = '') {
  return new NextRequest(`http://localhost/api/v1/ai/decisions/stats${qs}`, {
    headers: { authorization: 'Bearer t' },
  })
}

describe('/api/v1/ai/decisions (M3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const ff = require('@/lib/feature-flags/tenant-feature')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    auth.handleLicenseError.mockReturnValue(null)
    ff.assertTenantFeatureEnabled.mockResolvedValue(undefined)
    db.prisma.auditLog.findMany.mockResolvedValue([SAMPLE_DECISION])
    db.prisma.auditLog.findFirst.mockResolvedValue(SAMPLE_DECISION)
    db.prisma.auditLog.count.mockResolvedValue(1)
    db.prisma.auditLog.create.mockResolvedValue({ id: 'aud_ovr1', createdAt: new Date() })
  })

  // ── List ─────────────────────────────────────────────────────────────────

  describe('GET /api/v1/ai/decisions (list)', () => {
    it('returns 200 with decisions array and pagination', async () => {
      const res = await listDecisions(makeListReq())
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(Array.isArray(json.decisions)).toBe(true)
      expect(json.pagination).toBeDefined()
      expect(json.pagination.total).toBeGreaterThanOrEqual(0)
    })

    it('maps afterSnapshot fields to response shape', async () => {
      const res = await listDecisions(makeListReq())
      const json = await res.json()
      const d = json.decisions[0]
      expect(d.type).toBe('sdr')
      expect(d.confidence).toBe(0.87)
      expect(d.outcome).toBe('pending')
    })

    it('returns 200 with empty list when no decisions', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.auditLog.findMany.mockResolvedValue([])
      db.prisma.auditLog.count.mockResolvedValue(0)
      const res = await listDecisions(makeListReq())
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.decisions).toHaveLength(0)
    })

    it('returns 500 on DB failure', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.auditLog.findMany.mockRejectedValue(new Error('DB error'))
      const res = await listDecisions(makeListReq())
      expect(res.status).toBe(500)
    })

    it('returns 403 FEATURE_DISABLED when m3_governance flag is off', async () => {
      const ff = require('@/lib/feature-flags/tenant-feature')
      ff.assertTenantFeatureEnabled.mockRejectedValueOnce(
        new ff.TenantFeatureDisabledError('Feature m3_governance is disabled')
      )
      const res = await listDecisions(makeListReq())
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.code).toBe('FEATURE_DISABLED')
    })
  })

  // ── Detail ────────────────────────────────────────────────────────────────

  describe('GET /api/v1/ai/decisions/[id] (detail)', () => {
    it('returns 200 with full decision detail and reasoning trace', async () => {
      const res = await getDecision(makeDetailReq('aud_abc123'), { params: { id: 'aud_abc123' } })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.id).toBe('aud_abc123')
      expect(json.reasoning_trace).toBe('Deal stalled for 7 days. Contact last active via email.')
      expect(json.confidence).toBe(0.87)
    })

    it('returns 404 when decision does not exist', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.auditLog.findFirst.mockResolvedValue(null)
      const res = await getDecision(makeDetailReq('nope'), { params: { id: 'nope' } })
      expect(res.status).toBe(404)
    })
  })

  // ── Override ──────────────────────────────────────────────────────────────

  describe('POST /api/v1/ai/decisions/[id]/override', () => {
    it('returns 201 with override record on valid override', async () => {
      const res = await overrideDecision(
        makeOverrideReq('aud_abc123', { outcome: 'rejected', override_reason: 'Context was wrong' }),
        { params: { id: 'aud_abc123' } }
      )
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.override.outcome).toBe('rejected')
      expect(json.override.override_reason).toBe('Context was wrong')
    })

    it('returns 422 when decision already overridden', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.auditLog.findFirst.mockResolvedValue({
        ...SAMPLE_DECISION,
        afterSnapshot: { ...SAMPLE_DECISION.afterSnapshot, outcome: 'overridden' },
      })
      const res = await overrideDecision(
        makeOverrideReq('aud_abc123', { outcome: 'accepted', override_reason: 'Ok' }),
        { params: { id: 'aud_abc123' } }
      )
      expect(res.status).toBe(422)
      const json = await res.json()
      expect(json.code).toBe('ALREADY_OVERRIDDEN')
    })

    it('returns 404 when decision not found', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.auditLog.findFirst.mockResolvedValue(null)
      const res = await overrideDecision(
        makeOverrideReq('ghost', { outcome: 'rejected', override_reason: 'Wrong' }),
        { params: { id: 'ghost' } }
      )
      expect(res.status).toBe(404)
    })

    it('returns 400 on missing override_reason', async () => {
      const res = await overrideDecision(
        makeOverrideReq('aud_abc123', { outcome: 'accepted' }),
        { params: { id: 'aud_abc123' } }
      )
      expect(res.status).toBe(400)
    })
  })

  // ── Stats ─────────────────────────────────────────────────────────────────

  describe('GET /api/v1/ai/decisions/stats', () => {
    it('returns 200 with acceptance_rate_pct, override_rate_pct, and by_type', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.auditLog.findMany.mockResolvedValue([
        { ...SAMPLE_DECISION, afterSnapshot: { ...SAMPLE_DECISION.afterSnapshot, outcome: 'accepted' } },
        { ...SAMPLE_DECISION, id: 'aud2', afterSnapshot: { ...SAMPLE_DECISION.afterSnapshot, outcome: 'rejected' } },
      ])
      db.prisma.auditLog.count.mockResolvedValue(1) // overrides count
      const res = await getStats(makeStatsReq())
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.total_decisions).toBe(2)
      expect(json.accepted).toBe(1)
      expect(json.rejected).toBe(1)
      expect(typeof json.acceptance_rate_pct).toBe('number')
      expect(Array.isArray(json.by_type)).toBe(true)
    })

    it('returns null rates when no decisions exist', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.auditLog.findMany.mockResolvedValue([])
      db.prisma.auditLog.count.mockResolvedValue(0)
      const res = await getStats(makeStatsReq())
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.acceptance_rate_pct).toBeNull()
      expect(json.total_decisions).toBe(0)
    })

    it('returns 500 on unexpected DB failure', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.auditLog.findMany.mockRejectedValue(new Error('DB error'))
      const res = await getStats(makeStatsReq())
      expect(res.status).toBe(500)
    })
  })
})
