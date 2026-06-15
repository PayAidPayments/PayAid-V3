/**
 * POST /api/v1/voice-agents/triggers/website-lead
 * Website / form capture → lead.triggered.call → campaign contact queue.
 *
 * Auth: session (ai-studio) OR x-voice-trigger-secret header when VOICE_TRIGGER_WEBHOOK_SECRET is set.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { enqueueWebsiteLeadCall } from '@/lib/voice-agent/triggers/website-lead-trigger'
import { resolveVoiceTriggerTenantId } from '@/lib/voice-agent/triggers/resolve-trigger-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  agentId: z.string().min(1),
  phone: z.string().min(10),
  name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  source: z.string().optional().default('website_form'),
  formId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveVoiceTriggerTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = bodySchema.parse(body)

    const result = await enqueueWebsiteLeadCall(prisma, {
      tenantId,
      agentId: parsed.agentId,
      phone: parsed.phone,
      name: parsed.name,
      email: parsed.email,
      source: parsed.source,
      formId: parsed.formId,
      metadata: parsed.metadata,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Trigger failed'
    const status = message.includes('not found') ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
