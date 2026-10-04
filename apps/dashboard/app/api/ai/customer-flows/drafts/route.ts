import { NextResponse } from 'next/server'
import { wrapAiRoute } from '@/lib/security/ai-policy/wrap-ai-route'
import {
  listCustomerFlowDrafts,
  listCustomerOrchestratorRunbooks,
} from '@/lib/ai/customer-specialists'

/**
 * GET /api/ai/customer-flows/drafts
 * Lists latest customer-flow drafts (optionally pending approval) + runbook catalog.
 */
export const GET = wrapAiRoute(
  {
    surface: 'chat',
    route: '/api/ai/customer-flows/drafts',
    moduleId: 'ai-studio',
    moduleIds: ['ai-studio', 'sales', 'crm', 'finance'],
    allowEmptyPrompt: true,
    promptFrom: () => 'list customer flow drafts',
  },
  async ({ request, auth, finalize }) => {
    const pendingOnly = request.nextUrl.searchParams.get('pending') === '1'
    const flow = request.nextUrl.searchParams.get('flow') || undefined

    const drafts = await listCustomerFlowDrafts({
      tenantId: auth.tenantId,
      approvalStatus: pendingOnly ? 'pending' : undefined,
      flow: flow === 'sales-follow-up' || flow === 'gst-invoice-draft' ? flow : undefined,
      limit: 50,
    })

    const finalized = await finalize({
      text: `customer-flow-drafts:${drafts.length}`,
      modelProvider: 'customer-orchestrator',
    })

    return NextResponse.json({
      drafts,
      runbooks: listCustomerOrchestratorRunbooks(),
      total: drafts.length,
      interactionId: finalized.interactionId,
      runtimeVersion: finalized.runtimeVersion,
    })
  }
)
