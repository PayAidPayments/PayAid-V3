import { NextResponse } from 'next/server'
import { z } from 'zod'
import { wrapAiRoute } from '@/lib/security/ai-policy/wrap-ai-route'
import {
  getCustomerFlowDraft,
  recordCustomerFlowApproval,
} from '@/lib/ai/customer-specialists'

const bodySchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
})

function hasApproverRole(roles: string[]): boolean {
  return roles.some((role) =>
    ['manager', 'admin', 'owner', 'super_admin'].includes(role.toLowerCase())
  )
}

/**
 * POST /api/ai/customer-flows/drafts/[draftId]/approve
 * Approve or reject a pending customer-flow draft.
 * Approval does NOT send, file, or pay — it only marks the draft accepted for human follow-up.
 */
export const POST = wrapAiRoute(
  {
    surface: 'chat',
    route: '/api/ai/customer-flows/drafts/[draftId]/approve',
    moduleId: 'ai-studio',
    moduleIds: ['ai-studio', 'finance', 'sales', 'crm'],
    bodySchema,
    modeFrom: () => 'draft',
    promptFrom: (body) => `customer flow draft ${body.decision}`,
  },
  async ({ request, body, auth, finalize }) => {
    const draftId = request.nextUrl.pathname.split('/').slice(-2)[0]
    if (!draftId) {
      return NextResponse.json({ error: 'draftId required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    if (!hasApproverRole(auth.roles)) {
      return NextResponse.json(
        {
          error: 'Manager/admin/owner role required to approve drafts',
          code: 'ROLE_DENIED',
        },
        { status: 403 }
      )
    }

    const existing = await getCustomerFlowDraft({
      tenantId: auth.tenantId,
      draftId,
    })
    if (!existing) {
      return NextResponse.json({ error: 'Draft not found', code: 'DRAFT_NOT_FOUND' }, { status: 404 })
    }
    if (existing.approvalStatus !== 'pending_approval') {
      return NextResponse.json(
        {
          error: `Draft is not pending approval (current: ${existing.approvalStatus})`,
          code: 'DRAFT_NOT_PENDING',
        },
        { status: 409 }
      )
    }

    if (existing.flow === 'gst-invoice-draft' && !auth.licensedModules.includes('finance')) {
      return NextResponse.json(
        { error: 'Finance module required to approve GST drafts', code: 'MODULE_NOT_LICENSED' },
        { status: 403 }
      )
    }

    const updated = await recordCustomerFlowApproval({
      auth: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        roles: auth.roles,
        licensedModules: auth.licensedModules,
      },
      draft: existing,
      decision: body.decision,
      rejectionReason: body.rejectionReason,
    })

    const finalized = await finalize({
      text: `draft ${draftId} ${body.decision}`,
      modelProvider: 'customer-orchestrator',
    })

    return NextResponse.json({
      draft: updated,
      executable: false,
      note:
        body.decision === 'approved'
          ? 'Approved for human follow-up only. Not sent, filed, or paid.'
          : 'Draft rejected.',
      interactionId: finalized.interactionId,
      runtimeVersion: finalized.runtimeVersion,
    })
  }
)
