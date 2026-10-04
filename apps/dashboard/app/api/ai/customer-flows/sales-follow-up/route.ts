import { NextResponse } from 'next/server'
import { z } from 'zod'
import { wrapAiRoute } from '@/lib/security/ai-policy/wrap-ai-route'
import {
  loadCustomerSpecialistCatalog,
  runSalesFollowUpFlow,
} from '@/lib/ai/customer-specialists'

const bodySchema = z.object({
  contactName: z.string().min(1),
  companyName: z.string().optional(),
  dealValueInr: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  sessionId: z.string().optional(),
})

/**
 * POST /api/ai/customer-flows/sales-follow-up
 * Phase 3: Discovery → Deal score → Proposal drafts. Never sends.
 */
export const POST = wrapAiRoute(
  {
    surface: 'chat',
    route: '/api/ai/customer-flows/sales-follow-up',
    moduleId: 'sales',
    moduleIds: ['sales', 'crm'],
    bodySchema,
    modeFrom: () => 'draft',
    promptFrom: (body) =>
      `sales follow-up draft for ${body.contactName}${body.companyName ? ` @ ${body.companyName}` : ''}`,
    sessionIdFrom: (body) => body.sessionId,
  },
  async ({ body, auth, finalize }) => {
    const catalog = loadCustomerSpecialistCatalog()
    const result = await runSalesFollowUpFlow({
      catalog,
      auth: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        roles: auth.roles,
        licensedModules: auth.licensedModules,
      },
      input: body,
    })

    const finalized = await finalize({
      text: result.allowed
        ? `sales-follow-up draft ${result.bundle?.draftId}`
        : `sales-follow-up denied:${result.reasonCode}`,
      modelProvider: 'customer-flow-deterministic',
    })

    return NextResponse.json(
      {
        ...result,
        interactionId: finalized.interactionId,
        runtimeVersion: finalized.runtimeVersion,
      },
      { status: result.allowed ? 200 : result.reasonCode === 'VALIDATION_ERROR' ? 400 : 403 }
    )
  }
)
