import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { listPendingWorkflowApprovals } from '@/lib/workflow/approvals'

// GET /api/automation/workflows/approvals - list pending workflow approvals
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const approvals = await listPendingWorkflowApprovals(tenantId)
    return NextResponse.json({ success: true, approvals })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('List workflow approvals error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list workflow approvals' },
      { status: 500 }
    )
  }
}
