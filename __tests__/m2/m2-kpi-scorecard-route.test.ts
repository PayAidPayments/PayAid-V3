/**
 * M2 smoke — GET /api/v1/kpi/scorecard
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getScorecard } from '@/apps/dashboard/app/api/v1/kpi/scorecard/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: { count: jest.fn() },
    auditLog: { count: jest.fn(), findMany: jest.fn() },
    workflowExecution: { count: jest.fn() },
    aICall: { count: jest.fn() },
  },
}))

function makeReq(qs = '') {
  return new NextRequest(`http://localhost/api/v1/kpi/scorecard${qs}`, {
    headers: { authorization: 'Bearer t' },
  })
}

describe('GET /api/v1/kpi/scorecard (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    auth.handleLicenseError.mockImplementation(() => null)

    // Default all counts to realistic values
    db.prisma.deal.count.mockResolvedValue(10)
    db.prisma.auditLog.count.mockResolvedValue(5)
    db.prisma.auditLog.findMany.mockResolvedValue([])
    db.prisma.workflowExecution.count.mockResolvedValue(20)
    db.prisma.aICall.count.mockResolvedValue(8)
  })

  it('returns 200 with all 8 metric groups and schema_version', async () => {
    const db = require('@/lib/db/prisma')
    // won deal count
    db.prisma.deal.count
      .mockResolvedValueOnce(10)   // total deals
      .mockResolvedValueOnce(3)    // won deals

    const res = await getScorecard(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.schema_version).toBe('1.0')
    expect(body.window_days).toBe(7)
    expect(body.metrics).toHaveProperty('signal_to_first_action')
    expect(body.metrics).toHaveProperty('deal_stage_velocity')
    expect(body.metrics).toHaveProperty('quote_to_invoice_conversion')
    expect(body.metrics).toHaveProperty('automation_reliability')
    expect(body.metrics).toHaveProperty('unibox_sla')
    expect(body.metrics).toHaveProperty('ai_suggestion_acceptance')
    expect(body.metrics).toHaveProperty('sdr_sequence_runs')
    expect(body.metrics).toHaveProperty('sequence_enrollment_conversion')
  })

  it('respects ?window_days=30', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.count.mockResolvedValue(0)

    const res = await getScorecard(makeReq('?window_days=30'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.window_days).toBe(30)
  })

  it('caps window_days at 90', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.count.mockResolvedValue(0)

    const res = await getScorecard(makeReq('?window_days=999'))
    const body = await res.json()

    expect(body.window_days).toBe(90)
  })

  it('returns null for metrics when no data', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.count.mockResolvedValue(0)
    db.prisma.aICall.count.mockResolvedValue(0)
    db.prisma.workflowExecution.count.mockResolvedValue(0)
    db.prisma.auditLog.count.mockResolvedValue(0)
    db.prisma.auditLog.findMany.mockResolvedValue([])

    const res = await getScorecard(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.metrics.deal_stage_velocity.win_rate_pct).toBeNull()
    expect(body.metrics.ai_suggestion_acceptance.ai_acceptance_rate_pct).toBeNull()
    expect(body.metrics.automation_reliability.failure_rate_pct).toBeNull()
    expect(body.metrics.signal_to_first_action.median_ms).toBeNull()
    expect(body.metrics.quote_to_invoice_conversion.median_hours).toBeNull()
  })

  it('marks automation as needs_review when failure rate >= 5%', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.count.mockResolvedValue(0)
    db.prisma.aICall.count.mockResolvedValue(0)
    db.prisma.auditLog.count.mockResolvedValue(0)
    db.prisma.auditLog.findMany.mockResolvedValue([])
    db.prisma.workflowExecution.count
      .mockResolvedValueOnce(100)   // total runs
      .mockResolvedValueOnce(10)    // failed runs (10%)
      .mockResolvedValueOnce(0)     // sdr runs
      .mockResolvedValueOnce(0)     // enrollment total
      .mockResolvedValueOnce(0)     // enrollment positive
      .mockResolvedValueOnce(0)     // enrollment with reply

    const res = await getScorecard(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.metrics.automation_reliability.failure_rate_pct).toBe(10)
    expect(body.metrics.automation_reliability.status).toBe('needs_review')
  })

  it('returns sequence_enrollment_conversion with correct rates', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.count.mockResolvedValue(0)
    db.prisma.aICall.count.mockResolvedValue(0)
    db.prisma.auditLog.count.mockResolvedValue(0)
    db.prisma.auditLog.findMany.mockResolvedValue([])
    db.prisma.workflowExecution.count
      .mockResolvedValueOnce(0)     // total runs
      .mockResolvedValueOnce(0)     // failed runs
      .mockResolvedValueOnce(0)     // sdr runs
      .mockResolvedValueOnce(40)    // enrollment total
      .mockResolvedValueOnce(6)     // enrollment positive (15%)
      .mockResolvedValueOnce(20)    // enrollment with reply (50%)

    const res = await getScorecard(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    const m = body.metrics.sequence_enrollment_conversion
    expect(m.total_enrollments).toBe(40)
    expect(m.positive_replies).toBe(6)
    expect(m.replied_enrollments).toBe(20)
    expect(m.conversion_rate_pct).toBe(15)
    expect(m.reply_rate_pct).toBe(50)
    expect(m.status).toBe('on_target') // 15% >= 10% threshold
  })

  it('returns 500 on unexpected error', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.count.mockRejectedValue(new Error('db error'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await getScorecard(makeReq())
    expect(res.status).toBe(500)
    spy.mockRestore()
  })
})
