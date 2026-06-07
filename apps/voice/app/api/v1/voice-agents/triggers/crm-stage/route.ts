/**
 * POST /api/v1/voice-agents/triggers/crm-stage
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { enqueueCrmStageCall, CRM_STAGE_TRIGGERS } from '@/lib/voice-agent/triggers/crm-stage-trigger'
import { resolveVoiceTriggerTenantId } from '@/lib/voice-agent/triggers/resolve-trigger-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  agentId: z.string().min(1),
  phone: z.string().min(10),
  stageTrigger: z.enum(CRM_STAGE_TRIGGERS),
  name: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveVoiceTriggerTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = bodySchema.parse(await request.json())
    const result = await enqueueCrmStageCall(prisma, { tenantId, ...parsed })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Trigger failed'
    return NextResponse.json({ error: message }, { status: message.includes('not found') ? 404 : 400 })
  }
}
