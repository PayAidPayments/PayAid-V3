/**
 * M2 smoke — PATCH /api/v1/sequences/[id]/enrollments/[enrollmentId]/reply
 *
 * Tests reply-status recording for sequence enrollments (WorkflowExecution).
 * Used to drive the sequence enrollment-to-positive-reply conversion KPI.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { PATCH } from '@/apps/dashboard/app/api/v1/sequences/[id]/enrollments/[enrollmentId]/reply/route'

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

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    workflowExecution: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue(undefined),
    },
  },
}))

jest.mock('@/lib/analytics/track', () => ({
  trackEvent: jest.fn(),
}))

function makeReq(sequenceId: string, enrollmentId: string, body: unknown) {
  return new NextRequest(
    `http://localhost/api/v1/sequences/${sequenceId}/enrollments/${enrollmentId}/reply`,
    {
      method: 'PATCH',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

describe('PATCH /api/v1/sequences/[id]/enrollments/[enrollmentId]/reply (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Re-establish default passing implementations after clearAllMocks (clearAllMocks
    // does not reset mockRejectedValue/mockImplementation set in individual tests).
    const auth = require('@/lib/middleware/auth')
    const flags = require('@/lib/feature-flags/tenant-feature')
    const perms = require('@/lib/middleware/permissions')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    flags.assertTenantFeatureEnabled.mockResolvedValue(undefined)
    perms.assertAnyPermission.mockResolvedValue(undefined)
  })

  it('records a POSITIVE reply and returns 200 payload', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.workflowExecution.findFirst.mockResolvedValue({
      id: 'enr_1',
      workflowId: 'seq_1',
      replyStatus: null,
    })
    db.prisma.workflowExecution.update.mockResolvedValue({
      id: 'enr_1',
      replyStatus: 'POSITIVE',
      repliedAt: new Date('2026-04-08T10:00:00.000Z'),
      workflowId: 'seq_1',
      status: 'COMPLETED',
    })

    const req = makeReq('seq_1', 'enr_1', { reply_status: 'POSITIVE' })
    const res = await PATCH(req, { params: { id: 'seq_1', enrollmentId: 'enr_1' } })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.enrollment_id).toBe('enr_1')
    expect(body.sequence_id).toBe('seq_1')
    expect(body.reply_status).toBe('POSITIVE')
    expect(body.status).toBe('COMPLETED')
    expect(db.prisma.workflowExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'enr_1' },
        data: expect.objectContaining({ replyStatus: 'POSITIVE' }),
      }),
    )
  })

  it('records a BOUNCED reply and returns 200', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.workflowExecution.findFirst.mockResolvedValue({
      id: 'enr_2',
      workflowId: 'seq_1',
      replyStatus: null,
    })
    db.prisma.workflowExecution.update.mockResolvedValue({
      id: 'enr_2',
      replyStatus: 'BOUNCED',
      repliedAt: new Date('2026-04-08T11:00:00.000Z'),
      workflowId: 'seq_1',
      status: 'COMPLETED',
    })

    const req = makeReq('seq_1', 'enr_2', { reply_status: 'BOUNCED', notes: 'Email hard bounced' })
    const res = await PATCH(req, { params: { id: 'seq_1', enrollmentId: 'enr_2' } })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.reply_status).toBe('BOUNCED')
  })

  it('returns 404 when enrollment is not found', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.workflowExecution.findFirst.mockResolvedValue(null)

    const req = makeReq('seq_1', 'enr_missing', { reply_status: 'POSITIVE' })
    const res = await PATCH(req, { params: { id: 'seq_1', enrollmentId: 'enr_missing' } })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Enrollment not found')
  })

  it('returns 400 on invalid reply_status value', async () => {
    const req = makeReq('seq_1', 'enr_1', { reply_status: 'INVALID_STATUS' })
    const res = await PATCH(req, { params: { id: 'seq_1', enrollmentId: 'enr_1' } })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 403 FEATURE_DISABLED when feature flag is off', async () => {
    const flags = require('@/lib/feature-flags/tenant-feature')
    flags.assertTenantFeatureEnabled.mockRejectedValue(
      new flags.TenantFeatureDisabledError('m0_ai_native_core'),
    )

    const req = makeReq('seq_1', 'enr_1', { reply_status: 'POSITIVE' })
    const res = await PATCH(req, { params: { id: 'seq_1', enrollmentId: 'enr_1' } })
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('FEATURE_DISABLED')
  })

  it('returns 403 PERMISSION_DENIED when caller lacks sequence:write', async () => {
    const perms = require('@/lib/middleware/permissions')
    perms.assertAnyPermission.mockRejectedValue(new perms.PermissionDeniedError('denied'))

    const req = makeReq('seq_1', 'enr_1', { reply_status: 'POSITIVE' })
    const res = await PATCH(req, { params: { id: 'seq_1', enrollmentId: 'enr_1' } })
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('PERMISSION_DENIED')
  })

  it('returns 500 on unexpected DB error', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.workflowExecution.findFirst.mockRejectedValue(new Error('db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = makeReq('seq_1', 'enr_1', { reply_status: 'POSITIVE' })
    const res = await PATCH(req, { params: { id: 'seq_1', enrollmentId: 'enr_1' } })

    expect(res.status).toBe(500)
    spy.mockRestore()
  })
})
