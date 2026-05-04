import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as listApprovals } from '@/apps/dashboard/app/api/automation/workflows/approvals/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((err: unknown) => err),
}))

jest.mock('@/lib/workflow/approvals', () => ({
  listPendingWorkflowApprovals: jest.fn(),
}))

describe('workflow approvals list route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns pending approvals for tenant', async () => {
    const auth = require('@/lib/middleware/auth')
    const approvals = require('@/lib/workflow/approvals')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    approvals.listPendingWorkflowApprovals.mockResolvedValue([
      { id: 'exec_1', status: 'PENDING_APPROVAL', workflow: { name: 'wf' } },
    ])

    const req = new NextRequest('http://localhost/api/automation/workflows/approvals', {
      headers: { authorization: 'Bearer token' },
    })

    const res = await listApprovals(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.approvals).toHaveLength(1)
    expect(body.approvals[0].id).toBe('exec_1')
    expect(approvals.listPendingWorkflowApprovals).toHaveBeenCalledWith('tn_1')
  })
})
