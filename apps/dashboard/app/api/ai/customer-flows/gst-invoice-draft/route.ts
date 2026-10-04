import { NextResponse } from 'next/server'
import { z } from 'zod'
import { wrapAiRoute } from '@/lib/security/ai-policy/wrap-ai-route'
import {
  loadCustomerSpecialistCatalog,
  runGstInvoiceDraftFlow,
} from '@/lib/ai/customer-specialists'

const lineItemSchema = z.object({
  description: z.string().min(1),
  hsn: z.string().optional(),
  quantity: z.number().positive(),
  unitPriceInr: z.number().nonnegative(),
  gstRatePercent: z.number().min(0).max(28),
})

const bodySchema = z.object({
  customerName: z.string().min(1),
  customerGstin: z.string().optional(),
  supplierStateCode: z.string().min(2).max(2).optional(),
  placeOfSupplyStateCode: z.string().min(2).max(2).optional(),
  lineItems: z.array(lineItemSchema).min(1),
  customerId: z.string().optional(),
  notes: z.string().optional(),
  sessionId: z.string().optional(),
})

/**
 * POST /api/ai/customer-flows/gst-invoice-draft
 * Phase 3: Bookkeeper GST invoice draft. Pending approval. Not issued/paid/filed.
 */
export const POST = wrapAiRoute(
  {
    surface: 'chat',
    route: '/api/ai/customer-flows/gst-invoice-draft',
    moduleId: 'finance',
    bodySchema,
    modeFrom: () => 'draft',
    sensitiveQuestion: true,
    promptFrom: (body) => `gst invoice draft for ${body.customerName}`,
    sessionIdFrom: (body) => body.sessionId,
  },
  async ({ body, auth, finalize }) => {
    const catalog = loadCustomerSpecialistCatalog()
    const result = await runGstInvoiceDraftFlow({
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
        ? `gst-invoice-draft ${result.bundle?.draftId}`
        : `gst-invoice-draft denied:${result.reasonCode}`,
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
