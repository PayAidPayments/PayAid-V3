/**
 * POST /api/v1/voice-agents/triggers/marketing-lead
 * Facebook / LinkedIn lead ads → lead.triggered.call queue.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import {
  enqueueMarketingLeadCall,
  MARKETING_LEAD_SOURCES,
} from '@/lib/voice-agent/triggers/marketing-lead-trigger'
import { resolveVoiceTriggerTenantId } from '@/lib/voice-agent/triggers/resolve-trigger-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  agentId: z.string().min(1),
  phone: z.string().min(10),
  source: z.enum(MARKETING_LEAD_SOURCES),
  name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  platformLeadId: z.string().optional().nullable(),
  campaignName: z.string().optional().nullable(),
  hotLeadScore: z.number().min(0).max(100).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveVoiceTriggerTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = bodySchema.parse(await request.json())
    const result = await enqueueMarketingLeadCall(prisma, { tenantId, ...parsed })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Trigger failed'
    return NextResponse.json({ error: message }, { status: message.includes('not found') ? 404 : 400 })
  }
}
