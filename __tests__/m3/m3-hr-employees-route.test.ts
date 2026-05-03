/**
 * M3 smoke — HR module: /api/hr/employees & /api/hr/departments & /api/hr/payroll/runs
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as listEmployees, POST as createEmployee } from '@/apps/dashboard/app/api/hr/employees/route'
import { GET as listDepartments } from '@/apps/dashboard/app/api/hr/departments/route'
import { GET as listPayrollRuns } from '@/apps/dashboard/app/api/hr/payroll/runs/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    employee: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
    department: { findMany: jest.fn(), count: jest.fn(), create: jest.fn() },
    payrollRun: { findMany: jest.fn(), count: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}))

const SAMPLE_EMPLOYEE = {
  id: 'emp_1',
  employeeCode: 'EMP001',
  firstName: 'Priya',
  lastName: 'Sharma',
  officialEmail: 'priya@acme.com',
  status: 'ACTIVE',
  department: { id: 'dept_1', name: 'Engineering', code: 'ENG' },
  designation: { id: 'des_1', name: 'SDE', code: 'SDE' },
  location: null,
  manager: null,
  createdAt: new Date('2026-01-01'),
}

const SAMPLE_DEPT = {
  id: 'dept_1',
  name: 'Engineering',
  code: 'ENG',
  isActive: true,
  _count: { employees: 12 },
}

const SAMPLE_PAYROLL_RUN = {
  id: 'pr_1',
  tenantId: 'tn_1',
  employeeId: 'emp_1',
  payoutStatus: 'PENDING',
  grossPay: 150000,
  netPay: 120000,
  employee: { id: 'emp_1', firstName: 'Priya', lastName: 'Sharma', employeeCode: 'EMP001' },
}

function makeReq(path: string, qs = '') {
  return new NextRequest(`http://localhost${path}${qs}`, {
    headers: { authorization: 'Bearer t' },
  })
}

function makePostReq(path: string, body: object) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('HR module smoke tests (M3)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    auth.handleLicenseError.mockReturnValue(null)
    db.prisma.employee.findMany.mockResolvedValue([SAMPLE_EMPLOYEE])
    db.prisma.employee.count.mockResolvedValue(1)
    db.prisma.employee.create.mockResolvedValue({ ...SAMPLE_EMPLOYEE, id: 'emp_new' })
    db.prisma.employee.findFirst.mockResolvedValue(null) // no duplicates
    db.prisma.auditLog.create.mockResolvedValue({ id: 'al_1' })
    db.prisma.department.findMany.mockResolvedValue([SAMPLE_DEPT])
    db.prisma.department.count.mockResolvedValue(1)
    db.prisma.payrollRun.findMany.mockResolvedValue([SAMPLE_PAYROLL_RUN])
    db.prisma.payrollRun.count.mockResolvedValue(1)
  })

  // ── Employees ─────────────────────────────────────────────────────────────

  describe('GET /api/hr/employees', () => {
    it('returns 200 with employees array and pagination', async () => {
      const res = await listEmployees(makeReq('/api/hr/employees'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(Array.isArray(json.employees)).toBe(true)
      expect(json.employees).toHaveLength(1)
      expect(json.pagination.total).toBe(1)
    })

    it('returns 200 with empty list when no employees', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.employee.findMany.mockResolvedValue([])
      db.prisma.employee.count.mockResolvedValue(0)
      const res = await listEmployees(makeReq('/api/hr/employees'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.employees).toHaveLength(0)
    })

    it('filters by status query param', async () => {
      const db = require('@/lib/db/prisma')
      await listEmployees(makeReq('/api/hr/employees', '?status=ACTIVE'))
      expect(db.prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        })
      )
    })

    it('returns 403 when HR module license denied', async () => {
      const auth = require('@/lib/middleware/auth')
      const licenseErr = { moduleId: 'hr', message: 'HR not licensed' }
      auth.requireModuleAccess.mockRejectedValueOnce(licenseErr)
      auth.handleLicenseError.mockReturnValueOnce(
        new Response(JSON.stringify({ error: 'HR not licensed' }), { status: 403 })
      )
      const res = await listEmployees(makeReq('/api/hr/employees'))
      expect(res.status).toBe(403)
    })

    it('returns 500 on unexpected DB error', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.employee.findMany.mockRejectedValue(new Error('DB timeout'))
      const res = await listEmployees(makeReq('/api/hr/employees'))
      expect(res.status).toBe(500)
    })
  })

  describe('POST /api/hr/employees', () => {
    const VALID_EMPLOYEE_BODY = {
      firstName: 'Rahul',
      lastName: 'Gupta',
      officialEmail: 'rahul@acme.com',
      mobileNumber: '9876543210',
      joiningDate: '2026-04-01T00:00:00.000Z',
      status: 'ACTIVE',
    }

    it('returns 201 when employee is created successfully', async () => {
      const res = await createEmployee(makePostReq('/api/hr/employees', VALID_EMPLOYEE_BODY))
      expect(res.status).toBe(201)
      const json = await res.json()
      // Route returns the employee object directly (not wrapped)
      expect(json.id).toBeDefined()
    })

    it('returns 400 on missing required fields', async () => {
      const res = await createEmployee(
        makePostReq('/api/hr/employees', { firstName: 'Rahul' })
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 on invalid email', async () => {
      const res = await createEmployee(
        makePostReq('/api/hr/employees', {
          ...VALID_EMPLOYEE_BODY,
          officialEmail: 'not-an-email',
        })
      )
      expect(res.status).toBe(400)
    })
  })

  // ── Departments ───────────────────────────────────────────────────────────

  describe('GET /api/hr/departments', () => {
    it('returns 200 with departments list and employee count', async () => {
      const res = await listDepartments(makeReq('/api/hr/departments'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(Array.isArray(json.departments)).toBe(true)
      expect(json.departments[0]._count?.employees).toBe(12)
    })

    it('returns 200 with empty departments list', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.department.findMany.mockResolvedValue([])
      const res = await listDepartments(makeReq('/api/hr/departments'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.departments).toHaveLength(0)
    })
  })

  // ── Payroll Runs ─────────────────────────────────────────────────────────

  describe('GET /api/hr/payroll/runs', () => {
    it('returns 200 with payroll runs and pagination', async () => {
      const res = await listPayrollRuns(makeReq('/api/hr/payroll/runs'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(Array.isArray(json.runs)).toBe(true)
      expect(json.runs).toHaveLength(1)
      expect(json.pagination.total).toBe(1)
    })

    it('returns 500 on DB failure', async () => {
      const db = require('@/lib/db/prisma')
      db.prisma.payrollRun.findMany.mockRejectedValue(new Error('DB error'))
      const res = await listPayrollRuns(makeReq('/api/hr/payroll/runs'))
      expect(res.status).toBe(500)
    })
  })
})
