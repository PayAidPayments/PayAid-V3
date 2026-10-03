import { NextResponse } from 'next/server'
import { z } from 'zod'
import { wrapAiRoute } from '@/lib/security/ai-policy/wrap-ai-route'
import { runCustomerOrchestrator } from '@/lib/ai/customer-specialists'

const salesSchema = z.object({
  runbook: z.literal('sales-follow-up'),
  contactName: z.string().min(1),
  companyName: z.string().optional(),
  dealValueInr: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  sessionId: z.string().optional(),
})

const gstLineSchema = z.object({
  description: z.string().min(1),
  hsn: z.string().optional(),
  quantity: z.number().positive(),
  unitPriceInr: z.number().nonnegative(),
  gstRatePercent: z.number().min(0).max(28),
})

const gstSchema = z.object({
  runbook: z.literal('gst-invoice-draft'),
  customerName: z.string().min(1),
  customerGstin: z.string().optional(),
  supplierStateCode: z.string().min(2).max(2).optional(),
  placeOfSupplyStateCode: z.string().min(2).max(2).optional(),
  lineItems: z.array(gstLineSchema).min(1),
  customerId: z.string().optional(),
  notes: z.string().optional(),
  sessionId: z.string().optional(),
})

const bodySchema = z.discriminatedUnion('runbook', [salesSchema, gstSchema])

/**
 * POST /api/ai/customer-flows/orchestrate
 * Phase 4 thin orchestrator entry for customer runbooks.
 */
export const POST = wrapAiRoute(
  {
    surface: 'chat',
    route: '/api/ai/customer-flows/orchestrate',
    moduleId: 'ai-studio',
    moduleIds: ['ai-studio', 'sales', 'crm', 'finance'],
    bodySchema,
    modeFrom: () => 'draft',
    promptFrom: (body) => `orchestrate ${body.runbook}`,
    sessionIdFrom: (body) => body.sessionId,
  },
  async ({ body, auth, finalize }) => {
    const result = await runCustomerOrchestrator({
      auth: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        roles: auth.roles,
        licensedModules: auth.licensedModules,
      },
      payload: body,
    })

    const finalized = await finalize({
      text: result.allowed
        ? `orchestrated ${result.runbook} draft ${result.bundle?.draftId}`
        : `orchestrate denied:${result.reasonCode}`,
      modelProvider: 'customer-orchestrator',
    })

    const status = result.allowed
      ? 200
      : result.reasonCode === 'VALIDATION_ERROR'
        ? 400
        : 403

    return NextResponse.json(
      {
        ...result,
        interactionId: finalized.interactionId,
        runtimeVersion: finalized.runtimeVersion,
      },
      { status }
    )
  }
)
