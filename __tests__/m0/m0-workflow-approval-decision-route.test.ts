import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as decideApproval } from '@/apps/dashboard/app/api/automation/workflows/approvals/[executionId]/decision/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((err: unknown) => err),
}))

jest.mock('@/lib/workflow/approvals', () => ({
  decideWorkflowApproval: jest.fn(),
}))

describe('workflow approval decision route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns success payload for approve decision', async () => {
    const auth = require('@/lib/middleware/auth')
    const approvals = require('@/lib/workflow/approvals')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    approvals.decideWorkflowApproval.mockResolvedValue({
      status: 'APPROVED',
      rerunExecutionId: 'exec_rerun_1',
    })

    const req = new NextRequest('http://localhost/api/automation/workflows/approvals/exec_1/decision', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({ decision: 'APPROVE', approvedStepIds: ['step_1'] }),
    })

    const res = await decideApproval(req, { params: Promise.resolve({ executionId: 'exec_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.result.status).toBe('APPROVED')
    expect(approvals.decideWorkflowApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tn_1',
        executionId: 'exec_1',
        decision: 'APPROVE',
        userId: 'usr_1',
      })
    )
  })

  it('returns success payload for reject decision', async () => {
    const auth = require('@/lib/middleware/auth')
    const approvals = require('@/lib/workflow/approvals')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    approvals.decideWorkflowApproval.mockResolvedValue({
      status: 'REJECTED',
      rerunExecutionId: null,
    })

    const req = new NextRequest('http://localhost/api/automation/workflows/approvals/exec_1/decision', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({ decision: 'REJECT', note: 'No' }),
    })

    const res = await decideApproval(req, { params: Promise.resolve({ executionId: 'exec_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.result.status).toBe('REJECTED')
    expect(approvals.decideWorkflowApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tn_1',
        executionId: 'exec_1',
        decision: 'REJECT',
        userId: 'usr_1',
        note: 'No',
      })
    )
  })

  it('returns 404 when execution is not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const approvals = require('@/lib/workflow/approvals')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    approvals.decideWorkflowApproval.mockRejectedValue(new Error('Workflow execution not found'))

    const req = new NextRequest('http://localhost/api/automation/workflows/approvals/exec_missing/decision', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({ decision: 'APPROVE' }),
    })

    const res = await decideApproval(req, { params: Promise.resolve({ executionId: 'exec_missing' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/not found/i)
  })

  it('returns 409 when execution is not pending approval', async () => {
    const auth = require('@/lib/middleware/auth')
    const approvals = require('@/lib/workflow/approvals')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    approvals.decideWorkflowApproval.mockRejectedValue(
      new Error('Workflow execution is not pending approval')
    )

    const req = new NextRequest('http://localhost/api/automation/workflows/approvals/exec_1/decision', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({ decision: 'APPROVE' }),
    })

    const res = await decideApproval(req, { params: Promise.resolve({ executionId: 'exec_1' }) })
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/not pending/i)
  })

  it('returns 400 for invalid body', async () => {
    const auth = require('@/lib/middleware/auth')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/automation/workflows/approvals/exec_1/decision', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({ decision: 'MAYBE' }),
    })

    const res = await decideApproval(req, { params: Promise.resolve({ executionId: 'exec_1' }) })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Validation error')
  })
})
