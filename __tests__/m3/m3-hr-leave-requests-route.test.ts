/**
 * M3.3 smoke — HR Leave Requests
 *   GET  /api/hr/leave/requests
 *   POST /api/hr/leave/requests
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import {
  GET as listLeaveRequests,
  POST as createLeaveRequest,
} from '@/apps/dashboard/app/api/hr/leave/requests/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    leaveRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    employee: { findFirst: jest.fn() },
    leaveType: { findFirst: jest.fn() },
    leaveBalance: { findFirst: jest.fn() },
    leavePolicy: { findFirst: jest.fn() },
  },
}))

const NOW_ISO = new Date('2026-05-01T09:00:00.000Z').toISOString()
const END_ISO = new Date('2026-05-03T09:00:00.000Z').toISOString()

const SAMPLE_REQUEST = {
  id: 'lr_1',
  tenantId: 'tn_hr',
  employeeId: 'emp_1',
  leaveTypeId: 'lt_casual',
  startDate: new Date(NOW_ISO),
  endDate: new Date(END_ISO),
  isHalfDay: false,
  halfDayType: null,
  reason: 'Personal work',
  numberOfDays: 3,
  status: 'PENDING',
  supportingDocumentUrl: null,
  approverId: null,
  createdAt: new Date('2026-04-10'),
  employee: { id: 'emp_1', employeeCode: 'EMP001', firstName: 'Arjun', lastName: 'Sharma' },
  leaveType: { id: 'lt_casual', name: 'Casual Leave', code: 'CL' },
}

const SAMPLE_EMPLOYEE = {
  id: 'emp_1',
  tenantId: 'tn_hr',
  firstName: 'Arjun',
  lastName: 'Sharma',
  manager: null,
}

const SAMPLE_LEAVE_TYPE = { id: 'lt_casual', name: 'Casual Leave', code: 'CL', tenantId: 'tn_hr' }

function makeGetReq(qs = '') {
  return new NextRequest(`http://localhost/api/hr/leave/requests${qs}`, {
    headers: { cookie: 'token=hr.user.jwt' },
  })
}

function makePostReq(body: object) {
  return new NextRequest('http://localhost/api/hr/leave/requests', {
    method: 'POST',
    headers: { cookie: 'token=hr.user.jwt', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  employeeId: 'emp_1',
  leaveTypeId: 'lt_casual',
  startDate: NOW_ISO,
  endDate: END_ISO,
  isHalfDay: false,
  reason: 'Personal work',
}

describe('GET /api/hr/leave/requests (M3.3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_hr', userId: 'usr_1' })

    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findMany.mockResolvedValue([SAMPLE_REQUEST])
    db.prisma.leaveRequest.count.mockResolvedValue(1)
  })

  it('200 — returns paginated leave request list', async () => {
    const req = makeGetReq()
    const res = await listLeaveRequests(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.requests)).toBe(true)
    expect(body.requests[0].id).toBe('lr_1')
    expect(body.pagination.total).toBe(1)
  })

  it('200 — returns empty list when no requests', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findMany.mockResolvedValue([])
    db.prisma.leaveRequest.count.mockResolvedValue(0)
    const req = makeGetReq()
    const res = await listLeaveRequests(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.requests).toHaveLength(0)
    expect(body.pagination.total).toBe(0)
  })

  it('200 — filters by status queryParam', async () => {
    const req = makeGetReq('?status=PENDING')
    const res = await listLeaveRequests(req)
    expect(res.status).toBe(200)
    const db = require('@/lib/db/prisma')
    const callArgs = db.prisma.leaveRequest.findMany.mock.calls[0][0]
    expect(callArgs.where.status).toBe('PENDING')
  })

  it('500 — DB error returns 500', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.findMany.mockRejectedValue(new Error('DB down'))
    const req = makeGetReq()
    const res = await listLeaveRequests(req)
    expect(res.status).toBe(500)
  })
})

describe('POST /api/hr/leave/requests (M3.3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_hr', userId: 'usr_1' })

    const db = require('@/lib/db/prisma')
    db.prisma.employee.findFirst.mockResolvedValue(SAMPLE_EMPLOYEE)
    db.prisma.leaveType.findFirst.mockResolvedValue(SAMPLE_LEAVE_TYPE)
    db.prisma.leaveBalance.findFirst.mockResolvedValue(null) // no balance record → skip balance check
    db.prisma.leavePolicy.findFirst.mockResolvedValue(null)
    db.prisma.leaveRequest.create.mockResolvedValue({
      ...SAMPLE_REQUEST,
      status: 'PENDING',
    })
  })

  it('201 — creates leave request successfully', async () => {
    const req = makePostReq(VALID_BODY)
    const res = await createLeaveRequest(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('lr_1')
    expect(body.status).toBe('PENDING')
  })

  it('400 — Zod validation error for missing reason', async () => {
    const req = makePostReq({ ...VALID_BODY, reason: '' })
    const res = await createLeaveRequest(req)
    expect(res.status).toBe(400)
  })

  it('400 — insufficient leave balance', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveBalance.findFirst.mockResolvedValue({ balance: 1, asOfDate: new Date() })
    const req = makePostReq(VALID_BODY) // 3-day request but only 1 day balance
    const res = await createLeaveRequest(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/insufficient/i)
  })

  it('404 — employee not in tenant', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.employee.findFirst.mockResolvedValue(null)
    const req = makePostReq(VALID_BODY)
    const res = await createLeaveRequest(req)
    expect(res.status).toBe(404)
  })

  it('404 — leave type not found', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveType.findFirst.mockResolvedValue(null)
    const req = makePostReq(VALID_BODY)
    const res = await createLeaveRequest(req)
    expect(res.status).toBe(404)
  })

  it('500 — DB error returns 500', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.leaveRequest.create.mockRejectedValue(new Error('DB write failed'))
    const req = makePostReq(VALID_BODY)
    const res = await createLeaveRequest(req)
    expect(res.status).toBe(500)
  })
})
