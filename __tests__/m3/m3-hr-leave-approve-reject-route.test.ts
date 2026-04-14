/**
 * M3.3 smoke — HR Leave Request Approval/Rejection
 *   PUT /api/hr/leave/requests/[id]/approve
 *   PUT /api/hr/leave/requests/[id]/reject
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { PUT as approveLeave } from '@/apps/dashboard/app/api/hr/leave/requests/[id]/approve/route'
import { PUT as rejectLeave } from '@/apps/dashboard/app/api/hr/leave/requests/[id]/reject/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    leaveRequest: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    leaveBalance: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

const PENDING_REQUEST = {
  id: 'lr_1',
  tenantId: 'tn_hr',
  employeeId: 'emp_1',
  leaveTypeId: 'lt_casual',
  status: 'PENDING',
  approverId: null,
  days: 3,
  employee: { id: 'emp_1', employeeCode: 'EMP001', firstName: 'Arjun', lastName: 'Sharma' },
  leaveType: { id: 'lt_casual', name: 'Casual Leave', code: 'CL' },
}

const APPROVED_REQUEST = { ...PENDING_REQUEST, status: 'APPROVED', approvedAt: new Date() }
const REJECTED_REQUEST = { ...PENDING_REQUEST, status: 'REJECTED', rejectionReason: 'Insufficient cover' }

function makePutReq(id: string, body?: object) {
  return new NextRequest(`http://localhost/api/hr/leave/requests/${id}/approve`, {
    method: 'PUT',
    headers: { cookie: 'token=hr.mgr.jwt', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : '{}',
  })
}

function makeRejectReq(id: string, body?: object) {
  return new NextRequest(`http://localhost/api/hr/leave/requests/${id}/reject`, {
    method: 'PUT',
    headers: { cookie: 'token=hr.mgr.jwt', 'content-type': 'application/json' },
    body: JSON.stringify(body ?? { rejectionReason: 'Insufficient coverage during requested period' }),
  })
}

describe('PUT /api/hr/leave/requests/[id]/approve (M3.3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_hr', userId: 'mgr_1' })

    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findFirst.mockResolvedValue(PENDING_REQUEST)
    db.prisma.leaveRequest.update.mockResolvedValue(APPROVED_REQUEST)
    db.prisma.leaveBalance.findFirst.mockResolvedValue(null)
    db.prisma.leaveBalance.create.mockResolvedValue({})
  })

  it('200 — approves a PENDING leave request', async () => {
    const req = makePutReq('lr_1')
    const res = await approveLeave(req, { params: Promise.resolve({ id: 'lr_1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('APPROVED')
    const db = require('@/lib/db/prisma')
    expect(db.prisma.leaveRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lr_1' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      }),
    )
  })

  it('200 — deducts leave balance when balance record exists', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveBalance.findFirst.mockResolvedValue({
      balance: 10,
      asOfDate: new Date(),
      employeeId: 'emp_1',
      leaveTypeId: 'lt_casual',
    })
    const req = makePutReq('lr_1')
    const res = await approveLeave(req, { params: Promise.resolve({ id: 'lr_1' }) })
    expect(res.status).toBe(200)
    expect(db.prisma.leaveBalance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ balance: 7 }), // 10 - 3 days
      }),
    )
  })

  it('400 — already-approved request returns 400', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findFirst.mockResolvedValue({ ...PENDING_REQUEST, status: 'APPROVED' })
    const req = makePutReq('lr_1')
    const res = await approveLeave(req, { params: Promise.resolve({ id: 'lr_1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/already/i)
  })

  it('403 — approver mismatch returns 403', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findFirst.mockResolvedValue({
      ...PENDING_REQUEST,
      approverId: 'other_mgr',
    })
    const req = makePutReq('lr_1')
    const res = await approveLeave(req, { params: Promise.resolve({ id: 'lr_1' }) })
    expect(res.status).toBe(403)
  })

  it('404 — leave request not found', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findFirst.mockResolvedValue(null)
    const req = makePutReq('lr_missing')
    const res = await approveLeave(req, { params: Promise.resolve({ id: 'lr_missing' }) })
    expect(res.status).toBe(404)
  })

  it('500 — DB error returns 500', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.update.mockRejectedValue(new Error('DB write failed'))
    const req = makePutReq('lr_1')
    const res = await approveLeave(req, { params: Promise.resolve({ id: 'lr_1' }) })
    expect(res.status).toBe(500)
  })
})

describe('PUT /api/hr/leave/requests/[id]/reject (M3.3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_hr', userId: 'mgr_1' })

    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findFirst.mockResolvedValue(PENDING_REQUEST)
    db.prisma.leaveRequest.update.mockResolvedValue(REJECTED_REQUEST)
  })

  it('200 — rejects a PENDING leave request with reason', async () => {
    const req = makeRejectReq('lr_1')
    const res = await rejectLeave(req, { params: Promise.resolve({ id: 'lr_1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('REJECTED')
    const db = require('@/lib/db/prisma')
    expect(db.prisma.leaveRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REJECTED' }),
      }),
    )
  })

  it('400 — empty rejectionReason fails Zod validation', async () => {
    const req = makeRejectReq('lr_1', { rejectionReason: '' })
    const res = await rejectLeave(req, { params: Promise.resolve({ id: 'lr_1' }) })
    expect(res.status).toBe(400)
  })

  it('400 — already-rejected request returns 400', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findFirst.mockResolvedValue({ ...PENDING_REQUEST, status: 'REJECTED' })
    const req = makeRejectReq('lr_1')
    const res = await rejectLeave(req, { params: Promise.resolve({ id: 'lr_1' }) })
    expect(res.status).toBe(400)
  })

  it('404 — leave request not found', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findFirst.mockResolvedValue(null)
    const req = makeRejectReq('lr_missing')
    const res = await rejectLeave(req, { params: Promise.resolve({ id: 'lr_missing' }) })
    expect(res.status).toBe(404)
  })

  it('500 — DB error returns 500', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.update.mockRejectedValue(new Error('DB write failed'))
    const req = makeRejectReq('lr_1')
    const res = await rejectLeave(req, { params: Promise.resolve({ id: 'lr_1' }) })
    expect(res.status).toBe(500)
  })
})
